import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator.js';
import { ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { RedisService } from './auth/redis.service.js';
import { IcdService } from './icd/icd.service.js';

@Controller('health')
@ApiTags('Health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly conn: Connection,
    private readonly redis: RedisService,
    private readonly icd: IcdService,
  ) {}

  @Get()
  @Public()
  health() {
    const mongoOk = this.conn?.readyState === 1;
    const redisMode = process.env.REDIS_URL ? 'redis' : 'memory';
    // We assume RedisService works in-memory when no REDIS_URL
    const whoConfigured = !!(
      process.env.WHO_ICD_CLIENT_ID && process.env.WHO_ICD_CLIENT_SECRET
    );

    return {
      status: 'ok',
      time: new Date().toISOString(),
      dependencies: {
        mongo: { ok: mongoOk, state: this.conn?.readyState ?? -1 },
        redis: { ok: true, mode: redisMode },
        whoIcd: {
          configured: whoConfigured,
          release: process.env.WHO_ICD_RELEASE || '2024-01',
          language: process.env.WHO_ICD_LANGUAGE || 'en',
        },
      },
    };
  }
}
