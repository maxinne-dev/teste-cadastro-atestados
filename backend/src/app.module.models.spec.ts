import { Test } from '@nestjs/testing'
import { getConnectionToken, getModelToken } from '@nestjs/mongoose'
import { AppModule } from './app.module'
import { CollaboratorsService } from './collaborators/collaborators.service'
import { IcdCacheService } from './icd-cache/icd-cache.service'
import { MedicalCertificatesService } from './medical-certificates/medical-certificates.service'
import { UsersService } from './users/users.service'
import { AuditService } from './audit/audit.service'

describe('AppModule DI wiring', () => {
  it('resolves core services without connecting to DB (mocked connection + models)', async () => {
    const builder = Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getConnectionToken())
      .useValue({ model: () => ({}) })
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

    const moduleRef = await builder.compile()

    // Resolve services; if any provider is missing, this will throw
    expect(moduleRef.get(CollaboratorsService)).toBeDefined()
    expect(moduleRef.get(IcdCacheService)).toBeDefined()
    expect(moduleRef.get(MedicalCertificatesService)).toBeDefined()
    expect(moduleRef.get(UsersService)).toBeDefined()
    expect(moduleRef.get(AuditService)).toBeDefined()
  })
})
