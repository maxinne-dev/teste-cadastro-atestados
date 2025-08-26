import { Controller, Get, Query } from '@nestjs/common';
import { IcdService } from './icd.service.js';
import { Public } from '../auth/public.decorator.js';
import { RateLimiterService } from '../common/rate-limiter.service.js';
import { ApiTags } from '@nestjs/swagger';
import { SearchIcdDto } from './dto/search-icd.dto.js';

@Controller('icd')
@ApiTags('ICD')
export class IcdController {
  constructor(
    private readonly icd: IcdService,
    private readonly limiter: RateLimiterService,
  ) {}

  @Get('search')
  @Public()
  async search(@Query() query: SearchIcdDto) {
    const key = `icd:anon`;
    const limit = parseInt(process.env.ICD_RATE_LIMIT_RPM || '60', 10);
    this.limiter.consume(key, isFinite(limit) ? limit : 60, 60_000);
    const results = await this.icd.search(query.q || '', query.version);
    return { results };
  }
}
