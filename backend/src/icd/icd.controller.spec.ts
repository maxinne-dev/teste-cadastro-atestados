import { Test } from '@nestjs/testing';
import { IcdController } from './icd.controller';
import { IcdService } from './icd.service';
import { RateLimiterService } from '../common/rate-limiter.service';

describe('IcdController', () => {
  it('enforces rate limiting', async () => {
    const icd = { search: jest.fn(async () => []) };
    const module = await Test.createTestingModule({
      controllers: [IcdController],
      providers: [RateLimiterService, { provide: IcdService, useValue: icd }],
    }).compile();
    const ctrl = module.get(IcdController);
    // limit default 60/min; we simulate with env override
    process.env.ICD_RATE_LIMIT_RPM = '2';
    await ctrl.search({q: 'ab'});
    await ctrl.search({q: 'ab'});
    await expect(ctrl.search({q: 'ab'})).rejects.toBeInstanceOf(Error);
  });

  it('passes version parameter to service', async () => {
    const icd = { search: jest.fn(async () => []) };
    const module = await Test.createTestingModule({
      controllers: [IcdController],
      providers: [RateLimiterService, { provide: IcdService, useValue: icd }],
    }).compile();
    const ctrl = module.get(IcdController);
    
    await ctrl.search({q: 'fever', version: '10'});
    expect(icd.search).toHaveBeenCalledWith('fever', '10');
    
    await ctrl.search({q: 'fever'});
    expect(icd.search).toHaveBeenCalledWith('fever', undefined);
  });
});
