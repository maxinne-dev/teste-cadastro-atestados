import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { IcdCode, IcdCodeDocument } from './icd-code.schema.js';

@Injectable()
export class IcdCacheService {
  constructor(
    @InjectModel(IcdCode.name) private readonly model: Model<IcdCodeDocument>,
  ) {}

  async upsert(code: string, title: string, release?: string) {
    const now = new Date();
    try {
      return await this.model
        .findOneAndUpdate(
          { code },
          { $set: { title, release, lastFetchedAt: now } },
          { new: true, upsert: true },
        )
        .exec();
    } catch (error: any) {
      // Handle duplicate key error (E11000) for concurrent upserts
      if (error.code === 11000) {
        // Try to find the existing document instead of failing
        const existing = await this.model.findOne({ code }).exec();
        if (existing) {
          // Update the existing document
          existing.title = title;
          if (release) existing.release = release;
          existing.lastFetchedAt = now;
          return existing.save();
        }
      }
      throw error;
    }
  }

  async findByCode(code: string) {
    return this.model.findOne({ code }).exec();
  }

  async search(term: string, limit = 10) {
    const trimmed = (term || '').trim();
    if (!trimmed) return [];
    const re = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return this.model
      .find({ $or: [{ code: re }, { title: re }] })
      .limit(limit)
      .exec();
  }
}
