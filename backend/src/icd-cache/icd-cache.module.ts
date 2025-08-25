import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IcdCode, IcdCodeSchema } from './icd-code.schema.js';
import { IcdCacheService } from './icd-cache.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: IcdCode.name, schema: IcdCodeSchema }]),
  ],
  providers: [IcdCacheService],
  exports: [IcdCacheService],
})
export class IcdCacheModule {}
