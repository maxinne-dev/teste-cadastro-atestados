import { HealthController } from './health.controller'

describe('HealthController', () => {
  it('returns ok status with ISO time', () => {
    const ctrl = new HealthController()
    const res = ctrl.health()
    expect(res.status).toBe('ok')
    expect(typeof res.time).toBe('string')
    // basic ISO check
    expect(() => new Date(res.time).toISOString()).not.toThrow()
  })
})
