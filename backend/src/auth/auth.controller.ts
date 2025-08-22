import { Body, Controller, Post, Req, UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service.js'
import { IsEmail, IsString, MinLength } from 'class-validator'
import { Transform } from 'class-transformer'
import { Public } from './public.decorator.js'
import { RateLimiterService } from '../common/rate-limiter.service.js'

class LoginDto {
  @IsEmail()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  email!: string

  @IsString()
  @MinLength(8)
  password!: string
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly limiter: RateLimiterService
  ) {}

  @Post('login')
  @Public()
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const key = `auth:${req?.ip || 'anon'}`
    const limit = parseInt(process.env.AUTH_RATE_LIMIT_RPM || '30', 10)
    this.limiter.consume(key, isFinite(limit) ? limit : 30, 60_000)
    return this.auth.login(dto.email, dto.password)
  }

  @Post('logout')
  async logout(@Req() req: any) {
    const auth = String(req.headers?.authorization || '')
    const [type, token] = auth.split(' ')
    if (type?.toLowerCase() !== 'bearer' || !token)
      throw new UnauthorizedException('Missing token')
    return this.auth.logout(token)
  }
}
