import { Test } from '@nestjs/testing';
import { IcdService } from './icd.service';
import { IcdCacheService } from '../icd-cache/icd-cache.service';
import { CremespCid10Service } from './cremesp-cid10.service';
import axios from 'axios';

jest.mock('axios');

describe('IcdService', () => {
  let service: IcdService;
  let cache: jest.Mocked<Partial<IcdCacheService>>;
  let cremespCid10: jest.Mocked<Partial<CremespCid10Service>>;

  beforeEach(async () => {
    process.env.WHO_ICD_CLIENT_ID = 'x';
    process.env.WHO_ICD_CLIENT_SECRET = 'y';
    cache = {
      upsert: jest.fn(async () => ({}) as any),
      search: jest.fn(async () => []),
      findByCode: jest.fn(async () => null),
    };
    cremespCid10 = {
      validateCid10Code: jest.fn(async () => []),
    };

    const module = await Test.createTestingModule({
      providers: [
        IcdService, 
        { provide: IcdCacheService, useValue: cache },
        { provide: CremespCid10Service, useValue: cremespCid10 },
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
    expect(res).toEqual([{ code: 'B00', title: 'Herpesviral infection', source: 'cid11' }]);
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
    expect(res).toEqual([{ code: 'A00', title: 'Cholera', source: 'cid11' }]);
  });

  describe('CID-10 integration', () => {
    it('should validate CID-10 codes and fetch from ICD API', async () => {
      (cremespCid10.validateCid10Code as jest.Mock).mockResolvedValue(['F84', 'F84.0']);
      (axios.post as unknown as jest.Mock).mockResolvedValue({
        data: { access_token: 't', expires_in: 3600 },
      });
      (axios.get as unknown as jest.Mock)
        .mockResolvedValueOnce({
          data: { title: { '@value': 'Pervasive developmental disorders' } },
        })
        .mockResolvedValueOnce({
          data: { title: 'Childhood autism' },
        });

      const res = await service.search('F84');
      
      expect(cremespCid10.validateCid10Code).toHaveBeenCalledWith('F84');
      expect(res).toHaveLength(2);
      expect(res[0]).toEqual({
        code: 'F84',
        title: 'Pervasive developmental disorders',
        source: 'cid10',
      });
      expect(res[1]).toEqual({
        code: 'F84.0',
        title: 'Childhood autism',
        source: 'cid10',
      });
    });

    it('should fall back to CID-11 when CID-10 validation fails', async () => {
      (cremespCid10.validateCid10Code as jest.Mock).mockRejectedValue(new Error('CREMESP error'));
      (axios.post as unknown as jest.Mock).mockResolvedValue({
        data: { access_token: 't', expires_in: 3600 },
      });
      (axios.get as unknown as jest.Mock).mockResolvedValue({
        data: {
          destinationEntities: [
            { code: 'F84', title: { '@value': 'Some disorder' } },
          ],
        },
      });

      const res = await service.search('F84');
      
      expect(res).toEqual([{ code: 'F84', title: 'Some disorder', source: 'cid11' }]);
    });

    it('should use CID-11 for non-CID-10 pattern queries', async () => {
      (axios.post as unknown as jest.Mock).mockResolvedValue({
        data: { access_token: 't', expires_in: 3600 },
      });
      (axios.get as unknown as jest.Mock).mockResolvedValue({
        data: {
          destinationEntities: [
            { code: '6A02', title: { '@value': 'Autism spectrum disorder' } },
          ],
        },
      });

      const res = await service.search('autism');
      
      expect(cremespCid10.validateCid10Code).not.toHaveBeenCalled();
      expect(res).toEqual([{ code: '6A02', title: 'Autism spectrum disorder', source: 'cid11' }]);
    });

    it('should handle ICD API errors gracefully and use cache', async () => {
      (cremespCid10.validateCid10Code as jest.Mock).mockResolvedValue(['F84']);
      (axios.post as unknown as jest.Mock).mockResolvedValue({
        data: { access_token: 't', expires_in: 3600 },
      });
      (axios.get as unknown as jest.Mock).mockRejectedValue(new Error('API error'));
      (cache.findByCode as jest.Mock).mockResolvedValue({ 
        code: 'F84', 
        title: 'Cached title',
      });

      const res = await service.search('F84');
      
      expect(res).toEqual([{ code: 'F84', title: 'Cached title', source: 'cid10' }]);
    });
  });
});
