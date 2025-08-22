import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import type { HydratedDocument } from 'mongoose'
import { applyBaseSchemaOptions } from '../common/database/index.js'
import { normalizeCpf } from '../common/validators/br.js'

export type CollaboratorDocument = HydratedDocument<Collaborator>

@Schema({ timestamps: true })
export class Collaborator {
  @Prop({ required: true, index: true })
  fullName!: string

  @Prop({ required: true, unique: true, index: true })
  cpf!: string

  @Prop({ required: true, type: Date })
  birthDate!: Date

  @Prop({ required: true })
  position!: string

  @Prop()
  department?: string

  @Prop({ default: 'active', enum: ['active', 'inactive'], index: true })
  status!: 'active' | 'inactive'
}

export const CollaboratorSchema = SchemaFactory.createForClass(Collaborator)

// Apply shared options
applyBaseSchemaOptions(CollaboratorSchema)

// Text index for name search
CollaboratorSchema.index({ fullName: 'text' })

// Normalize CPF before validate/save
CollaboratorSchema.pre('validate', function (next) {
  const self = this as any
  if (self.cpf) {
    self.cpf = normalizeCpf(self.cpf)
  }
  next()
})

