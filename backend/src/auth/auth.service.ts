import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from './jwt.service.js';
import { UsersService } from '../users/users.service.js';
import { PasswordService } from './password.service.js';
import { RedisService } from './redis.service.js';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  private sessionTtl = 4 * 60 * 60; // 4 hours in seconds

  constructor(
    private readonly users: UsersService,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await this.passwords.compare(
      password,
      (user as any).passwordHash,
    );
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    if ((user as any).status === 'disabled')
      throw new UnauthorizedException('User disabled');

    const jti = randomUUID();
    const payload = {
      sub: (user as any)._id?.toString?.() || (user as any).id,
      email: (user as any).email,
      roles: (user as any).roles || [],
      jti,
    };
    const token = await this.jwt.signAsync(payload);

    // Invalidate previous session if exists
    const lastKey = `user-session:${payload.email}`;
    const prev = await this.redis.get(lastKey);
    if (prev) await this.redis.del(`session:${prev}`);
    await this.redis.set(`session:${jti}`, payload.sub, this.sessionTtl);
    await this.redis.set(lastKey, jti, this.sessionTtl);

    return { accessToken: token };
  }

  async logout(token: string) {
    try {
      const payload: any = await this.jwt.verifyAsync(token);
      if (payload?.jti) await this.redis.del(`session:${payload.jti}`);
    } catch {
      // ignore invalid token on logout
    }
    return { success: true };
  }
}
