import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service.js'
import { AuthController } from './auth.controller.js'
import { UsersModule } from '../users/users.module.js'
import { PasswordService } from './password.service.js'
import { RedisService } from './redis.service.js'
import { JwtService } from './jwt.service.js'
import { RateLimiterService } from '../common/rate-limiter.service.js'

@Module({
  imports: [ConfigModule, UsersModule],
  providers: [
    AuthService,
    PasswordService,
    RedisService,
    RateLimiterService,
    {
      provide: JwtService,
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) =>
        new JwtService({ secret: cfg.get<string>('JWT_SECRET') || 'dev-secret', expiresIn: '4h' }),
    },
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtService, RedisService],
})
export class AuthModule {}
