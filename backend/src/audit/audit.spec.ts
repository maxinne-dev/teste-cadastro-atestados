import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { AuditService } from './audit.service';
import { createAuditLogSchema } from './audit-log.schema';

describe('AuditService', () => {
  let service: AuditService;
  let model: jest.Mocked<Partial<Model<any>>>;

  beforeEach(async () => {
    model = {
      create: jest.fn(async (doc) => ({ ...doc })),
      find: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getModelToken('AuditLog'), useValue: model },
      ],
    }).compile();

    service = module.get(AuditService);
  });

  it('record persists an event', async () => {
    await service.record({
      action: 'sensitive_data_access',
      actorUserId: 'u1',
      resource: '/api/x',
      ip: '127.0.0.1',
    });
    expect(model.create).toHaveBeenCalled();
    const arg = (model.create as jest.Mock).mock.calls[0][0];
    expect(arg.action).toBe('sensitive_data_access');
    expect(arg.timestamp instanceof Date).toBe(true);
  });

  it('queryRange builds timestamp filter', async () => {
    const start = new Date('2025-01-01T00:00:00Z');
    const end = new Date('2025-01-31T23:59:59Z');
    await service.queryRange(start, end);
    const q = (model.find as jest.Mock).mock.calls[0][0];
    expect(q.timestamp.$gte.toISOString()).toBe(start.toISOString());
    expect(q.timestamp.$lte.toISOString()).toBe(end.toISOString());
  });
});

describe('AuditLogSchema indexes', () => {
  it('has timestamp index and optional TTL when ttlDays provided', () => {
    const schemaNoTtl = createAuditLogSchema();
    const idxNoTtl = (schemaNoTtl as any).indexes();
    const hasTimestampIdx = idxNoTtl.some(
      ([fields]: [Record<string, any>, Record<string, any>]) =>
        fields.timestamp === -1,
    );
    expect(hasTimestampIdx).toBe(true);

    const schemaWithTtl = createAuditLogSchema({ ttlDays: 7 });
    const idxWithTtl = (schemaWithTtl as any).indexes();
    const hasTtl = idxWithTtl.some(
      ([fields, opts]: [Record<string, any>, Record<string, any>]) =>
        fields.timestamp === 1 &&
        typeof opts?.expireAfterSeconds === 'number' &&
        opts.expireAfterSeconds > 0,
    );
    expect(hasTtl).toBe(true);
  });
});
