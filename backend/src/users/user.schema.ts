import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import type { HydratedDocument } from 'mongoose'
import { applyBaseSchemaOptions } from '../common/database/index.js'

export type UserDocument = HydratedDocument<User>

type UserStatus = 'active' | 'disabled'

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  email!: string

  @Prop({ required: true })
  passwordHash!: string

  @Prop({ required: true })
  fullName!: string

  @Prop({ type: [String], default: [], index: true })
  roles!: string[]

  @Prop({ default: 'active', enum: ['active', 'disabled'] })
  status!: UserStatus
}

export const UserSchema = SchemaFactory.createForClass(User)
applyBaseSchemaOptions(UserSchema)

// Ensure email is stored in lowercase consistently
UserSchema.pre('validate', function (next) {
  const self = this as any
  if (self.email && typeof self.email === 'string') {
    self.email = self.email.trim().toLowerCase()
  }
  next()
})

// Unique, case-insensitive email index via collation
UserSchema.index(
  { email: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
)

