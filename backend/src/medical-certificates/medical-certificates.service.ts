import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, FilterQuery } from 'mongoose';
import { Types } from 'mongoose';
import {
  MedicalCertificate,
  MedicalCertificateDocument,
} from './medical-certificate.schema.js';

export interface CertificateFilter {
  collaboratorId?: string;
  range?: { start?: Date; end?: Date };
  status?: 'active' | 'cancelled' | 'expired';
  icdCode?: string;
}

@Injectable()
export class MedicalCertificatesService {
  constructor(
    @InjectModel(MedicalCertificate.name)
    private readonly model: Model<MedicalCertificateDocument>,
  ) {}

  async create(
    input: Partial<MedicalCertificate> & { collaboratorId: string },
  ) {
    const doc: any = { ...input };
    if (typeof input.collaboratorId === 'string') {
      doc.collaboratorId = new Types.ObjectId(input.collaboratorId);
    }
    return this.model.create(doc);
  }

  async findByCollaborator(collaboratorId: string) {
    const id = new Types.ObjectId(collaboratorId);
    return this.model.find({ collaboratorId: id }).exec();
  }

  async filter(f: CertificateFilter = {}) {
    const q: FilterQuery<MedicalCertificateDocument> = {};

    if (f.collaboratorId) {
      q.collaboratorId = new Types.ObjectId(f.collaboratorId);
    }

    if (f.status) {
      q.status = f.status;
    }

    if (f.icdCode) {
      q.icdCode = f.icdCode;
    }

    if (f.range) {
      const { start, end } = f.range;
      if (start || end) {
        q.startDate = q.startDate || {};
        q.endDate = q.endDate || {};
        if (start) (q.startDate as any)['$gte'] = start;
        if (end) (q.endDate as any)['$lte'] = end;
      }
    }

    return this.model.find(q).exec();
  }

  async cancel(id: string) {
    const _id = new Types.ObjectId(id);
    await this.model
      .updateOne({ _id }, { $set: { status: 'cancelled' } })
      .exec();
    return this.model.findById(_id).exec();
  }
}
