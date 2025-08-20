import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import type { HydratedDocument } from 'mongoose'
import { Types } from 'mongoose'
import { applyBaseSchemaOptions } from '../common/database/index.js'

export type MedicalCertificateDocument = HydratedDocument<MedicalCertificate>

type Status = 'active' | 'cancelled' | 'expired'

@Schema({ timestamps: true })
export class MedicalCertificate {
  @Prop({ type: Types.ObjectId, ref: 'Collaborator', required: true, index: true })
  collaboratorId!: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
  issuerUserId?: Types.ObjectId

  @Prop({ type: Date, required: true, default: () => new Date(), index: true })
  issueDate!: Date

  @Prop({ type: Date, required: true, index: true })
  startDate!: Date

  @Prop({ type: Date, required: true, index: true })
  endDate!: Date

  @Prop({ type: Number, required: true, min: 1, max: 365 })
  days!: number

  @Prop()
  diagnosis?: string

  // ICD denormalization
  @Prop({ required: true })
  icdCode!: string

  @Prop({ required: true })
  icdTitle!: string

  // Optional link to cache collection
  @Prop({ type: Types.ObjectId, ref: 'IcdCode', required: false })
  icdRef?: Types.ObjectId

  @Prop({ default: 'active', enum: ['active', 'cancelled', 'expired'], index: true })
  status!: Status

  @Prop({ type: Object, required: false })
  metadata?: Record<string, any>
}

export const MedicalCertificateSchema = SchemaFactory.createForClass(MedicalCertificate)

applyBaseSchemaOptions(MedicalCertificateSchema)

// Compound and range-supporting indexes
MedicalCertificateSchema.index({ collaboratorId: 1, status: 1 })
MedicalCertificateSchema.index({ issueDate: -1 })
MedicalCertificateSchema.index({ startDate: 1, endDate: 1 })

// Cross-field validation: endDate >= startDate
MedicalCertificateSchema.pre('validate', function (next) {
  const self = this as any
  if (self.startDate && self.endDate) {
    const start = new Date(self.startDate).getTime()
    const end = new Date(self.endDate).getTime()
    if (isFinite(start) && isFinite(end) && end < start) {
      return next(new Error('endDate must be greater than or equal to startDate'))
    }
  }
  next()
})

