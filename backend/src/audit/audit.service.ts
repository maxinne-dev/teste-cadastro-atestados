import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import type { Model } from 'mongoose'
import { AuditLog, AuditLogDocument } from './audit-log.schema.js'

export interface AuditEvent {
  action: string
  actorUserId?: string
  resource?: string
  targetId?: string
  ip?: string
  userAgent?: string
  timestamp?: Date
  metadata?: Record<string, any>
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private readonly model: Model<AuditLogDocument>
  ) {}

  record(event: AuditEvent) {
    const payload: AuditEvent = {
      timestamp: new Date(),
      ...event,
    }
    return this.model.create(payload)
  }

  queryRange(start?: Date, end?: Date) {
    const q: any = {}
    if (start || end) {
      q.timestamp = {}
      if (start) q.timestamp.$gte = start
      if (end) q.timestamp.$lte = end
    }
    return this.model.find(q).exec()
  }
}

