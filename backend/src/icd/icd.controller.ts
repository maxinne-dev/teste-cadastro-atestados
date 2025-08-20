import { Controller, Get, Query } from '@nestjs/common';
import { IcdService } from './icd.service.js';

@Controller('icd')
export class IcdController {
  constructor(private readonly icd: IcdService) {}

  @Get('search')
  async search(@Query('q') q: string) {
    const results = await this.icd.search(q);
    return { results };
  }
}
