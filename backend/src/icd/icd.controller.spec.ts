import { Test } from '@nestjs/testing'
import { IcdController } from './icd.controller'
import { IcdService } from './icd.service'
import { RateLimiterService } from '../common/rate-limiter.service'

describe('IcdController', () => {
  it('enforces rate limiting', async () => {
    const icd = { search: jest.fn(async () => []) }
    const module = await Test.createTestingModule({
      controllers: [IcdController],
      providers: [RateLimiterService, { provide: IcdService, useValue: icd }],
    }).compile()
    const ctrl = module.get(IcdController)
    const req: any = { ip: '1.2.3.4' }
    // limit default 60/min; we simulate with env override
    process.env.ICD_RATE_LIMIT_RPM = '2'
    await ctrl.search('ab', req)
    await ctrl.search('ab', req)
    await expect(ctrl.search('ab', req)).rejects.toBeInstanceOf(Error)
  })
})

