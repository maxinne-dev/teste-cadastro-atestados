import { Test } from '@nestjs/testing';
import { IcdService } from './icd.service';
import { IcdCacheService } from '../icd-cache/icd-cache.service';
import axios from 'axios';

jest.mock('axios');

describe('IcdService', () => {
  let service: IcdService;
  let cache: jest.Mocked<Partial<IcdCacheService>>;

  beforeEach(async () => {
    process.env.WHO_ICD_CLIENT_ID = 'x';
    process.env.WHO_ICD_CLIENT_SECRET = 'y';
    process.env.WHO_ICD_VERSIONS = '10,11';
    process.env.WHO_ICD_PREFERRED_VERSION = '10';
    cache = {
      upsert: jest.fn(async () => ({}) as any),
      search: jest.fn(async () => []),
    };

    const module = await Test.createTestingModule({
      providers: [IcdService, { provide: IcdCacheService, useValue: cache }],
    }).compile();

    service = module.get(IcdService);
    (axios.post as unknown as jest.Mock).mockReset();
    (axios.get as unknown as jest.Mock).mockReset();
  });

  it('search fetches WHO results and upserts cache for both versions', async () => {
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
    // Should search both versions when no version specified
    expect((axios.get as any).mock.calls.length).toBe(2);
    
    // token cached: second call should not call axios.post again
    await service.search('cold');
    expect((axios.post as any).mock.calls.length).toBe(1);
  });

  it('search with specific version only searches that version', async () => {
    (axios.post as unknown as jest.Mock).mockResolvedValue({
      data: { access_token: 't', expires_in: 3600 },
    });
    (axios.get as unknown as jest.Mock).mockResolvedValue({
      data: {
        destinationEntities: [
          { theCode: 'A00', title: { '@value': 'Cholera' } },
        ],
      },
    });

    const res = await service.search('cholera', '10');
    expect(res.length).toBe(1);
    expect(res[0].version).toBe('10');
    // Should only make one API call for specified version
    expect((axios.get as any).mock.calls.length).toBe(1);
    expect((axios.get as any).mock.calls[0][0]).toContain('/icd/release/10/');
  });

  it('fallback returns cached suggestions when WHO fails', async () => {
    // eslint-disable-next-line no-unexpected-multiline
    (axios.post as unknown as jest.Mock).mockResolvedValue({
      data: { access_token: 't', expires_in: 3600 },
    });
    (axios.get as unknown as jest.Mock).mockRejectedValue(new Error('network'));
    (cache.search as jest.Mock)
      .mockResolvedValueOnce([
        { code: 'B00', title: 'Herpesviral infection', version: '10' },
      ])
      .mockResolvedValueOnce([
        { code: 'B00', title: 'Herpesviral infection', version: '11' },
      ]);
    const res = await service.search('herp');
    expect(res).toEqual([
      { code: 'B00', title: 'Herpesviral infection', version: '10' },
      { code: 'B00', title: 'Herpesviral infection', version: '11' },
    ]);
  });

  // eslint-disable-next-line no-unexpected-multiline
  it('retries once on 401 then succeeds', async () => {
    (axios.post as unknown as jest.Mock).mockResolvedValue({
      data: { access_token: 't', expires_in: 3600 },
    });
    (axios.get as unknown as jest.Mock)
      .mockRejectedValueOnce({ response: { status: 401 } })
      .mockResolvedValue({
        data: { destinationEntities: [{ code: 'A00', title: 'Cholera' }] },
      });
    const res = await service.search('cho', '10'); // Search only version 10 for this test
    expect(res).toEqual([{ code: 'A00', title: 'Cholera', version: '10' }]);
  });
});
