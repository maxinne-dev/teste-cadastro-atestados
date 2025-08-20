import { Body, Controller, Post, Req, UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service.js'
import { IsEmail, IsString, MinLength } from 'class-validator'
import { Transform } from 'class-transformer'

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
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
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

