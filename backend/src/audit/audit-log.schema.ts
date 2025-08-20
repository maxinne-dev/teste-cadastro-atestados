import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import type { HydratedDocument } from 'mongoose'
import { applyBaseSchemaOptions } from '../common/database/index.js'

export type AuditLogDocument = HydratedDocument<AuditLog>

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ required: true })
  action!: string

  @Prop({ type: String })
  actorUserId?: string // stored as string to avoid tight coupling

  @Prop({ required: false })
  resource?: string

  @Prop({ required: false })
  targetId?: string

  @Prop({ required: false })
  ip?: string

  @Prop({ required: false })
  userAgent?: string

  @Prop({ type: Date, default: () => new Date(), index: true })
  timestamp!: Date

  @Prop({ type: Object })
  metadata?: Record<string, any>
}

export function createAuditLogSchema(opts?: { ttlDays?: number }) {
  const schema = SchemaFactory.createForClass(AuditLog)
  applyBaseSchemaOptions(schema)
  // Ensure a descending index for common queries
  schema.index({ timestamp: -1 })
  if (opts?.ttlDays && opts.ttlDays > 0) {
    const seconds = Math.floor(opts.ttlDays * 24 * 60 * 60)
    schema.index({ timestamp: 1 }, { expireAfterSeconds: seconds })
  }
  return schema
}

const envTtl = process.env.AUDIT_TTL_DAYS ? Number(process.env.AUDIT_TTL_DAYS) : undefined
export const AuditLogSchema = createAuditLogSchema({ ttlDays: envTtl })

