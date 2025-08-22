import { Test } from '@nestjs/testing'
import { JwtService } from './jwt.service'
import { AuthService } from './auth.service'
import { PasswordService } from './password.service'
import { RedisService } from './redis.service'
import { UsersService } from '../users/users.service'
import { UnauthorizedException } from '@nestjs/common'

describe('AuthService', () => {
  let auth: AuthService
  let users: jest.Mocked<Partial<UsersService>>
  let redis: RedisService

  beforeEach(async () => {
    users = {
      findByEmail: jest.fn(async (email: string) => {
        if (email === 'disabled@example.com')
          return { _id: '1', email, passwordHash: await new PasswordService().hash('secret123'), status: 'disabled', roles: [] } as any
        if (email === 'ok@example.com')
          return { _id: '2', email, passwordHash: await new PasswordService().hash('secret123'), status: 'active', roles: ['admin'] } as any
        return null
      }),
    }

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        PasswordService,
        RedisService,
        { provide: UsersService, useValue: users },
        { provide: JwtService, useValue: new JwtService({ secret: 'test', expiresIn: '1h' }) },
      ],
    }).compile()

    auth = module.get(AuthService)
    redis = module.get(RedisService)
  })

  it('rejects invalid credentials', async () => {
    await expect(auth.login('nope@example.com', 'secret123')).rejects.toBeInstanceOf(
      UnauthorizedException
    )
  })

  it('rejects disabled users', async () => {
    await expect(auth.login('disabled@example.com', 'secret123')).rejects.toBeInstanceOf(
      UnauthorizedException
    )
  })

  it('returns access token and stores session for valid login', async () => {
    const res = await auth.login('ok@example.com', 'secret123')
    expect(res.accessToken).toBeTruthy()
    // Decode and verify session key exists
    const jwt = new JwtService({ secret: 'test' })
    const payload: any = jwt.decode(res.accessToken)
    const val = await redis.get(`session:${payload.jti}`)
    expect(val).toBe('2')
  })

  it('logout removes session', async () => {
    const res = await auth.login('ok@example.com', 'secret123')
    const jwt = new JwtService({ secret: 'test' })
    const token = res.accessToken
    const payload: any = jwt.decode(token)
    const key = `session:${payload.jti}`
    expect(await redis.get(key)).not.toBeNull()
    await auth.logout(token)
    expect(await redis.get(key)).toBeNull()
  })
})
