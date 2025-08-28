import { Module } from '@nestjs/common';
import { CremespService } from './cremesp.service.js';

@Module({
  providers: [CremespService],
  exports: [CremespService],
})
export class CremespModule {}