import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { getConnectionToken } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { IcdService } from './icd/icd.service';
import { RedisService } from './auth/redis.service';

describe('HealthController', () => {
  const OLD_ENV = { ...process.env };
  afterEach(() => {
    process.env = { ...OLD_ENV };
  });

  async function build(readyState = 1) {
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: getConnectionToken(),
          useValue: { readyState } as Partial<Connection>,
        },
        { provide: RedisService, useValue: { mode: 'memory' } },
        { provide: IcdService, useValue: { search: async () => [] } },
      ],
    }).compile();
    return module.get(HealthController);
  }

  it('returns ok status and dependencies snapshot', async () => {
    const controller = await build(1);
    const res = controller.health();
    expect(res.status).toBe('ok');
    expect(res.time).toBeTruthy();
    expect(res.dependencies).toBeTruthy();
    expect(typeof res.dependencies.mongo.ok).toBe('boolean');
    expect(['redis', 'memory']).toContain(res.dependencies.redis.mode);
    expect(res.dependencies.whoIcd.release).toBeTruthy();
    expect(res.dependencies.whoIcd.language).toBeTruthy();
  });

  it('reflects WHO ICD configured flag based on env', async () => {
    delete process.env.WHO_ICD_CLIENT_ID;
    delete process.env.WHO_ICD_CLIENT_SECRET;
    const controller1 = await build(1);
    const res1 = controller1.health();
    expect(res1.dependencies.whoIcd.configured).toBe(false);

    process.env.WHO_ICD_CLIENT_ID = 'id';
    process.env.WHO_ICD_CLIENT_SECRET = 'secret';
    const controller2 = await build(1);
    const res2 = controller2.health();
    expect(res2.dependencies.whoIcd.configured).toBe(true);
  });
});
