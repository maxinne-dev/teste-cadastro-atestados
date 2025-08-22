import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client?: any;
  private memory = new Map<
    string,
    { value: string; expiresAt: number | null }
  >();

  private get enabled() {
    if (process.env.NODE_ENV === 'test') return false;
    if (process.env.JEST_WORKER_ID) return false;
    return !!process.env.REDIS_URL;
  }

  private getClient(): any | undefined {
    if (!this.enabled) return undefined;
    if (!this.client) {
      this.client = new (Redis as any)(process.env.REDIS_URL as string, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });
    }
    return this.client;
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    const client = this.getClient();
    if (client) {
      if (ttlSeconds && ttlSeconds > 0)
        await client.set(key, value, 'EX', ttlSeconds);
      else await client.set(key, value);
      return;
    }
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.memory.set(key, { value, expiresAt });
  }

  async get(key: string): Promise<string | null> {
    const client = this.getClient();
    if (client) return (await client.get(key)) as any;
    const v = this.memory.get(key);
    if (!v) return null;
    if (v.expiresAt && v.expiresAt < Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return v.value;
  }

  async del(key: string) {
    const client = this.getClient();
    if (client) await client.del(key);
    this.memory.delete(key);
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit();
  }
}
