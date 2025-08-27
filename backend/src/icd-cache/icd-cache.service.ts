import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { IcdCode, IcdCodeDocument } from './icd-code.schema.js';

@Injectable()
export class IcdCacheService {
  constructor(
    @InjectModel(IcdCode.name) private readonly model: Model<IcdCodeDocument>,
  ) {}

  async upsert(code: string, title: string, release?: string, version: string = '11') {
    const now = new Date();
    return this.model
      .findOneAndUpdate(
        { code, version },
        { $set: { title, release, lastFetchedAt: now } },
        { new: true, upsert: true },
      )
      .exec();
  }

  async findByCode(code: string, version: string = '11') {
    return this.model.findOne({ code, version }).exec();
  }

  async search(term: string, limit = 10, version: string = '11') {
    const trimmed = (term || '').trim();
    if (!trimmed) return [];
    const re = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return this.model
      .find({ 
        $and: [
          { version },
          { $or: [{ code: re }, { title: re }] }
        ]
      })
      .limit(limit)
      .exec();
  }
}
