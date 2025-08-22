import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class RateLimiterService {
  private windows = new Map<string, { resetAt: number; count: number }>();

  consume(key: string, limit = 60, windowMs = 60000) {
    const now = Date.now();
    const entry = this.windows.get(key);
    if (!entry || entry.resetAt <= now) {
      this.windows.set(key, { resetAt: now + windowMs, count: 1 });
      return;
    }
    if (entry.count >= limit) {
      throw new HttpException(
        'Rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    entry.count++;
  }
}
