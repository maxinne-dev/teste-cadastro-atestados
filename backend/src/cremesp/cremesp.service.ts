import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { load } from 'cheerio';

interface Cid10Entry {
  code: string;
  description: string;
  internalId?: string;
}

@Injectable()
export class CremespService {
  private readonly logger = new Logger(CremespService.name);
  private readonly baseUrl = 'http://cremesp.org.br/resources/views/site_cid10_tabela.php';
  private mainTableCache: Cid10Entry[] | null = null;
  private cacheExpiry: number = 0;
  private readonly cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Fetch the main CID-10 table from CREMESP
   */
  private async fetchMainTable(): Promise<Cid10Entry[]> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.mainTableCache && this.cacheExpiry > now) {
      return this.mainTableCache;
    }

    try {
      this.logger.debug('Fetching main CID-10 table from CREMESP');
      const response = await axios.get(this.baseUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Medical System)',
        },
      });

      const $ = load(response.data);
      const entries: Cid10Entry[] = [];

      // Parse table rows
      $('table tr').each((_, row) => {
        const $row = $(row);
        const cells = $row.find('td');
        
        if (cells.length >= 3) {
          const code = $(cells[0]).text().trim();
          const description = $(cells[1]).text().trim();
          const buttonHtml = $(cells[2]).html() || '';
          
          // Extract internal ID from button onclick
          const match = buttonHtml.match(/carregarConteudoCid10\((\d+)\)/);
          const internalId = match ? match[1] : undefined;
          
          if (code && description) {
            entries.push({ code, description, internalId });
          }
        }
      });

      // Cache the results
      this.mainTableCache = entries;
      this.cacheExpiry = now + this.cacheTimeout;
      
      this.logger.debug(`Cached ${entries.length} CID-10 entries from CREMESP`);
      return entries;
      
    } catch (error) {
      this.logger.error('Failed to fetch CREMESP main table', error);
      return this.mainTableCache || [];
    }
  }

  /**
   * Fetch sub-items for a category using internal ID
   */
  private async fetchSubItems(internalId: string): Promise<Cid10Entry[]> {
    try {
      this.logger.debug(`Fetching CID-10 sub-items for category ${internalId}`);
      
      const formData = new URLSearchParams();
      formData.set('acao', 'carregarConteudoCid10');
      formData.set('categoria_id', internalId);

      const response = await axios.post(this.baseUrl, formData, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (compatible; Medical System)',
        },
      });

      const $ = load(response.data);
      const entries: Cid10Entry[] = [];

      // Parse response table
      $('table tr').each((_, row) => {
        const $row = $(row);
        const cells = $row.find('td');
        
        if (cells.length >= 2) {
          const code = $(cells[0]).text().trim();
          const description = $(cells[1]).text().trim();
          
          if (code && description) {
            entries.push({ code, description });
          }
        }
      });

      this.logger.debug(`Found ${entries.length} sub-items for category ${internalId}`);
      return entries;
      
    } catch (error) {
      this.logger.error(`Failed to fetch sub-items for category ${internalId}`, error);
      return [];
    }
  }

  /**
   * Search for CID-10 codes using CREMESP data
   */
  async searchCid10(query: string): Promise<Cid10Entry[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const trimmedQuery = query.trim().toUpperCase();
    const mainTable = await this.fetchMainTable();
    
    // Strategy 1: Exact three-character code (e.g., "F84", "Z99", "Z992")
    if (trimmedQuery.length <= 3 && /^[A-Z]\d{1,2}$/.test(trimmedQuery)) {
      return mainTable.filter(entry => 
        entry.code.toUpperCase() === trimmedQuery
      );
    }
    
    // Strategy 2: Code with dot or more than three chars (e.g., "F84.1", "Z991")
    if (trimmedQuery.length > 3 || trimmedQuery.includes('.')) {
      const firstThreeChars = trimmedQuery.substring(0, 3);
      const matchingMainEntry = mainTable.find(entry => 
        entry.code.toUpperCase() === firstThreeChars
      );
      
      if (matchingMainEntry && matchingMainEntry.internalId) {
        const subItems = await this.fetchSubItems(matchingMainEntry.internalId);
        return subItems.filter(entry => 
          entry.code.toUpperCase().includes(trimmedQuery.replace('.', '')) ||
          entry.code.toUpperCase() === trimmedQuery.replace('.', '')
        );
      }
    }
    
    // Strategy 3: Non-conforming query - search in main table descriptions
    return mainTable.filter(entry => 
      entry.code.toUpperCase().includes(trimmedQuery) ||
      entry.description.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10); // Limit results
  }
}