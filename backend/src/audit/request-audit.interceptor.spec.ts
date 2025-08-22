import { Test } from '@nestjs/testing'
import { of } from 'rxjs'
import { RequestAuditInterceptor } from './request-audit.interceptor'
import { AuditService } from './audit.service'

describe('RequestAuditInterceptor', () => {
  it('records when CPF or collaboratorId present or certificate mutation', async () => {
    const audit = { record: jest.fn(async () => ({})) }
    const module = await Test.createTestingModule({
      providers: [RequestAuditInterceptor, { provide: AuditService, useValue: audit }],
    }).compile()
    const interceptor = module.get(RequestAuditInterceptor)

    const ctx: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'PATCH',
          originalUrl: '/api/collaborators/123/status',
          params: { cpf: '123' },
          headers: { 'user-agent': 'jest' },
          ip: '127.0.0.1',
          user: { sub: 'u1' },
        }),
      }),
    }
    const next: any = { handle: () => of({ ok: true }) }
    await interceptor.intercept(ctx, next).toPromise()
    expect(audit.record).toHaveBeenCalled()

    // certificate mutation by URL alone
    const ctx2: any = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'POST', originalUrl: '/api/medical-certificates', params: {} }),
      }),
    }
    await interceptor.intercept(ctx2, next).toPromise()
    expect(audit.record).toHaveBeenCalledTimes(2)
  })
})

