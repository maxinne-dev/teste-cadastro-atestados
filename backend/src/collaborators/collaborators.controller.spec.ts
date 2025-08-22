import { Test } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { CollaboratorsController } from './collaborators.controller'
import { CollaboratorsService } from './collaborators.service'
import { AuditService } from '../audit/audit.service'

describe('CollaboratorsController', () => {
  let controller: CollaboratorsController
  let service: jest.Mocked<Partial<CollaboratorsService>>

  beforeEach(async () => {
    service = {
      create: jest.fn(async (dto: any) => ({ _id: '1', ...dto })),
      findByCpf: jest.fn(async () => null),
      searchByNameWithTotal: jest.fn(async () => ({ results: [], total: 0 })),
      setStatus: jest.fn(async () => null),
    }

    const module = await Test.createTestingModule({
      controllers: [CollaboratorsController],
      providers: [
        { provide: CollaboratorsService, useValue: service },
        { provide: AuditService, useValue: { record: jest.fn() } },
      ],
    }).compile()

    controller = module.get(CollaboratorsController)
  })

  it('creates collaborator via service', async () => {
    const body = {
      fullName: 'Maria',
      cpf: '52998224725',
      birthDate: new Date('1990-01-01'),
      position: 'Analista',
    }
    const res = await controller.create(body as any)
    expect(service.create).toHaveBeenCalled()
    expect(res.fullName).toBe('Maria')
  })

  it('getByCpf throws 404 when not found', async () => {
    await expect(controller.getByCpf({ cpf: '00000000000' } as any)).rejects.toBeInstanceOf(
      NotFoundException
    )
  })

  it('search returns results with total/limit/offset', async () => {
    (service.searchByNameWithTotal as jest.Mock).mockResolvedValue({
      results: Array.from({ length: 5 }).map((_, i) => ({ fullName: `C${i}` })),
      total: 42,
    })
    const res = await controller.search({ q: 'C', limit: 5, offset: 10 } as any)
    expect(service.searchByNameWithTotal).toHaveBeenCalledWith('C', 5, 10)
    expect(res.results).toHaveLength(5)
    expect(res.total).toBe(42)
    expect(res.limit).toBe(5)
    expect(res.offset).toBe(10)
  })

  it('updateStatus throws 404 when not found', async () => {
    await expect(
      controller.updateStatus({ cpf: '00000000000' } as any, { status: 'inactive' } as any)
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})
