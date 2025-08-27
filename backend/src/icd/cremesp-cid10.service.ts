import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { JSDOM } from 'jsdom';

export interface CremespCid10Entry {
  code: string;
  internalId?: string;
}

@Injectable()
export class CremespCid10Service {
  private readonly logger = new Logger(CremespCid10Service.name);
  private readonly baseUrl = 'http://cremesp.org.br/resources/views/site_cid10_tabela.php';
  private cache: Map<string, CremespCid10Entry[]> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  private isValidCid10Pattern(code: string): boolean {
    // Matches CID-10 patterns: Letter + 2 digits (A00-Z99) or with additional digits/dot
    return /^[A-Z]\d{2}(\.\d+|\d*)?$/i.test(code);
  }

  private extractBaseCode(code: string): string {
    // Extract first 3 characters (letter + 2 digits) from codes like F84.1 or Z991
    const match = code.match(/^([A-Z]\d{2})/i);
    return match ? match[1].toUpperCase() : code;
  }

  private async fetchMainTable(): Promise<CremespCid10Entry[]> {
    try {
      const response = await axios.get(this.baseUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Medical Certificate System)',
        },
      });

      const dom = new JSDOM(response.data);
      const document = dom.window.document;
      const rows = document.querySelectorAll('tr');
      const entries: CremespCid10Entry[] = [];

      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          const codeCell = cells[0];
          const buttonCell = cells[2];

          const code = codeCell.textContent?.trim();

          if (code && this.isValidCid10Pattern(code)) {
            // Extract internal ID from button onclick
            const button = buttonCell.querySelector('button');
            const onclick = button?.getAttribute('onclick');
            const internalIdMatch = onclick?.match(/carregarConteudoCid10\((\d+)\)/);
            const internalId = internalIdMatch ? internalIdMatch[1] : undefined;

            entries.push({
              code: code.toUpperCase(),
              internalId,
            });
          }
        }
      });

      return entries;
    } catch (error) {
      this.logger.error('Failed to fetch CREMESP CID-10 table', error);
      throw error;
    }
  }

  private async fetchSubCodes(internalId: string): Promise<CremespCid10Entry[]> {
    try {
      const formData = new URLSearchParams();
      formData.append('acao', 'carregarConteudoCid10');
      formData.append('categoria_id', internalId);

      const response = await axios.post(this.baseUrl, formData, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (compatible; Medical Certificate System)',
        },
      });

      const dom = new JSDOM(response.data);
      const document = dom.window.document;
      const rows = document.querySelectorAll('tr');
      const subEntries: CremespCid10Entry[] = [];

      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const code = cells[0].textContent?.trim();

          if (code && this.isValidCid10Pattern(code)) {
            subEntries.push({
              code: code.toUpperCase(),
            });
          }
        }
      });

      return subEntries;
    } catch (error) {
      this.logger.error(`Failed to fetch sub-codes for internal ID ${internalId}`, error);
      return [];
    }
  }

  private async getCachedMainTable(): Promise<CremespCid10Entry[]> {
    const now = Date.now();
    const cacheKey = 'main_table';

    if (this.cache.has(cacheKey) && now - this.cacheTimestamp < this.CACHE_TTL) {
      return this.cache.get(cacheKey) || [];
    }

    const entries = await this.fetchMainTable();
    this.cache.set(cacheKey, entries);
    this.cacheTimestamp = now;
    return entries;
  }

  async validateCid10Code(code: string): Promise<string[]> {
    if (!code || code.length < 2) {
      return [];
    }

    const normalizedCode = code.toUpperCase().trim();

    try {
      const mainTable = await this.getCachedMainTable();

      // If query is a short code pattern (like F84, Z99)
      if (normalizedCode.length === 3 && this.isValidCid10Pattern(normalizedCode)) {
        const entry = mainTable.find(e => e.code === normalizedCode);
        if (entry && entry.internalId) {
          // Get sub-codes and return all valid codes
          const subCodes = await this.fetchSubCodes(entry.internalId);
          return [entry.code, ...subCodes.map(sc => sc.code)];
        }
        return entry ? [entry.code] : [];
      }

      // If query has dots or is longer (like F84.1, Z991)
      if (this.isValidCid10Pattern(normalizedCode)) {
        const baseCode = this.extractBaseCode(normalizedCode);
        const entry = mainTable.find(e => e.code === baseCode);
        
        if (entry && entry.internalId) {
          const subCodes = await this.fetchSubCodes(entry.internalId);
          // Check if the specific code exists in sub-codes
          const exactMatch = subCodes.find(sc => sc.code === normalizedCode);
          if (exactMatch) {
            return [exactMatch.code];
          }
          // If not found, return empty (invalid code)
          return [];
        }
        return entry && entry.code === normalizedCode ? [entry.code] : [];
      }

      return [];
    } catch (error) {
      this.logger.error('CID-10 validation failed', error);
      return [];
    }
  }
}