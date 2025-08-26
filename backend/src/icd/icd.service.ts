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
  private supportedVersions = (process.env.WHO_ICD_VERSIONS || '10,11')
    .split(',')
    .map(v => v.trim())
    .filter(v => ['10', '11'].includes(v));
  private preferredVersion = process.env.WHO_ICD_PREFERRED_VERSION || '10';

  constructor(private readonly cache: IcdCacheService) {
    // Ensure we always have at least one supported version
    if (this.supportedVersions.length === 0) {
      this.supportedVersions = ['10', '11'];
    }
    // Ensure preferred version is in supported versions
    if (!this.supportedVersions.includes(this.preferredVersion)) {
      this.preferredVersion = this.supportedVersions[0];
    }
  }

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

  private async searchVersion(term: string, version: string): Promise<Array<{ code: string; title: string; version: string }>> {
    if (!term || term.length < 2) return [];
    
    const searchUrl = `${this.baseRoot}/icd/release/${version}/${this.release}/mms/search?flatResults=true&useFlexisearch=true&q=${encodeURIComponent(term)}`;
    
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
        return { code, title, version };
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
        mapped.map((r) => this.cache.upsert(r.code, r.title, version, this.release)),
      );
      return mapped;
    } catch (err) {
      this.logger.error(`ICD search failed for version ${version}`, err as any);
      // Fallback to local cache for this version
      const cached = await this.cache.search(term, 10, version);
      return cached.map((c: any) => ({ code: c.code, title: c.title, version: c.version }));
    }
  }

  async search(term: string, version?: string) {
    if (!term || term.length < 2) return [];

    // If version is specified, search only that version
    if (version && this.supportedVersions.includes(version)) {
      return this.searchVersion(term, version);
    }

    // Search all supported versions, with preferred version first
    const versionsToSearch = [...this.supportedVersions];
    if (this.preferredVersion && this.preferredVersion !== versionsToSearch[0]) {
      const index = versionsToSearch.indexOf(this.preferredVersion);
      if (index > 0) {
        versionsToSearch.splice(index, 1);
        versionsToSearch.unshift(this.preferredVersion);
      }
    }

    const allResults = [];
    for (const v of versionsToSearch) {
      try {
        const results = await this.searchVersion(term, v);
        allResults.push(...results);
      } catch (err) {
        this.logger.warn(`Failed to search ICD version ${v}`, err as any);
      }
    }

    // Sort results with preferred version first, then by relevance
    allResults.sort((a, b) => {
      if (a.version === this.preferredVersion && b.version !== this.preferredVersion) {
        return -1;
      }
      if (b.version === this.preferredVersion && a.version !== this.preferredVersion) {
        return 1;
      }
      return 0;
    });

    return allResults;
  }
}
