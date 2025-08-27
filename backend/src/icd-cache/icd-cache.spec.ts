import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { IcdCacheService } from './icd-cache.service';
import { IcdCodeSchema } from './icd-code.schema';

describe('IcdCacheService', () => {
  let service: IcdCacheService;
  let model: jest.Mocked<Partial<Model<any>>>;

  beforeEach(async () => {
    model = {
      findOneAndUpdate: jest.fn().mockReturnValue({
        exec: jest.fn(async () => ({ code: 'J06.9', title: 'Old' })),
      }),
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn(async () => ({ 
          code: 'J06.9', 
          title: 'Acute...',
          save: jest.fn().mockResolvedValue({ code: 'J06.9', title: 'Updated' })
        })),
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        IcdCacheService,
        { provide: getModelToken('IcdCode'), useValue: model },
      ],
    }).compile();

    service = module.get(IcdCacheService);
  });

  it('upsert uses findOneAndUpdate with upsert=true', async () => {
    await service.upsert(
      'J06.9',
      'Acute upper respiratory infection, unspecified',
      '2024-01',
    );
    expect(model.findOneAndUpdate).toHaveBeenCalled();
    const [filter, update, options] = (model.findOneAndUpdate as jest.Mock).mock
      .calls[0];
    expect(filter).toEqual({ code: 'J06.9' });
    expect(update.$set.title).toBeDefined();
    expect(options.upsert).toBe(true);
    expect(options.new).toBe(true);
  });

  it('findByCode delegates to findOne', async () => {
    await service.findByCode('J06.9');
    expect(model.findOne).toHaveBeenCalledWith({ code: 'J06.9' });
  });

  it('handles duplicate key error (E11000) gracefully', async () => {
    const duplicateKeyError = new Error('Duplicate key error');
    (duplicateKeyError as any).code = 11000;
    
    (model.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockRejectedValue(duplicateKeyError),
    });

    const mockDoc = {
      code: 'J06.9',
      title: 'Old title',
      save: jest.fn().mockResolvedValue({ code: 'J06.9', title: 'New title' })
    };

    (model.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockDoc),
    });

    const result = await service.upsert('J06.9', 'New title', '2024-01');
    
    expect(model.findOne).toHaveBeenCalledWith({ code: 'J06.9' });
    expect(mockDoc.save).toHaveBeenCalled();
    expect(mockDoc.title).toBe('New title');
  });
});

describe('IcdCodeSchema indexes', () => {
  it('has unique code index', () => {
    const indexes = (IcdCodeSchema as any).indexes();
    const hasUnique = indexes.some(
      ([fields, opts]: [Record<string, any>, Record<string, any>]) =>
        fields.code === 1 && opts?.unique === true,
    );
    expect(hasUnique).toBe(true);
  });
});
