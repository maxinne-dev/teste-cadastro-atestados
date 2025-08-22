import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health.controller.js';
import { IcdModule } from './icd/icd.module.js';
import { CollaboratorsModule } from './collaborators/collaborators.module.js';
import { IcdCacheModule } from './icd-cache/icd-cache.module.js';
import { MedicalCertificatesModule } from './medical-certificates/medical-certificates.module.js';
import { UsersModule } from './users/users.module.js';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';

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
    CollaboratorsModule,
    IcdCacheModule,
    MedicalCertificatesModule,
    UsersModule,
    AuditModule,
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
