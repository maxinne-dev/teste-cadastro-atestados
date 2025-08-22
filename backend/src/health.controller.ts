import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator.js';
import { ApiTags } from '@nestjs/swagger';

@Controller('health')
@ApiTags('Health')
export class HealthController {
  @Get()
  @Public()
  health() {
    return { status: 'ok', time: new Date().toISOString() };
  }
}
