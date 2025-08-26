import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { IcdCode, IcdCodeDocument } from './icd-code.schema.js';

@Injectable()
export class IcdCacheService {
  constructor(
    @InjectModel(IcdCode.name) private readonly model: Model<IcdCodeDocument>,
  ) {}

  async upsert(code: string, title: string, version: string, release?: string) {
    const now = new Date();
    return this.model
      .findOneAndUpdate(
        { code, version },
        { $set: { title, release, lastFetchedAt: now } },
        { new: true, upsert: true },
      )
      .exec();
  }

  async findByCode(code: string, version?: string) {
    const query = version ? { code, version } : { code };
    return this.model.findOne(query).exec();
  }

  async search(term: string, limit = 10, version?: string) {
    const trimmed = (term || '').trim();
    if (!trimmed) return [];
    const re = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const query: any = { $or: [{ code: re }, { title: re }] };
    if (version) {
      query.version = version;
    }
    return this.model
      .find(query)
      .limit(limit)
      .exec();
  }
}
