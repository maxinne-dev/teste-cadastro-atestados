import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, FilterQuery } from 'mongoose';
import { Collaborator, CollaboratorDocument } from './collaborator.schema.js';
import { normalizeCpf } from '../common/validators/br.js';

export interface CreateCollaboratorInput {
  fullName: string;
  cpf: string;
  birthDate: Date;
  position: string;
  department?: string;
}

@Injectable()
export class CollaboratorsService {
  constructor(
    @InjectModel(Collaborator.name)
    private readonly model: Model<CollaboratorDocument>,
  ) {}

  async create(input: CreateCollaboratorInput) {
    const cpf = normalizeCpf(input.cpf);
    return this.model.create({ ...input, cpf });
  }

  async findByCpf(cpf: string) {
    const normalized = normalizeCpf(cpf);
    return this.model.findOne({ cpf: normalized }).exec();
  }

  async searchByName(term: string, limit = 20) {
    const q: FilterQuery<CollaboratorDocument> = {};
    const trimmed = (term || '').trim();
    if (trimmed) {
      // Use case-insensitive regex; text search can be added later
      q.fullName = { $regex: trimmed, $options: 'i' };
    }
    return this.model.find(q).limit(limit).exec();
  }

  async searchByNameWithTotal(
    term: string,
    limit = 20,
    offset = 0,
    status?: 'active' | 'inactive',
  ) {
    const q: FilterQuery<CollaboratorDocument> = {};
    const trimmed = (term || '').trim();
    if (trimmed) {
      q.fullName = { $regex: trimmed, $options: 'i' };
    }
    if (status) {
      q.status = status;
    }
    const [results, total] = await Promise.all([
      this.model.find(q).skip(Math.max(0, offset)).limit(Math.max(0, limit)).exec(),
      this.model.countDocuments(q).exec(),
    ]);
    return { results, total };
  }

  async searchByNameWithTotalSorted(
    term: string,
    limit = 20,
    offset = 0,
    sortBy: 'fullName' | 'createdAt' | 'status' = 'fullName',
    sortDir: 'asc' | 'desc' = 'asc',
    status?: 'active' | 'inactive',
  ) {
    const q: FilterQuery<CollaboratorDocument> = {};
    const trimmed = (term || '').trim();
    if (trimmed) {
      q.fullName = { $regex: trimmed, $options: 'i' };
    }
    if (status) {
      q.status = status;
    }
    const dir = sortDir === 'desc' ? -1 : 1;
    const [results, total] = await Promise.all([
      this.model
        .find(q)
        .sort({ [sortBy]: dir })
        .skip(Math.max(0, offset))
        .limit(Math.max(0, limit))
        .exec(),
      this.model.countDocuments(q).exec(),
    ]);
    return { results, total };
  }

  async updateFields(
    cpf: string,
    updates: Partial<Pick<Collaborator, 'fullName' | 'birthDate' | 'position' | 'department'>>,
  ) {
    const normalized = normalizeCpf(cpf);
    await this.model.updateOne({ cpf: normalized }, { $set: updates }).exec();
    return this.findByCpf(normalized);
  }

  async setStatus(cpf: string, status: 'active' | 'inactive') {
    const normalized = normalizeCpf(cpf);
    await this.model
      .updateOne({ cpf: normalized }, { $set: { status } })
      .exec();
    return this.findByCpf(normalized);
  }
}
