import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import type { Model } from 'mongoose'
import { IcdCode, IcdCodeDocument } from './icd-code.schema.js'

@Injectable()
export class IcdCacheService {
  constructor(
    @InjectModel(IcdCode.name) private readonly model: Model<IcdCodeDocument>
  ) {}

  async upsert(code: string, title: string, release?: string) {
    const now = new Date()
    return this.model
      .findOneAndUpdate(
        { code },
        { $set: { title, release, lastFetchedAt: now } },
        { new: true, upsert: true }
      )
      .exec()
  }

  async findByCode(code: string) {
    return this.model.findOne({ code }).exec()
  }
}

