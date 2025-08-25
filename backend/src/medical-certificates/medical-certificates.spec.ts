import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { MedicalCertificatesService } from './medical-certificates.service';
import { MedicalCertificateSchema } from './medical-certificate.schema';

describe('MedicalCertificatesService', () => {
  let service: MedicalCertificatesService;
  let model: jest.Mocked<Partial<Model<any>>>;

  beforeEach(async () => {
    model = {
      create: jest.fn(async (doc) => ({ ...doc })),
      find: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
      updateOne: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
      findById: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    };

    const module = await Test.createTestingModule({
      providers: [
        MedicalCertificatesService,
        { provide: getModelToken('MedicalCertificate'), useValue: model },
      ],
    }).compile();

    service = module.get(MedicalCertificatesService);
  });

  it('create converts collaboratorId to ObjectId', async () => {
    const id = new Types.ObjectId().toString();
    await service.create({
      collaboratorId: id,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-02'),
      days: 2,
      icdCode: 'J06.9',
      icdTitle: 'Acute upper respiratory infection, unspecified',
    });
    const created = (model.create as jest.Mock).mock.calls[0][0];
    expect(Types.ObjectId.isValid(created.collaboratorId)).toBe(true);
  });

  it('filter builds query for collaborator, range, status and icdCode', async () => {
    const id = new Types.ObjectId().toString();
    await service.filter({
      collaboratorId: id,
      status: 'active',
      icdCode: 'J06.9',
      range: { start: new Date('2025-01-01'), end: new Date('2025-01-31') },
    });
    const q = (model.find as jest.Mock).mock.calls[0][0];
    expect(String(q.collaboratorId)).toBe(String(new Types.ObjectId(id)));
    expect(q.status).toBe('active');
    expect(q.icdCode).toBe('J06.9');
    expect(q.startDate.$gte.toISOString()).toBe(
      new Date('2025-01-01').toISOString(),
    );
    expect(q.endDate.$lte.toISOString()).toBe(
      new Date('2025-01-31').toISOString(),
    );
  });

  it('cancel updates status to cancelled', async () => {
    const certId = new Types.ObjectId().toString();
    await service.cancel(certId);
    const [filter, update] = (model.updateOne as jest.Mock).mock.calls[0];
    expect(String(filter._id)).toBe(String(new Types.ObjectId(certId)));
    expect(update.$set.status).toBe('cancelled');
  });
});

describe('MedicalCertificateSchema validation and indexes', () => {
  it('rejects when endDate < startDate', async () => {
    const Model = await (async () => {
      // create a model from schema for validation test
      const mongoose = await import('mongoose');
      return mongoose.model(
        'MC_' + Math.random().toString(36).slice(2),
        MedicalCertificateSchema,
      );
    })();

    const doc = new Model({
      collaboratorId: new Types.ObjectId(),
      startDate: new Date('2025-02-02'),
      endDate: new Date('2025-02-01'),
      days: 1,
      icdCode: 'X',
      icdTitle: 'Y',
    });
    await expect(doc.validate()).rejects.toThrow(/endDate/i);
  });

  it('has expected indexes', () => {
    const indexes = (MedicalCertificateSchema as any).indexes();
    const hasCompound = indexes.some(
      ([fields]: [Record<string, any>, Record<string, any>]) =>
        fields.collaboratorId === 1 && fields.status === 1,
    );
    const hasIssue = indexes.some(
      ([fields]: [Record<string, any>, Record<string, any>]) =>
        fields.issueDate === -1,
    );
    const hasRange = indexes.some(
      ([fields]: [Record<string, any>, Record<string, any>]) =>
        fields.startDate === 1 && fields.endDate === 1,
    );
    expect(hasCompound).toBe(true);
    expect(hasIssue).toBe(true);
    expect(hasRange).toBe(true);
  });
});
