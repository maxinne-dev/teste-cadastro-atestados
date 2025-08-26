import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IcdCacheService } from '../icd-cache/icd-cache.service.js';

@Injectable()
export class IcdService {
  private readonly logger = new Logger(IcdService.name);
  private token: { value: string; expiresAt: number } | null = null;
  private baseRoot = (
    process.env.WHO_ICD_BASE_URL || 'https://id.who.int'
  ).replace(/\/$/, '');
  private release = process.env.WHO_ICD_RELEASE || '2024-01';
  private language = process.env.WHO_ICD_LANGUAGE || 'en';

  constructor(private readonly cache: IcdCacheService) {}

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

  async search(term: string) {
    if (!term || term.length < 2) return [];
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
      // Deduplicate by code to avoid race conditions during parallel upserts
      const uniqueCodes = new Map<string, { code: string; title: string }>();
      mapped.forEach((r) => {
        uniqueCodes.set(r.code, r);
      });
      const deduplicated = Array.from(uniqueCodes.values());

      // Upsert in cache (best-effort)
      const upsertPromises = deduplicated.map(async (r) => {
        try {
          return await this.cache.upsert(r.code, r.title, this.release);
        } catch (err: any) {
          // Log duplicate key errors at debug level since they're expected in concurrent scenarios
          if (err?.code === 11000 || err?.message?.includes('E11000')) {
            this.logger.debug(`Duplicate key ignored for ICD code ${r.code}`);
          } else {
            this.logger.warn(
              `Failed to cache ICD code ${r.code}:`,
              err.message || err,
            );
          }
          return null;
        }
      });
      await Promise.allSettled(upsertPromises);
      return mapped;
    } catch (err) {
      this.logger.error(
        `ICD search failed for release ${this.release}`,
        err as any,
      );
      // Fallback to local cache
      const cached = await this.cache.search(term, 10);
      return cached.map((c: any) => ({ code: c.code, title: c.title }));
    }
  }
}
