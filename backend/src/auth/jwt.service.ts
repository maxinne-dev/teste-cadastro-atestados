import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';

function b64url(input: Buffer | string) {
  const buff = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return buff
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function b64urlJson(obj: any) {
  return b64url(Buffer.from(JSON.stringify(obj)));
}

function parseTimespan(span: string | number): number {
  if (typeof span === 'number') return span;
  const m = /^([0-9]+)([smhd])$/.exec(span);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  switch (unit) {
    case 's':
      return n;
    case 'm':
      return n * 60;
    case 'h':
      return n * 3600;
    case 'd':
      return n * 86400;
    default:
      return 0;
  }
}

@Injectable()
export class JwtService {
  constructor(
    private readonly options: {
      secret: string;
      expiresIn?: string | number;
    } = { secret: 'dev-secret' },
  ) {}

  async signAsync(payload: any): Promise<string> {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const expDelta = this.options.expiresIn
      ? parseTimespan(this.options.expiresIn)
      : 0;
    const body = {
      ...payload,
      iat: now,
      ...(expDelta ? { exp: now + expDelta } : {}),
    };
    const unsigned = `${b64urlJson(header)}.${b64urlJson(body)}`;
    const sig = this.sign(unsigned, this.options.secret);
    return `${unsigned}.${sig}`;
  }

  async verifyAsync(token: string): Promise<any> {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token');
    const [h, p, s] = parts;
    const expected = this.sign(`${h}.${p}`, this.options.secret);
    if (s !== expected) throw new Error('Invalid signature');
    const payload = JSON.parse(
      Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(
        'utf8',
      ),
    );
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp)
      throw new Error('Token expired');
    return payload;
  }

  decode(token: string): any | null {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    try {
      const p = parts[1];
      return JSON.parse(
        Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(
          'utf8',
        ),
      );
    } catch {
      return null;
    }
  }

  private sign(unsigned: string, secret: string) {
    const h = createHmac('sha256', secret).update(unsigned).digest();
    return b64url(h);
  }
}
