import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import type { Model } from 'mongoose'
import { User, UserDocument } from './user.schema.js'

export interface CreateUserInput {
  email: string
  passwordHash: string
  fullName: string
  roles?: string[]
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly model: Model<UserDocument>
  ) {}

  async create(input: CreateUserInput) {
    const email = input.email.trim().toLowerCase()
    return this.model.create({ ...input, email })
  }

  async findByEmail(email: string) {
    return this.model.findOne({ email: email.trim().toLowerCase() }).exec()
  }

  async setStatus(email: string, status: 'active' | 'disabled') {
    await this.model
      .updateOne({ email: email.trim().toLowerCase() }, { $set: { status } })
      .exec()
    return this.findByEmail(email)
  }

  async assignRoles(email: string, roles: string[]) {
    const uniqueRoles = Array.from(new Set((roles || []).map(String)))
    await this.model
      .updateOne(
        { email: email.trim().toLowerCase() },
        { $set: { roles: uniqueRoles } }
      )
      .exec()
    return this.findByEmail(email)
  }
}

