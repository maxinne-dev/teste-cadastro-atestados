import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { UsersService } from './users.service';
import { UserSchema } from './user.schema';

describe('UsersService', () => {
  let service: UsersService;
  let model: jest.Mocked<Partial<Model<any>>>;

  beforeEach(async () => {
    model = {
      create: jest.fn(async (doc) => ({ ...doc })),
      findOne: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      updateOne: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    };

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken('User'), useValue: model },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('create lowercases email and passes through fields', async () => {
    await service.create({
      email: 'TEST@Example.COM',
      passwordHash: 'hash',
      fullName: 'Test',
    });
    const arg = (model.create as jest.Mock).mock.calls[0][0];
    expect(arg.email).toBe('test@example.com');
    expect(arg.passwordHash).toBe('hash');
    expect(arg.fullName).toBe('Test');
  });

  it('findByEmail normalizes lookup', async () => {
    await service.findByEmail('TEST@Example.COM');
    const filter = (model.findOne as jest.Mock).mock.calls[0][0];
    expect(filter.email).toBe('test@example.com');
  });

  it('assignRoles deduplicates and sets roles', async () => {
    await service.assignRoles('user@example.com', ['admin', 'hr', 'admin']);
    const update = (model.updateOne as jest.Mock).mock.calls[0][1];
    expect(update.$set.roles).toEqual(['admin', 'hr']);
  });

  it('setStatus updates status', async () => {
    await service.setStatus('user@example.com', 'disabled');
    const update = (model.updateOne as jest.Mock).mock.calls[0][1];
    expect(update.$set.status).toBe('disabled');
  });
});

describe('UserSchema indexes and collation', () => {
  it('has unique email index (case-insensitive via collation) and roles index', () => {
    const indexes = (UserSchema as any).indexes();
    const hasEmailUnique = indexes.some(
      ([fields, opts]: [Record<string, any>, Record<string, any>]) =>
        fields.email === 1 &&
        opts?.unique === true &&
        opts?.collation?.strength === 2,
    );
    const hasRolesIndex = indexes.some(
      ([fields]: [Record<string, any>, Record<string, any>]) =>
        fields.roles === 1,
    );
    expect(hasEmailUnique).toBe(true);
    expect(hasRolesIndex).toBe(true);
  });
});
