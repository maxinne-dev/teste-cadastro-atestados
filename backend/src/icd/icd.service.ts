import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
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
  private cremespBaseUrl = 'http://cremesp.org.br/resources/views/site_cid10_tabela.php';

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

  /**
   * Check if the search term appears to be a CID-10 code
   */
  private isCid10Code(term: string): boolean {
    if (!term || term.length < 3) return false;
    
    // Pattern: Letter followed by numbers, optionally with dots
    // Examples: F69, Z99, F84.1, Z991, etc.
    const cid10Pattern = /^[A-Z]\d{2,3}(\.\d+)?$/i;
    return cid10Pattern.test(term);
  }

  /**
   * Extract the base CID-10 code (first 3 characters)
   */
  private getBaseCid10Code(term: string): string {
    if (!term || term.length < 3) return '';
    return term.substring(0, 3).toUpperCase();
  }

  /**
   * Fetch and parse CREMESP CID-10 main table
   */
  private async fetchCremespTable(): Promise<Array<{ code: string; description: string; categoryId?: string }>> {
    try {
      const response = await axios.get(this.cremespBaseUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ICD-Service/1.0)',
        },
      });

      const $ = cheerio.load(response.data);
      const results: Array<{ code: string; description: string; categoryId?: string }> = [];

      // Parse table rows
      $('table tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 3) {
          const code = $(cells[0]).text().trim();
          const description = $(cells[1]).text().trim();
          
          // Extract category ID from the button onclick if present
          const button = $(cells[2]).find('button');
          let categoryId: string | undefined;
          if (button.length > 0) {
            const onclick = button.attr('onclick') || '';
            const match = onclick.match(/carregarConteudoCid10\((\d+)\)/);
            if (match) {
              categoryId = match[1];
            }
          }

          if (code && description) {
            results.push({ code, description, categoryId });
          }
        }
      });

      return results;
    } catch (error) {
      this.logger.error('Failed to fetch CREMESP table', error as any);
      return [];
    }
  }

  /**
   * Fetch sub-codes for a specific category from CREMESP
   */
  private async fetchCremespSubCodes(categoryId: string): Promise<Array<{ code: string; description: string }>> {
    try {
      const response = await axios.post(this.cremespBaseUrl, 
        new URLSearchParams({
          acao: 'carregarConteudoCid10',
          categoria_id: categoryId,
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (compatible; ICD-Service/1.0)',
          },
          timeout: 8000,
        });

      const $ = cheerio.load(response.data);
      const results: Array<{ code: string; description: string }> = [];

      // Parse sub-code table rows
      $('table tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 2) {
          const code = $(cells[0]).text().trim();
          const description = $(cells[1]).text().trim();

          if (code && description) {
            results.push({ code, description });
          }
        }
      });

      return results;
    } catch (error) {
      this.logger.error(`Failed to fetch CREMESP sub-codes for category ${categoryId}`, error as any);
      return [];
    }
  }

  /**
   * Search for CID-10 codes using CREMESP data
   */
  private async searchCid10(term: string): Promise<Array<{ code: string; title: string }>> {
    try {
      const baseCode = this.getBaseCid10Code(term);
      if (!baseCode) return [];

      // First, get the main table
      const mainTable = await this.fetchCremespTable();
      if (mainTable.length === 0) return [];

      // Find the matching base code entry
      const baseEntry = mainTable.find(entry => 
        entry.code.toUpperCase() === baseCode
      );

      if (!baseEntry) return [];

      // If the search term is just the base code (like "F69"), return the base entry
      if (term.length <= 3) {
        return [{ code: baseEntry.code, title: baseEntry.description }];
      }

      // If we have a more specific code (like "F84.1") and we have a category ID, fetch sub-codes
      if (baseEntry.categoryId) {
        const subCodes = await this.fetchCremespSubCodes(baseEntry.categoryId);
        
        // Look for exact match in sub-codes
        const exactMatch = subCodes.find(sub => 
          sub.code.toUpperCase() === term.toUpperCase()
        );

        if (exactMatch) {
          return [{ code: exactMatch.code, title: exactMatch.description }];
        }

        // If no exact match but we have sub-codes, return all sub-codes for this base
        if (subCodes.length > 0) {
          return subCodes.map(sub => ({ code: sub.code, title: sub.description }));
        }
      }

      // Fallback to base entry
      return [{ code: baseEntry.code, title: baseEntry.description }];

    } catch (error) {
      this.logger.error('CID-10 search failed', error as any);
      return [];
    }
  }

  async search(term: string) {
    if (!term || term.length < 2) return [];

    // First, check if this appears to be a CID-10 code
    if (this.isCid10Code(term)) {
      this.logger.log(`Attempting CID-10 search for term: ${term}`);
      
      try {
        const cid10Results = await this.searchCid10(term);
        
        if (cid10Results.length > 0) {
          // Try to validate the found codes with WHO ICD API
          // We'll search for the code in ICD-10 release if available
          const validatedResults = await this.validateWithWhoIcd(cid10Results);
          
          if (validatedResults.length > 0) {
            // Cache the validated results
            await Promise.all(
              validatedResults.map((r) => this.cache.upsert(r.code, r.title, 'cid-10')),
            );
            return validatedResults;
          }

          // If WHO validation fails, return CREMESP results
          // Cache them as well
          await Promise.all(
            cid10Results.map((r) => this.cache.upsert(r.code, r.title, 'cid-10')),
          );
          return cid10Results;
        }
      } catch (error) {
        this.logger.warn(`CID-10 search failed for term: ${term}`, error as any);
        // Continue to CID-11 search as fallback
      }
    }

    // Original CID-11 search logic
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

  /**
   * Try to validate CID-10 codes with WHO ICD API
   */
  private async validateWithWhoIcd(cid10Results: Array<{ code: string; title: string }>): Promise<Array<{ code: string; title: string }>> {
    try {
      // Try to search for each code in ICD-10 or ICD-11
      // This is a best-effort validation
      const validatedResults: Array<{ code: string; title: string }> = [];

      for (const result of cid10Results) {
        try {
          // Try searching for the code directly
          const searchUrl = `${this.baseRoot}/icd/release/11/${this.release}/mms/search?flatResults=true&useFlexisearch=true&q=${encodeURIComponent(result.code)}`;
          const token = await this.getToken();
          
          const response = await axios.get(searchUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
              'Accept-Language': this.language,
              'API-Version': 'v2',
            },
            timeout: 5000,
          });

          const dest = response.data?.destinationEntities ?? [];
          if (dest.length > 0) {
            // Found matching result in WHO API
            const whoResult = dest[0];
            const whoCode = whoResult.code || whoResult.theCode || whoResult.id || whoResult.codeId || result.code;
            const whoTitle = (whoResult.title && (whoResult.title['@value'] || whoResult.title.value || whoResult.title)) ||
                            whoResult.name || whoResult.label || result.title;
            
            validatedResults.push({ code: whoCode, title: whoTitle });
          } else {
            // Not found in WHO API, keep original CREMESP data
            validatedResults.push(result);
          }
        } catch (error) {
          // If individual validation fails, keep the original result
          validatedResults.push(result);
        }
      }

      return validatedResults;
    } catch (error) {
      this.logger.warn('WHO ICD validation failed', error as any);
      // Return original results if validation completely fails
      return cid10Results;
    }
  }
}
