import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../app.module'
import { getConnectionToken, getModelToken } from '@nestjs/mongoose'
import { IcdCacheService } from '../icd-cache/icd-cache.service'

jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
}))

import axios from 'axios'

describe('E2E: ICD search', () => {
  let app: INestApplication

  beforeAll(async () => {
    process.env.WHO_ICD_CLIENT_ID = 'cid'
    process.env.WHO_ICD_CLIENT_SECRET = 'secret'

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
      // Provide a simple cache stub to capture upserts and provide fallback search
      .overrideProvider(IcdCacheService)
      .useValue({
        upsert: jest.fn(async () => ({})),
        search: jest.fn(async () => [{ code: 'B00', title: 'Herpesviral infection' }]),
      })
      .compile()

    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()
  })

  afterAll(async () => {
    await app?.close()
  })

  it('GET /api/icd/search returns WHO results (mocked) and maps fields', async () => {
    // eslint-disable-next-line no-unexpected-multiline
    (axios.post as jest.Mock).mockResolvedValue({ data: { access_token: 't', expires_in: 3600 } })
    // eslint-disable-next-line no-unexpected-multiline
    (axios.get as jest.Mock).mockResolvedValue({
      data: {
        destinationEntities: [
          { theCode: 'A00', title: { '@value': 'Cholera' } },
          { code: 'J06.9', title: 'URI, unspecified' },
        ],
      },
    })

    const res = await request(app.getHttpServer())
      .get('/api/icd/search?q=ch')
      .expect(200)
    expect(res.body.results.length).toBeGreaterThanOrEqual(2)
    expect(res.body.results[0]).toHaveProperty('code')
    expect(res.body.results[0]).toHaveProperty('title')
  })

  it('GET /api/icd/search falls back to cache when WHO fails', async () => {
    // eslint-disable-next-line no-unexpected-multiline
    (axios.post as jest.Mock).mockResolvedValue({ data: { access_token: 't', expires_in: 3600 } })
    // eslint-disable-next-line no-unexpected-multiline
    (axios.get as jest.Mock).mockRejectedValue(new Error('network'))

    const res = await request(app.getHttpServer())
      .get('/api/icd/search?q=herp')
      .expect(200)
    expect(res.body.results).toEqual([{ code: 'B00', title: 'Herpesviral infection' }])
  })
})

