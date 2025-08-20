import { Test } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { CollaboratorsController } from './collaborators.controller'
import { CollaboratorsService } from './collaborators.service'

describe('CollaboratorsController', () => {
  let controller: CollaboratorsController
  let service: jest.Mocked<Partial<CollaboratorsService>>

  beforeEach(async () => {
    service = {
      create: jest.fn(async (dto: any) => ({ _id: '1', ...dto })),
      findByCpf: jest.fn(async () => null),
      searchByName: jest.fn(async () => []),
      setStatus: jest.fn(async () => null),
    }

    const module = await Test.createTestingModule({
      controllers: [CollaboratorsController],
      providers: [{ provide: CollaboratorsService, useValue: service }],
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

  it('search applies offset and limit with wrapper', async () => {
    ;(service.searchByName as jest.Mock).mockResolvedValue(
      Array.from({ length: 15 }).map((_, i) => ({ fullName: `C${i}` }))
    )
    const res = await controller.search({ q: 'C', limit: 5, offset: 10 } as any)
    expect(service.searchByName).toHaveBeenCalledWith('C', 15)
    expect(res.results).toHaveLength(5)
    expect(res.limit).toBe(5)
    expect(res.offset).toBe(10)
  })

  it('updateStatus throws 404 when not found', async () => {
    await expect(
      controller.updateStatus({ cpf: '00000000000' } as any, { status: 'inactive' } as any)
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})

