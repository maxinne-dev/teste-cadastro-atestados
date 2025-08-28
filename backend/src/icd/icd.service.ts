import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IcdCacheService } from '../icd-cache/icd-cache.service.js';
import { CremespService } from '../cremesp/cremesp.service.js';

@Injectable()
export class IcdService {
  private readonly logger = new Logger(IcdService.name);
  private token: { value: string; expiresAt: number } | null = null;
  private baseRoot = (
    process.env.WHO_ICD_BASE_URL || 'https://id.who.int'
  ).replace(/\/$/, '');
  private release = process.env.WHO_ICD_RELEASE || '2024-01';
  private language = process.env.WHO_ICD_LANGUAGE || 'en';

  constructor(
    private readonly cache: IcdCacheService,
    private readonly cremesp: CremespService,
  ) {}

  private async getToken(): Promise<string> {
    const clientId = process.env.WHO_ICD_CLIENT_ID;
    const clientSecret = process.env.WHO_ICD_CLIENT_SECRET;
    const tokenEndpoint = 'https://icdaccessmanagement.who.int/connect/token';

    if (!clientId || !clientSecret) {
      throw new Error('WHO ICD credentials are not configured.');
    }

    // reuse token if valid (~55 min safety window + clock skew buffer)
    const now = Math.floor(Date.now() / 1000);
    if (this.token && this.token.expiresAt - 300 > now) {
      return this.token.value;
    }

    const form = new URLSearchParams();
    form.set('grant_type', 'client_credentials');
    form.set('scope', 'icdapi_access');

    const authHeader =
      'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const res = await axios.post(tokenEndpoint, form, {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      timeout: 10000,
    });

    const { access_token, expires_in } = res.data;
    this.token = { value: access_token, expiresAt: now + (expires_in || 3600) };
    return access_token;
  }

  /**
   * Detect if a search term looks like a CID-10 code
   */
  private isCid10Pattern(term: string): boolean {
    const trimmed = term.trim().toUpperCase();
    // CID-10 patterns: Letter followed by digits, optionally with dots
    // Examples: F84, F84.1, Z99.9, A00-A99, etc.
    return /^[A-Z]\d{1,3}(\.\d{1,2})?$/.test(trimmed);
  }

  /**
   * Validate a CID-10 code with WHO ICD API (try CID-10 endpoint first)
   */
  private async validateCid10WithIcd(code: string): Promise<{ code: string; title: string } | null> {
    try {
      // Try CID-10 validation endpoint first
      const cid10Url = `${this.baseRoot}/icd/release/10/2019/mms/codeinfo?code=${encodeURIComponent(code)}`;
      
      const token = await this.getToken();
      const response = await axios.get(cid10Url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Accept-Language': this.language,
          'API-Version': 'v2',
        },
        timeout: 8000,
      });

      if (response.data) {
        const title = response.data.title?.['@value'] || 
                     response.data.title?.value || 
                     response.data.title || 
                     response.data.label || '';
        
        if (title) {
          return { code, title };
        }
      }
    } catch (error: any) {
      this.logger.debug(`CID-10 validation failed for ${code}`, error.message);
    }

    return null;
  }

  /**
   * Search CID-10 codes via CREMESP and validate with ICD API
   */
  private async searchCid10(term: string) {
    try {
      const cremespResults = await this.cremesp.searchCid10(term);
      const validatedResults = [];

      for (const entry of cremespResults) {
        // First try to validate with WHO ICD API
        const validated = await this.validateCid10WithIcd(entry.code);
        
        if (validated) {
          validatedResults.push(validated);
        } else {
          // If WHO validation fails, use CREMESP data directly
          validatedResults.push({
            code: entry.code,
            title: entry.description,
          });
        }
        
        // Break early if we have enough results
        if (validatedResults.length >= 10) break;
      }

      return validatedResults;
    } catch (error) {
      this.logger.error('CID-10 search via CREMESP failed', error);
      return [];
    }
  }

  async search(term: string) {
    if (!term || term.length < 2) return [];

    // Check if this looks like a CID-10 code and route accordingly
    if (this.isCid10Pattern(term)) {
      this.logger.debug(`Detected CID-10 pattern for term: ${term}`);
      return this.searchCid10(term);
    }

    // Default to CID-11 search for non-CID-10 patterns
    const searchUrl = `${this.baseRoot}/icd/release/11/${this.release}/mms/search?flatResults=true&useFlexisearch=true&q=${encodeURIComponent(
      term,
    )}`;
    const tryFetch = async () => {
      const token = await this.getToken();
      return axios.get(searchUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Accept-Language': this.language,
          'API-Version': 'v2',
        },
        timeout: 8000,
      });
    };

    const mapResults = (items: any[]) => {
      const arr = Array.isArray(items) ? items : [];
      return arr.map((e) => {
        const code = e.code || e.theCode || e.id || e.codeId || '';
        const title =
          (e.title && (e.title['@value'] || e.title.value || e.title)) ||
          e.name ||
          e.label ||
          '';
        return { code, title };
      });
    };

    try {
      let res;
      try {
        res = await tryFetch();
      } catch (err: any) {
        // If unauthorized, refresh token and retry once
        if (err?.response?.status === 401) {
          this.token = null;
          res = await tryFetch();
        } else {
          throw err;
        }
      }
      const dest = res.data?.destinationEntities ?? [];
      const mapped = mapResults(dest).filter((r) => r.code && r.title);
      // Upsert in cache (best-effort)
      await Promise.all(
        mapped.map((r) => this.cache.upsert(r.code, r.title, this.release)),
      );
      return mapped;
    } catch (err) {
      this.logger.error('ICD search failed', err as any);
      // Fallback to local cache
      const cached = await this.cache.search(term, 10);
      return cached.map((c: any) => ({ code: c.code, title: c.title }));
    }
  }
}
