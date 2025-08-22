import { PasswordService } from './password.service';

describe('PasswordService', () => {
  it('hashes and compares correctly', async () => {
    const svc = new PasswordService();
    const hash = await svc.hash('secret123');
    expect(hash).toMatch(/^\$2[aby]\$/);
    await expect(svc.compare('secret123', hash)).resolves.toBe(true);
    await expect(svc.compare('wrong', hash)).resolves.toBe(false);
  });
});
