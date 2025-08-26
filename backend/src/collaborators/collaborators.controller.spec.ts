import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CollaboratorsController } from './collaborators.controller';
import { CollaboratorsService } from './collaborators.service';
import { AuditService } from '../audit/audit.service';

describe('CollaboratorsController', () => {
  let controller: CollaboratorsController;
  let service: jest.Mocked<Partial<CollaboratorsService>>;

  beforeEach(async () => {
    service = {
      create: jest.fn(async (dto: any) => ({ _id: '1', ...dto })),
      findByCpf: jest.fn(async () => null),
      searchByNameWithTotal: jest.fn(async () => ({ results: [], total: 0 })),
      searchByNameWithTotalSorted: jest.fn(async () => ({
        results: [],
        total: 0,
      })),
      setStatus: jest.fn(async () => null),
    };

    const module = await Test.createTestingModule({
      controllers: [CollaboratorsController],
      providers: [
        { provide: CollaboratorsService, useValue: service },
        { provide: AuditService, useValue: { record: jest.fn() } },
      ],
    }).compile();

    controller = module.get(CollaboratorsController);
  });

  it('creates collaborator via service', async () => {
    const body = {
      fullName: 'Maria',
      cpf: '52998224725',
      birthDate: new Date('1990-01-01'),
      position: 'Analista',
    };
    const res = await controller.create(body as any);
    expect(service.create).toHaveBeenCalled();
    expect(res.fullName).toBe('Maria');
  });

  it('getByCpf throws 404 when not found', async () => {
    await expect(
      controller.getByCpf({ cpf: '00000000000' } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('search returns results with total/limit/offset', async () => {
    (service.searchByNameWithTotal as jest.Mock).mockResolvedValue({
      results: Array.from({ length: 5 }).map((_, i) => ({ fullName: `C${i}` })),
      total: 42,
    });
    const res = await controller.search({
      q: 'C',
      limit: 5,
      offset: 10,
    } as any);
    expect(service.searchByNameWithTotal).toHaveBeenCalledWith(
      'C',
      5,
      10,
      undefined,
    );
    expect(res.results).toHaveLength(5);
    expect(res.total).toBe(42);
    expect(res.limit).toBe(5);
    expect(res.offset).toBe(10);
  });

  it('search forwards status filter to unsorted search', async () => {
    (service.searchByNameWithTotal as jest.Mock).mockResolvedValue({
      results: [],
      total: 0,
    });
    await controller.search({
      q: '',
      limit: 10,
      offset: 0,
      status: 'active',
    } as any);
    expect(service.searchByNameWithTotal).toHaveBeenCalledWith(
      '',
      10,
      0,
      'active',
    );
  });

  it('search uses sorted path and includes status', async () => {
    (service.searchByNameWithTotalSorted as jest.Mock).mockResolvedValue({
      results: [],
      total: 0,
    });
    await controller.search({
      q: 'M',
      limit: 15,
      offset: 5,
      sortBy: 'fullName',
      sortDir: 'desc',
      status: 'inactive',
    } as any);
    expect(service.searchByNameWithTotalSorted).toHaveBeenCalledWith(
      'M',
      15,
      5,
      'fullName',
      'desc',
      'inactive',
    );
  });

  it('updateStatus throws 404 when not found', async () => {
    await expect(
      controller.updateStatus(
        { cpf: '00000000000' } as any,
        { status: 'inactive' } as any,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
