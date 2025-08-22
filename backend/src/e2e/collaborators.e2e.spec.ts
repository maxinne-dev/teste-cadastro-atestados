import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { JwtService } from '../auth/jwt.service';
import { RedisService } from '../auth/redis.service';
import { CollaboratorsService } from '../collaborators/collaborators.service';
import { AuditService } from '../audit/audit.service';

describe('E2E: Collaborators', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let redis: RedisService;
  let authHeader: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-e2e-secret';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getConnectionToken())
      .useValue({ model: () => ({}), close: async () => {} })
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
      // in-memory collaborators store
      .overrideProvider(CollaboratorsService)
      .useValue(
        (() => {
          const store = new Map<string, any>();
          return {
            async create(dto: any) {
              const c = { ...dto, status: 'active' };
              store.set(dto.cpf, c);
              return c;
            },
            async findByCpf(cpf: string) {
              return store.get(cpf) || null;
            },
            async searchByNameWithTotal(
              term: string,
              limit: number,
              offset: number,
            ) {
              const all = Array.from(store.values());
              const filtered = term
                ? all.filter((c) =>
                    c.fullName.toLowerCase().includes(term.toLowerCase()),
                  )
                : all;
              return {
                results: filtered.slice(offset, offset + limit),
                total: filtered.length,
              };
            },
            async setStatus(cpf: string, status: 'active' | 'inactive') {
              const c = store.get(cpf);
              if (!c) return null;
              c.status = status;
              return c;
            },
          };
        })(),
      )
      // no-op audit
      .overrideProvider(AuditService)
      .useValue({ record: async () => ({}) })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    jwt = app.get(JwtService);
    redis = app.get(RedisService);
    // issue HR token and prime session
    const jti = 'jti-collab-1';
    const token = await jwt.signAsync({
      sub: 'u-hr',
      email: 'hr@example.com',
      roles: ['hr'],
      jti,
    });
    await redis.set(`session:${jti}`, 'u-hr', 3600);
    authHeader = `Bearer ${token}`;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('POST /api/collaborators creates a collaborator', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/collaborators')
      .set('Authorization', authHeader)
      .send({
        fullName: 'Maria Silva',
        cpf: '52998224725',
        birthDate: '1990-01-01',
        position: 'Analista',
      })
      .expect(201);
    expect(res.body.fullName).toBe('Maria Silva');
  });

  it('GET /api/collaborators/:cpf returns created', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/collaborators/52998224725')
      .set('Authorization', authHeader)
      .expect(200);
    expect(res.body.cpf).toBe('52998224725');
  });

  it('GET /api/collaborators searches and paginates', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/collaborators?q=Maria&limit=10&offset=0')
      .set('Authorization', authHeader)
      .expect(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.results)).toBe(true);
  });

  it('PATCH /api/collaborators/:cpf/status updates status', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/collaborators/52998224725/status')
      .set('Authorization', authHeader)
      .send({ status: 'inactive' })
      .expect(200);
    expect(res.body.status).toBe('inactive');
  });
});
