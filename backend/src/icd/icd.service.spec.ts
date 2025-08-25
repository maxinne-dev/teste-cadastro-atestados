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
});
