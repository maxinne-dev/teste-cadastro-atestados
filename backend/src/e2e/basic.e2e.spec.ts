import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { UsersService } from '../users/users.service';
import { PasswordService } from '../auth/password.service';
import { JwtService } from '../auth/jwt.service';
import { RedisService } from '../auth/redis.service';

describe('E2E: Health and Auth flow', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let redis: RedisService;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-e2e-secret';
    const passwords = new PasswordService();

    // In-memory users
    const adminUser = {
      _id: 'u-admin',
      email: 'admin@example.com',
      passwordHash: await passwords.hash('secret12345'),
      status: 'active',
      roles: ['admin'],
    };
    const hrUser = {
      _id: 'u-hr',
      email: 'hr@example.com',
      passwordHash: await passwords.hash('secret12345'),
      status: 'active',
      roles: ['hr'],
    };

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      // prevent real DB connection
      .overrideProvider(getConnectionToken())
      .useValue({ model: () => ({}), close: async () => {} })
      // mock mongoose models used across modules
      .overrideProvider(getModelToken('Collaborator'))
      .useValue({})
      .overrideProvider(getModelToken('IcdCode'))
      .useValue({})
      .overrideProvider(getModelToken('MedicalCertificate'))
      .useValue({})
      .overrideProvider(getModelToken('User'))
      .useValue({})
      .overrideProvider(getModelToken('AuditLog'))
      .useValue({})
      // override UsersService to avoid DB
      .overrideProvider(UsersService)
      .useValue({
        async findByEmail(email: string) {
          if (email.toLowerCase() === adminUser.email) return adminUser;
          if (email.toLowerCase() === hrUser.email) return hrUser;
          return null;
        },
      } as any)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    jwt = app.get(JwtService);
    redis = app.get(RedisService);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /api/health returns ok', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.time).toBe('string');
  });

  it('POST /api/auth/login rejects invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'secret12345' })
      .expect(401);
  });

  it('auth + protected route: 401, 403, then 200', async () => {
    // 401 without token
    await request(app.getHttpServer())
      .get('/api/users/admin@example.com')
      .expect(401);

    // 403 with HR token (no admin role)
    const jtiHr = 'jti-hr-1';
    const hrToken = await jwt.signAsync({
      sub: 'u-hr',
      email: 'hr@example.com',
      roles: ['hr'],
      jti: jtiHr,
    });
    await redis.set(`session:${jtiHr}`, 'u-hr', 3600);
    await request(app.getHttpServer())
      .get('/api/users/admin@example.com')
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(403);

    // Login as admin to create a valid session-backed token
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'secret12345' })
      .expect(201);
    const adminToken = loginRes.body.accessToken as string;
    expect(adminToken).toBeTruthy();

    // 200 with admin token (route is @Roles('admin'))
    const okRes = await request(app.getHttpServer())
      .get('/api/users/admin@example.com')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(okRes.body.email).toBe('admin@example.com');

    // Logout invalidates session (subsequent access fails with 401)
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    await request(app.getHttpServer())
      .get('/api/users/admin@example.com')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(401);
  });
});
