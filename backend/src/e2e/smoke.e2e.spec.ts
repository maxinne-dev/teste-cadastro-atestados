import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../app.module'
import { getConnectionToken, getModelToken } from '@nestjs/mongoose'
import { UsersService } from '../users/users.service'
import { PasswordService } from '../auth/password.service'
import { JwtService } from '../auth/jwt.service'
import { RedisService } from '../auth/redis.service'
import { CollaboratorsService } from '../collaborators/collaborators.service'
import { MedicalCertificatesService } from '../medical-certificates/medical-certificates.service'
import { AuditService } from '../audit/audit.service'

describe('E2E Smoke: Login → Create Collaborator → Create Certificate → List', () => {
  let app: INestApplication
  let jwt: JwtService
  let redis: RedisService
  let authHeader: string

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-e2e-secret'
    const passwords = new PasswordService()
    const hrUser = {
      _id: 'u-hr',
      email: 'hr@example.com',
      passwordHash: await passwords.hash('secret12345'),
      status: 'active',
      roles: ['hr'],
    }

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
      // UsersService mock for login
      .overrideProvider(UsersService)
      .useValue({
        async findByEmail(email: string) {
          if (email.toLowerCase() === hrUser.email) return hrUser
          return null
        },
      } as any)
      // in-memory collaborators
      .overrideProvider(CollaboratorsService)
      .useValue(
        (() => {
          const byCpf = new Map<string, any>()
          return {
            async create(dto: any) {
              if (byCpf.has(dto.cpf)) {
                const { ConflictException } = await import('@nestjs/common')
                throw new ConflictException('Duplicate CPF')
              }
              const doc = { ...dto, status: 'active', _id: dto.cpf }
              byCpf.set(dto.cpf, doc)
              return doc
            },
            async findByCpf(cpf: string) {
              return byCpf.get(cpf) || null
            },
            async searchByNameWithTotal(term: string, limit: number, offset: number) {
              const all = Array.from(byCpf.values())
              const filtered = term
                ? all.filter((c) => c.fullName.toLowerCase().includes(term.toLowerCase()))
                : all
              return { results: filtered.slice(offset, offset + limit), total: filtered.length }
            },
          }
        })(),
      )
      // in-memory certificates
      .overrideProvider(MedicalCertificatesService)
      .useValue(
        (() => {
          const list: any[] = []
          return {
            async create(dto: any) {
              const doc = { _id: `${list.length + 1}`, issueDate: new Date(), status: 'active', ...dto }
              list.push(doc)
              return doc
            },
            async filter(f: any) {
              return list.filter((c) => {
                if (f.collaboratorId && c.collaboratorId !== f.collaboratorId) return false
                return true
              })
            },
          }
        })(),
      )
      .overrideProvider(AuditService)
      .useValue({ record: async () => ({}) })
      .compile()

    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()

    jwt = app.get(JwtService)
    redis = app.get(RedisService)

    // Login as HR via API to get token
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'hr@example.com', password: 'secret12345' })
      .expect(201)
    const token = login.body.accessToken as string
    // Prime session to mimic real protection in subsequent calls
    const decoded: any = await jwt.verifyAsync(token)
    await redis.set(`session:${decoded.jti}`, decoded.sub, 3600)
    authHeader = `Bearer ${token}`
  })

  afterAll(async () => {
    await app?.close()
  })

  it('Happy path: create collaborator then certificate and list', async () => {
    // Create collaborator
    const collab = await request(app.getHttpServer())
      .post('/api/collaborators')
      .set('Authorization', authHeader)
      .send({
        fullName: 'João da Silva',
        cpf: '52998224725',
        birthDate: '1990-05-10',
        position: 'Analista',
      })
      .expect(201)
    expect(collab.body.fullName).toBe('João da Silva')

    // Create certificate
    const cert = await request(app.getHttpServer())
      .post('/api/medical-certificates')
      .set('Authorization', authHeader)
      .send({
        collaboratorId: '64ddae5f2f8fb814c89bd421',
        startDate: '2025-01-01',
        endDate: '2025-01-03',
        days: 3,
        icdCode: 'J06.9',
        icdTitle: 'URI, unspecified',
      })
      .expect(201)
    expect(cert.body.status).toBe('active')

    // List certificates
    const list = await request(app.getHttpServer())
      .get('/api/medical-certificates?limit=10&offset=0')
      .set('Authorization', authHeader)
      .expect(200)
    expect(list.body.total).toBeGreaterThanOrEqual(1)
    expect(Array.isArray(list.body.results)).toBe(true)
  })

  it('Error path: duplicate CPF returns 409', async () => {
    // First create
    await request(app.getHttpServer())
      .post('/api/collaborators')
      .set('Authorization', authHeader)
      .send({
        fullName: 'Maria Teste',
        cpf: '39053344705',
        birthDate: '1992-01-01',
        position: 'Dev',
      })
      .expect(201)
    // Duplicate
    const dup = await request(app.getHttpServer())
      .post('/api/collaborators')
      .set('Authorization', authHeader)
      .send({
        fullName: 'Outra Pessoa',
        cpf: '39053344705',
        birthDate: '1990-01-01',
        position: 'Ops',
      })
      .expect(409)
    expect(dup.body?.message || '').toBeTruthy()
  })
})
