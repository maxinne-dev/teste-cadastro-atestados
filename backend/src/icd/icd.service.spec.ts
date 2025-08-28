import { Test } from '@nestjs/testing';
import { IcdService } from './icd.service';
import { IcdCacheService } from '../icd-cache/icd-cache.service';
import { CremespService } from '../cremesp/cremesp.service';
import axios from 'axios';

jest.mock('axios');

describe('IcdService', () => {
  let service: IcdService;
  let cache: jest.Mocked<Partial<IcdCacheService>>;
  let cremesp: jest.Mocked<Partial<CremespService>>;

  beforeEach(async () => {
    process.env.WHO_ICD_CLIENT_ID = 'x';
    process.env.WHO_ICD_CLIENT_SECRET = 'y';
    cache = {
      upsert: jest.fn(async () => ({}) as any),
      search: jest.fn(async () => []),
    };
    cremesp = {
      searchCid10: jest.fn(async () => []),
    };

    const module = await Test.createTestingModule({
      providers: [
        IcdService,
        { provide: IcdCacheService, useValue: cache },
        { provide: CremespService, useValue: cremesp },
      ],
    }).compile();

    service = module.get(IcdService);
    (axios.post as unknown as jest.Mock).mockReset();
    (axios.get as unknown as jest.Mock).mockReset();
  });

  it('search fetches WHO results and upserts cache', async () => {
    // eslint-disable-next-line no-unexpected-multiline
    (axios.post as unknown as jest.Mock).mockResolvedValue({
      data: { access_token: 't', expires_in: 3600 },
    });
    (axios.get as unknown as jest.Mock).mockResolvedValue({
      data: {
        destinationEntities: [
          { theCode: 'J06.9', title: { '@value': 'URI, unspecified' } },
          { code: 'A00', title: 'Cholera' },
        ],
      },
    });

    const res = await service.search('chol');
    expect(res.length).toBeGreaterThanOrEqual(2);
    expect(cache.upsert).toHaveBeenCalled();
    // token cached: second call should not call axios.post again
    await service.search('cold');
    expect((axios.post as any).mock.calls.length).toBe(1);
  });

  it('fallback returns cached suggestions when WHO fails', async () => {
    // eslint-disable-next-line no-unexpected-multiline
    (axios.post as unknown as jest.Mock).mockResolvedValue({
      data: { access_token: 't', expires_in: 3600 },
    });
    (axios.get as unknown as jest.Mock).mockRejectedValue(new Error('network'));
    (cache.search as jest.Mock).mockResolvedValue([
      { code: 'B00', title: 'Herpesviral infection' },
    ]);
    const res = await service.search('herp');
    expect(res).toEqual([{ code: 'B00', title: 'Herpesviral infection' }]);
  });

  // eslint-disable-next-line no-unexpected-multiline
  it('retries once on 401 then succeeds', async () => {
    (axios.post as unknown as jest.Mock).mockResolvedValue({
      data: { access_token: 't', expires_in: 3600 },
    });
    (axios.get as unknown as jest.Mock)
      .mockRejectedValueOnce({ response: { status: 401 } })
      .mockResolvedValueOnce({
        data: { destinationEntities: [{ code: 'A00', title: 'Cholera' }] },
      });
    const res = await service.search('cho');
    expect(res).toEqual([{ code: 'A00', title: 'Cholera' }]);
  });

  // CID-10 specific tests
  describe('CID-10 functionality', () => {
    it('should detect CID-10 patterns correctly and only return WHO-validated results', async () => {
      // Mock CREMESP results
      (cremesp.searchCid10 as jest.Mock).mockResolvedValue([
        { code: 'F84', description: 'Transtornos globais do desenvolvimento' }
      ]);

      // Mock token request
      (axios.post as unknown as jest.Mock).mockResolvedValue({
        data: { access_token: 't', expires_in: 3600 },
      });

      // Mock CID-10 validation failure - should return empty results
      (axios.get as unknown as jest.Mock).mockRejectedValue(new Error('CID-10 not found'));

      const result = await service.search('F84');
      
      // Should return empty array since WHO validation failed
      expect(result).toEqual([]);
      expect(cremesp.searchCid10).toHaveBeenCalledWith('F84');
    });

    it('should handle CID-10 codes with dots and only return WHO-validated results', async () => {
      (cremesp.searchCid10 as jest.Mock).mockResolvedValue([
        { code: 'F84.1', description: 'Autismo atípico' }
      ]);

      (axios.post as unknown as jest.Mock).mockResolvedValue({
        data: { access_token: 't', expires_in: 3600 },
      });

      // Mock WHO validation failure - should return empty results
      (axios.get as unknown as jest.Mock).mockRejectedValue(new Error('Not found'));

      const result = await service.search('F84.1');
      
      // Should return empty array since WHO validation failed
      expect(result).toEqual([]);
    });

    it('should validate CID-10 codes with WHO API when available', async () => {
      (cremesp.searchCid10 as jest.Mock).mockResolvedValue([
        { code: 'F84', description: 'CREMESP Description' }
      ]);

      (axios.post as unknown as jest.Mock).mockResolvedValue({
        data: { access_token: 't', expires_in: 3600 },
      });

      // Mock successful WHO CID-10 validation
      (axios.get as unknown as jest.Mock).mockResolvedValue({
        data: { title: { '@value': 'WHO Validated Description' } },
      });

      const result = await service.search('F84');
      
      expect(result).toEqual([{
        code: 'F84',
        title: 'WHO Validated Description',
      }]);
    });

    it('should continue to work with CID-11 for non-CID-10 patterns', async () => {
      // Mock CID-11 search
      (axios.post as unknown as jest.Mock).mockResolvedValue({
        data: { access_token: 't', expires_in: 3600 },
      });
      
      (axios.get as unknown as jest.Mock).mockResolvedValue({
        data: {
          destinationEntities: [
            { theCode: 'JA65', title: { '@value': 'Some CID-11 condition' } },
          ],
        },
      });

      const result = await service.search('some condition');
      
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('JA65');
      expect(cremesp.searchCid10).not.toHaveBeenCalled();
    });
  });
});
