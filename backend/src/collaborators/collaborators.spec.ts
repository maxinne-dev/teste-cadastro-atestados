import { Test } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import type { Model } from 'mongoose'
import { CollaboratorsService } from './collaborators.service'
import { CollaboratorSchema } from './collaborator.schema'

describe('CollaboratorsService', () => {
  let service: CollaboratorsService
  let model: jest.Mocked<Partial<Model<any>>>

  beforeEach(async () => {
    model = {
      create: jest.fn(async (doc) => ({ ...doc })),
      findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      find: jest.fn().mockReturnValue({ limit: () => ({ exec: jest.fn().mockResolvedValue([]) }) }),
      updateOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    }

    const module = await Test.createTestingModule({
      providers: [
        CollaboratorsService,
        { provide: getModelToken('Collaborator'), useValue: model },
      ],
    }).compile()

    service = module.get(CollaboratorsService)
  })

  it('create normalizes CPF digits', async () => {
    await service.create({
      fullName: 'Maria',
      cpf: '529.982.247-25',
      birthDate: new Date('1990-01-01'),
      position: 'Analista',
    })
    expect(model.create).toHaveBeenCalled()
    const arg = (model.create as jest.Mock).mock.calls[0][0]
    expect(arg.cpf).toBe('52998224725')
  })

  it('findByCpf normalizes lookup', async () => {
    await service.findByCpf('529.982.247-25')
    const callArg = (model.findOne as jest.Mock).mock.calls[0][0]
    expect(callArg.cpf).toBe('52998224725')
  })

  it('searchByName uses case-insensitive regex', async () => {
    await service.searchByName('Mar')
    expect(model.find).toHaveBeenCalled()
    const q = (model.find as jest.Mock).mock.calls[0][0]
    expect(q.fullName.$regex).toBe('Mar')
    expect(q.fullName.$options).toBe('i')
  })

  it('setStatus updates collaborator status', async () => {
    await service.setStatus('529.982.247-25', 'inactive')
    expect(model.updateOne).toHaveBeenCalled()
    const [filter, update] = (model.updateOne as jest.Mock).mock.calls[0]
    expect(filter.cpf).toBe('52998224725')
    expect(update.$set.status).toBe('inactive')
  })
})

describe('CollaboratorSchema indexes', () => {
  it('includes unique cpf and text index on fullName', () => {
    const indexes = (CollaboratorSchema as any).indexes()
    // indexes is array of [fields, options]
    const hasCpfUnique = indexes.some(
      ([fields, opts]: [Record<string, any>, Record<string, any>]) =>
        fields.cpf === 1 && opts?.unique === true
    )
    const hasFullNameText = indexes.some(
      ([fields]: [Record<string, any>, Record<string, any>]) =>
        fields.fullName === 'text'
    )
    expect(hasCpfUnique).toBe(true)
    expect(hasFullNameText).toBe(true)
  })
})

