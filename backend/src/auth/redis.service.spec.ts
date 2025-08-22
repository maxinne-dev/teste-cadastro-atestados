import { RedisService } from './redis.service';

describe('RedisService (memory mode)', () => {
  let svc: RedisService;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    delete process.env.REDIS_URL;
    svc = new RedisService();
  });

  it('set/get roundtrip and ttl expiration', async () => {
    await svc.set('k1', 'v1', 1);
    await expect(svc.get('k1')).resolves.toBe('v1');
    // simulate expiry
    (svc as any).memory.set('k1', { value: 'v1', expiresAt: Date.now() - 1 });
    await expect(svc.get('k1')).resolves.toBeNull();
  });

  it('del removes both client and memory entries', async () => {
    await svc.set('k2', 'v2');
    await svc.del('k2');
    await expect(svc.get('k2')).resolves.toBeNull();
  });
});
