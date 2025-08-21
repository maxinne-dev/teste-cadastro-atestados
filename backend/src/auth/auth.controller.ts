import { Body, Controller, Post, Req, UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service.js'
import { IsEmail, IsString, MinLength } from 'class-validator'
import { Transform } from 'class-transformer'
import { Public } from './public.decorator.js'
import { ApiBearerAuth, ApiBody, ApiTags, ApiProperty } from '@nestjs/swagger'
import { RateLimiterService } from '../common/rate-limiter.service.js'

class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  email!: string

  @ApiProperty({ example: 'secret12345', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string
}

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly limiter: RateLimiterService
  ) {}

  @Post('login')
  @Public()
  @ApiBody({ type: LoginDto })
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const key = `auth:${req?.ip || 'anon'}`
    const limit = parseInt(process.env.AUTH_RATE_LIMIT_RPM || '30', 10)
    this.limiter.consume(key, isFinite(limit) ? limit : 30, 60_000)
    return this.auth.login(dto.email, dto.password)
  }

  @Post('logout')
  @ApiBearerAuth('bearer')
  async logout(@Req() req: any) {
    const auth = String(req.headers?.authorization || '')
    const [type, token] = auth.split(' ')
    if (type?.toLowerCase() !== 'bearer' || !token)
      throw new UnauthorizedException('Missing token')
    return this.auth.logout(token)
  }
}
