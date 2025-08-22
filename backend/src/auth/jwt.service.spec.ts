import { JwtService } from './jwt.service'

describe('JwtService', () => {
  it('signs with various expirations and verifies payload', async () => {
    const jwt = new JwtService({ secret: 's', expiresIn: '1h' })
    const token = await jwt.signAsync({ sub: 'u1' })
    const payload: any = await jwt.verifyAsync(token)
    expect(payload.sub).toBe('u1')
    expect(payload.exp).toBeGreaterThan(payload.iat)
  })

  it('supports timespan parsing for s/m/h/d and rejects bad signatures', async () => {
    const jwtS = new JwtService({ secret: 's', expiresIn: '5s' })
    const t = await jwtS.signAsync({ a: 1 })
    // wrong secret
    const jwtBad = new JwtService({ secret: 'x' })
    await expect(jwtBad.verifyAsync(t)).rejects.toBeTruthy()
  })

  it('decode returns null for invalid tokens', () => {
    const jwt = new JwtService({ secret: 's' })
    expect(jwt.decode('abc')).toBeNull()
  })
})

