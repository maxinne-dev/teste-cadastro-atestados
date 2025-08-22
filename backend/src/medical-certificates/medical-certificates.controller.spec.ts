import { Test } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { MedicalCertificatesController } from './medical-certificates.controller'
import { MedicalCertificatesService } from './medical-certificates.service'
import { AuditService } from '../audit/audit.service'

describe('MedicalCertificatesController', () => {
  let controller: MedicalCertificatesController
  let service: jest.Mocked<Partial<MedicalCertificatesService>>

  beforeEach(async () => {
    service = {
      create: jest.fn(async (dto: any) => ({ _id: 'm1', ...dto })),
      filter: jest.fn(async () => []),
      cancel: jest.fn(async () => null),
    }

    const module = await Test.createTestingModule({
      controllers: [MedicalCertificatesController],
      providers: [
        { provide: MedicalCertificatesService, useValue: service },
        { provide: AuditService, useValue: { record: jest.fn() } },
      ],
    }).compile()

    controller = module.get(MedicalCertificatesController)
  })

  it('creates certificate via service', async () => {
    const res = await controller.create({
      collaboratorId: '60ddae5f2f8fb814c89bd421',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-05'),
      days: 5,
      icdCode: 'J06.9',
      icdTitle: 'URI, unspecified',
    } as any)
    expect(service.create).toHaveBeenCalled()
    expect(res.icdCode).toBe('J06.9')
  })

  it('lists with sorting and pagination and total', async () => {
    (service.filter as jest.Mock).mockResolvedValue([
      { issueDate: new Date('2025-01-02') },
      { issueDate: new Date('2025-01-03') },
      { issueDate: new Date('2025-01-01') },
    ])
    const res = await controller.list({ limit: 2, offset: 1 } as any)
    expect(service.filter).toHaveBeenCalled()
    expect(res.results).toHaveLength(2)
    expect(res.total).toBe(3)
    // Middle two after sorting desc should be [2025-01-02, 2025-01-01]
    expect(new Date(res.results[0].issueDate).toISOString()).toBe(
      new Date('2025-01-02').toISOString()
    )
  })

  it('cancel throws 404 when not found', async () => {
    await expect(controller.cancel('64ddae5f2f8fb814c89bd421')).rejects.toBeInstanceOf(
      NotFoundException
    )
  })
})
