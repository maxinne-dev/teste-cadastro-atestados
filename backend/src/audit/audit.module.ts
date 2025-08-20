import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AuditLog, AuditLogSchema } from './audit-log.schema.js'
import { AuditService } from './audit.service.js'
import { RequestAuditInterceptor } from './request-audit.interceptor.js'

@Module({
  imports: [MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }])],
  providers: [AuditService, RequestAuditInterceptor],
  exports: [AuditService, RequestAuditInterceptor],
})
export class AuditModule {}
