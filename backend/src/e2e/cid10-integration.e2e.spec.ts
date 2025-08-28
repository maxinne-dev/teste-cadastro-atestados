import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { IcdController } from '../icd/icd.controller';
import { IcdService } from '../icd/icd.service';
import { CremespService } from '../cremesp/cremesp.service';
import { IcdCacheService } from '../icd-cache/icd-cache.service';
import { RateLimiterService } from '../common/rate-limiter.service';

describe('CID-10 Integration E2E', () => {
  let app: INestApplication;
  let icdService: jest.Mocked<IcdService>;

  beforeEach(async () => {
    // Mock services
    const mockIcdService = {
      search: jest.fn(),
    };

    const mockCremespService = {
      searchCid10: jest.fn(),
    };

    const mockCacheService = {
      search: jest.fn(),
      upsert: jest.fn(),
    };

    const mockRateLimiter = {
      consume: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [IcdController],
      providers: [
        { provide: IcdService, useValue: mockIcdService },
        { provide: CremespService, useValue: mockCremespService },
        { provide: IcdCacheService, useValue: mockCacheService },
        { provide: RateLimiterService, useValue: mockRateLimiter },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    icdService = moduleRef.get(IcdService);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should handle CID-10 code searches', async () => {
    // Mock the service to return CID-10 results
    icdService.search.mockResolvedValue([
      {
        code: 'F84',
        title: 'Transtornos globais do desenvolvimento',
      },
    ]);

    const response = await request(app.getHttpServer())
      .get('/icd/search')
      .query({ q: 'F84' })
      .expect(200);

    expect(response.body).toEqual({
      results: [
        {
          code: 'F84',
          title: 'Transtornos globais do desenvolvimento',
        },
      ],
    });

    expect(icdService.search).toHaveBeenCalledWith('F84');
  });

  it('should handle CID-11 text searches', async () => {
    // Mock the service to return CID-11 results
    icdService.search.mockResolvedValue([
      {
        code: 'JA65',
        title: 'Acute upper respiratory infections',
      },
    ]);

    const response = await request(app.getHttpServer())
      .get('/icd/search')
      .query({ q: 'respiratory infection' })
      .expect(200);

    expect(response.body).toEqual({
      results: [
        {
          code: 'JA65',
          title: 'Acute upper respiratory infections',
        },
      ],
    });

    expect(icdService.search).toHaveBeenCalledWith('respiratory infection');
  });

  it('should handle empty queries', async () => {
    icdService.search.mockResolvedValue([]);

    const response = await request(app.getHttpServer())
      .get('/icd/search')
      .query({ q: '' })
      .expect(200);

    expect(response.body).toEqual({
      results: [],
    });
  });
});