import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../app.module'
import { getConnectionToken, getModelToken } from '@nestjs/mongoose'
import { JwtService } from '../auth/jwt.service'
import { RedisService } from '../auth/redis.service'
import { MedicalCertificatesService } from '../medical-certificates/medical-certificates.service'
import { AuditService } from '../audit/audit.service'

describe('E2E: Medical Certificates', () => {
  let app: INestApplication
  let jwt: JwtService
  let redis: RedisService
  let authHeader: string

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-e2e-secret'

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
      // in-memory certificates store
      .overrideProvider(MedicalCertificatesService)
      .useValue((() => {
        const list: any[] = []
        return {
          async create(dto: any) {
            const doc = { _id: `${list.length + 1}`, status: 'active', issueDate: new Date(), ...dto }
            list.push(doc)
            return doc
          },
          async filter(f: any) {
            return list.filter((c) => {
              if (f.collaboratorId && c.collaboratorId !== f.collaboratorId) return false
              if (f.status && c.status !== f.status) return false
              if (f.icdCode && c.icdCode !== f.icdCode) return false
              if (f.range) {
                if (f.range.start && new Date(c.startDate) < new Date(f.range.start)) return false
                if (f.range.end && new Date(c.endDate) > new Date(f.range.end)) return false
              }
              return true
            })
          },
          async cancel(id: string) {
            const found = list.find((c) => c._id === id)
            if (!found) return null
            found.status = 'cancelled'
            return found
          },
        }
      })())
      // no-op audit
      .overrideProvider(AuditService)
      .useValue({ record: async () => ({}) })
      .compile()

    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()

    jwt = app.get(JwtService)
    redis = app.get(RedisService)
    const jti = 'jti-cert-1'
    const token = await jwt.signAsync({ sub: 'u-hr', email: 'hr@example.com', roles: ['hr'], jti })
    await redis.set(`session:${jti}`, 'u-hr', 3600)
    authHeader = `Bearer ${token}`
  })

  afterAll(async () => {
    await app?.close()
  })

  const payload = {
    collaboratorId: '64ddae5f2f8fb814c89bd421',
    startDate: '2025-01-01',
    endDate: '2025-01-05',
    days: 5,
    icdCode: 'J06.9',
    icdTitle: 'URI, unspecified',
  }

  it('POST /api/medical-certificates creates a certificate', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/medical-certificates')
      .set('Authorization', authHeader)
      .send(payload)
      .expect(201)
    expect(res.body.icdCode).toBe('J06.9')
    expect(res.body.status).toBe('active')
  })

  it('GET /api/medical-certificates filters by collaborator and range', async () => {
    const res = await request(app.getHttpServer())
      .get(
        `/api/medical-certificates?collaboratorId=${payload.collaboratorId}&startDate=2025-01-01&endDate=2025-01-31&limit=10&offset=0`
      )
      .set('Authorization', authHeader)
      .expect(200)
    expect(res.body.total).toBeGreaterThanOrEqual(1)
    expect(Array.isArray(res.body.results)).toBe(true)
  })

  it('PATCH /api/medical-certificates/:id/cancel cancels certificate', async () => {
    // Create another
    const created = await request(app.getHttpServer())
      .post('/api/medical-certificates')
      .set('Authorization', authHeader)
      .send(payload)
      .expect(201)
    const id = created.body._id
    const res = await request(app.getHttpServer())
      .patch(`/api/medical-certificates/${id}/cancel`)
      .set('Authorization', authHeader)
      .expect(200)
    expect(res.body.status).toBe('cancelled')
  })
})
