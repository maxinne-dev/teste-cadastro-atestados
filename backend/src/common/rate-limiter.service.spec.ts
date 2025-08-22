import { RateLimiterService } from './rate-limiter.service';

describe('RateLimiterService', () => {
  it('enforces limit and resets after window', () => {
    const rl = new RateLimiterService();
    const key = 'k';
    rl.consume(key, 2, 100);
    rl.consume(key, 2, 100);
    expect(() => rl.consume(key, 2, 100)).toThrow('Rate limit exceeded');
    // simulate window reset
    (rl as any).windows.set(key, { resetAt: Date.now() - 1, count: 999 });
    expect(() => rl.consume(key, 2, 100)).not.toThrow();
  });
});
