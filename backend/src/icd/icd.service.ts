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

  private isCid10Code(term: string): boolean {
    // CID-10 codes follow patterns like: F84, F84.1, Z99, Z992, etc.
    return /^[A-Z]\d{2,3}(\.\d+)?$/.test(term.toUpperCase());
  }

  private extractCid10TopLevel(code: string): string {
    // Extract the first 3 characters (letter + 2 digits)
    return code.toUpperCase().substring(0, 3);
  }

  private async fetchCremeSpTable(): Promise<any[]> {
    try {
      const response = await axios.get('http://cremesp.org.br/resources/views/site_cid10_tabela.php', {
        timeout: 10000,
      });
      
      return this.parseCremeSpTable(response.data);
    } catch (error) {
      this.logger.error('Failed to fetch CREMESP table', error);
      return [];
    }
  }

  private parseCremeSpTable(html: string): any[] {
    const results = [];
    
    // Parse table rows using regex to extract CID-10 codes and descriptions
    const rowRegex = /<tr[^>]*>.*?<td[^>]*>([A-Z]\d{2})<\/td>.*?<td[^>]*id="td_descricao_(\d+)"[^>]*>(.*?)<\/td>.*?onclick="carregarConteudoCid10\((\d+)\)".*?<\/tr>/gis;
    
    let match;
    while ((match = rowRegex.exec(html)) !== null) {
      const [, code, , description, categoryId] = match;
      
      if (code && description && categoryId) {
        results.push({
          code: code.trim(),
          description: description.trim(),
          categoryId: parseInt(categoryId, 10)
        });
      }
    }
    
    return results;
  }

  private async fetchCremeSpSubcodes(categoryId: number): Promise<any[]> {
    try {
      const response = await axios.post('https://cremesp.org.br/resources/views/site_cid10_tabela.php', 
        new URLSearchParams({
          acao: 'carregarConteudoCid10',
          categoria_id: categoryId.toString()
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 8000,
        }
      );
      
      return this.parseCremeSpSubcodes(response.data);
    } catch (error) {
      this.logger.error(`Failed to fetch CREMESP subcodes for category ${categoryId}`, error);
      return [];
    }
  }

  private parseCremeSpSubcodes(html: string): any[] {
    const results = [];
    
    // Parse subcodes table rows
    const rowRegex = /<tr[^>]*>.*?<td[^>]*>([A-Z]\d{2}(?:\.\d+)?)<\/td>.*?<td[^>]*>(.*?)<\/td>.*?<\/tr>/gis;
    
    let match;
    while ((match = rowRegex.exec(html)) !== null) {
      const [, code, description] = match;
      
      if (code && description) {
        results.push({
          code: code.trim(),
          description: description.trim()
        });
      }
    }
    
    return results;
  }

  private async searchCid10(term: string): Promise<any[]> {
    const results = [];
    
    try {
      // Step 1: Fetch CREMESP main table
      const mainTable = await this.fetchCremeSpTable();
      
      if (this.isCid10Code(term)) {
        const topLevelCode = this.extractCid10TopLevel(term);
        
        // Find the matching top-level code
        const matchingEntry = mainTable.find(entry => entry.code === topLevelCode);
        
        if (matchingEntry) {
          // If it's just a top-level code (3 chars), return it
          if (term.length === 3) {
            results.push({
              code: matchingEntry.code,
              title: matchingEntry.description
            });
          } else {
            // Fetch subcodes for more specific codes
            const subcodes = await this.fetchCremeSpSubcodes(matchingEntry.categoryId);
            const exactMatch = subcodes.find(sub => sub.code.toUpperCase() === term.toUpperCase());
            
            if (exactMatch) {
              results.push({
                code: exactMatch.code,
                title: exactMatch.description
              });
            }
          }
        }
      } else {
        // Search by description in main table
        const searchTerm = term.toLowerCase();
        const matches = mainTable.filter(entry => 
          entry.description.toLowerCase().includes(searchTerm)
        );
        
        // Add top-level matches
        results.push(...matches.map(match => ({
          code: match.code,
          title: match.description
        })));
        
        // Also search in subcodes for better coverage
        for (const entry of mainTable.slice(0, 10)) { // Limit to avoid too many requests
          const subcodes = await this.fetchCremeSpSubcodes(entry.categoryId);
          const subMatches = subcodes.filter(sub => 
            sub.description.toLowerCase().includes(searchTerm)
          );
          
          results.push(...subMatches.map(match => ({
            code: match.code,
            title: match.description
          })));
        }
      }
    } catch (error) {
      this.logger.error('CID-10 search failed', error);
    }
    
    return results.slice(0, 20); // Limit results
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

  async search(term: string) {
    if (!term || term.length < 2) return [];

    // Step 1: Try CID-10 search first using CREMESP
    const cid10Results = await this.searchCid10(term);
    
    // Step 2: For CID-10 codes found, validate them on WHO ICD API
    const validatedCid10Results = [];
    for (const result of cid10Results) {
      try {
        const validatedResult = await this.validateOnIcdApi(result.code);
        if (validatedResult) {
          validatedCid10Results.push({
            code: result.code,
            title: validatedResult.title || result.title
          });
        } else {
          // If validation fails, use CREMESP data
          validatedCid10Results.push(result);
        }
      } catch (error) {
        // If validation fails, use CREMESP data
        validatedCid10Results.push(result);
      }
    }

    // Step 3: If CID-10 search found results, return them
    if (validatedCid10Results.length > 0) {
      // Cache the results (best-effort)
      await Promise.all(
        validatedCid10Results.map((r) => this.cache.upsert(r.code, r.title, 'cid-10')),
      );
      return validatedCid10Results;
    }

    // Step 4: Fallback to existing CID-11 search
    return this.searchCid11(term);
  }

  private async validateOnIcdApi(code: string): Promise<{ code: string; title: string } | null> {
    try {
      const token = await this.getToken();
      const searchUrl = `${this.baseRoot}/icd/release/11/${this.release}/mms/search?flatResults=true&useFlexisearch=true&q=${encodeURIComponent(code)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Accept-Language': this.language,
          'API-Version': 'v2',
        },
        timeout: 8000,
      });

      const destinations = response.data?.destinationEntities ?? [];
      const exactMatch = destinations.find((entity: any) => {
        const entityCode = entity.code || entity.theCode || entity.id || entity.codeId || '';
        return entityCode === code;
      });

      if (exactMatch) {
        const title = (exactMatch.title && (exactMatch.title['@value'] || exactMatch.title.value || exactMatch.title)) ||
          exactMatch.name ||
          exactMatch.label ||
          '';
        return { code, title };
      }

      return null;
    } catch (error) {
      this.logger.warn(`Failed to validate code ${code} on ICD API`, error);
      return null;
    }
  }

  private async searchCid11(term: string) {
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
