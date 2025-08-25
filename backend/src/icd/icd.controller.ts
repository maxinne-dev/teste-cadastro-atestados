import { Controller, Get, Query, Req } from '@nestjs/common';
import { IcdService } from './icd.service.js';
import { Public } from '../auth/public.decorator.js';
import { RateLimiterService } from '../common/rate-limiter.service.js';
import { ApiTags } from '@nestjs/swagger';

@Controller('icd')
@ApiTags('ICD')
export class IcdController {
  constructor(
    private readonly icd: IcdService,
    private readonly limiter: RateLimiterService,
  ) {}

  @Get('search')
  @Public()
  async search(@Query('q') q: string, @Req() req: any) {
    const key = `icd:${req?.ip || 'anon'}`;
    const limit = parseInt(process.env.ICD_RATE_LIMIT_RPM || '60', 10);
    this.limiter.consume(key, isFinite(limit) ? limit : 60, 60_000);
    const results = await this.icd.search(q);
    return { results };
  }
}
