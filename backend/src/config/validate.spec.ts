import { validateEnv } from './validate';

describe('validateEnv', () => {
  it('requires JWT_SECRET and MONGODB_URI', () => {
    expect(() => validateEnv({} as any)).toThrow(/MONGODB_URI/);
    expect(() => validateEnv({ MONGODB_URI: 'x' } as any)).toThrow(
      /JWT_SECRET/,
    );
    const res = validateEnv({ MONGODB_URI: 'm', JWT_SECRET: 's' } as any);
    expect(res.API_PORT).toBe(3000);
  });
});
