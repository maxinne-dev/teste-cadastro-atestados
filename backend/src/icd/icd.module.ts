import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IcdService } from './icd.service.js';
import { IcdController } from './icd.controller.js';
import { CremespCid10Service } from './cremesp-cid10.service.js';
import { IcdCacheModule } from '../icd-cache/icd-cache.module.js';
import { RateLimiterService } from '../common/rate-limiter.service.js';

@Module({
  imports: [HttpModule, IcdCacheModule],
  controllers: [IcdController],
  providers: [IcdService, CremespCid10Service, RateLimiterService],
  exports: [IcdService],
})
export class IcdModule {}
