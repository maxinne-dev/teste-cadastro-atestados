import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class IcdService {
  private readonly logger = new Logger(IcdService.name);
  private token: { value: string; expiresAt: number } | null = null;

  private async getToken(): Promise<string> {
    const clientId = process.env.WHO_ICD_CLIENT_ID;
    const clientSecret = process.env.WHO_ICD_CLIENT_SECRET;
    const tokenEndpoint = 'https://icdaccessmanagement.who.int/connect/token';

    if (!clientId || !clientSecret) {
      throw new Error('WHO ICD credentials are not configured.');
    }

    // reuse token if valid (~55 min safety window)
    const now = Math.floor(Date.now() / 1000);
    if (this.token && this.token.expiresAt - 300 > now) {
      return this.token.value;
    }

    const form = new URLSearchParams();
    form.set('grant_type', 'client_credentials');
    form.set('scope', 'icdapi_access');

    const authHeader = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const res = await axios.post(tokenEndpoint, form, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 10000,
    });

    const { access_token, expires_in } = res.data;
    this.token = { value: access_token, expiresAt: now + (expires_in || 3600) };
    return access_token;
  }

  async search(term: string) {
    if (!term || term.length < 2) return [];
    try {
      const token = await this.getToken();
      const url = `https://id.who.int/icd/release/11/2024-01/mms/search?flatResults=true&useFlexisearch=true&q=${encodeURIComponent(term)}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        timeout: 10000,
      });
      return res.data?.destinationEntities ?? [];
    } catch (err) {
      this.logger.error('ICD search failed', err as any);
      // Fallback: empty list to keep UI operando
      return [];
    }
  }
}
