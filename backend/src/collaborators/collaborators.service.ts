import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import type { Model, FilterQuery } from 'mongoose'
import { Collaborator, CollaboratorDocument } from './collaborator.schema.js'
import { normalizeCpf } from '../common/validators/br.js'

export interface CreateCollaboratorInput {
  fullName: string
  cpf: string
  birthDate: Date
  position: string
  department?: string
}

@Injectable()
export class CollaboratorsService {
  constructor(
    @InjectModel(Collaborator.name)
    private readonly model: Model<CollaboratorDocument>
  ) {}

  async create(input: CreateCollaboratorInput) {
    const cpf = normalizeCpf(input.cpf)
    return this.model.create({ ...input, cpf })
  }

  async findByCpf(cpf: string) {
    const normalized = normalizeCpf(cpf)
    return this.model.findOne({ cpf: normalized }).exec()
  }

  async searchByName(term: string, limit = 20) {
    const q: FilterQuery<CollaboratorDocument> = {}
    const trimmed = (term || '').trim()
    if (trimmed) {
      // Use case-insensitive regex; text search can be added later
      q.fullName = { $regex: trimmed, $options: 'i' }
    }
    return this.model.find(q).limit(limit).exec()
  }

  async setStatus(cpf: string, status: 'active' | 'inactive') {
    const normalized = normalizeCpf(cpf)
    await this.model.updateOne({ cpf: normalized }, { $set: { status } }).exec()
    return this.findByCpf(normalized)
  }
}

