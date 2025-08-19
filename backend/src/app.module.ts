import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health.controller.js';
import { IcdModule } from './icd/icd.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (cfg: ConfigService) => ({
        uri: cfg.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/atestados',
      }),
    }),
    IcdModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
