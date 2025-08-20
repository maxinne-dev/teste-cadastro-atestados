import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'

import { CreateCollaboratorDto } from '../../collaborators/dto/create-collaborator.dto'
import { CpfParamDto } from '../../collaborators/dto/cpf-param.dto'
import { SearchCollaboratorsDto } from '../../collaborators/dto/search-collaborators.dto'
import { UpdateStatusDto as CollaboratorStatusDto } from '../../collaborators/dto/update-status.dto'

import { CreateUserDto } from '../../users/dto/create-user.dto'
import { EmailParamDto } from '../../users/dto/email-param.dto'
import { UpdateUserStatusDto } from '../../users/dto/update-status.dto'
import { UpdateUserRolesDto } from '../../users/dto/update-roles.dto'

import { CreateMedicalCertificateDto } from '../../medical-certificates/dto/create-medical-certificate.dto'
import { FilterMedicalCertificatesDto } from '../../medical-certificates/dto/filter-medical-certificates.dto'

describe('DTO validation', () => {
  describe('Collaborators DTOs', () => {
    it('CreateCollaboratorDto validates and normalizes CPF', async () => {
      const dto = plainToInstance(CreateCollaboratorDto, {
        fullName: 'Maria',
        cpf: '529.982.247-25',
        birthDate: '1990-01-01',
        position: 'Analista',
      })
      const errs = await validate(dto)
      expect(errs).toHaveLength(0)
      // class-transformer applied normalization
      expect(dto.cpf).toBe('52998224725')
    })

    it('CpfParamDto rejects invalid CPF', async () => {
      const dto = plainToInstance(CpfParamDto, { cpf: '12345678900' })
      const errs = await validate(dto)
      expect(errs.length).toBeGreaterThan(0)
    })

    it('SearchCollaboratorsDto enforces bounds and defaults', async () => {
      const dto = plainToInstance(SearchCollaboratorsDto, {})
      const errs = await validate(dto)
      expect(errs).toHaveLength(0)
      expect(dto.limit).toBe(20)
      expect(dto.offset).toBe(0)
      const bad = plainToInstance(SearchCollaboratorsDto, { limit: 1000, offset: -1 })
      const errs2 = await validate(bad)
      expect(errs2.length).toBeGreaterThan(0)
    })

    it('Collaborator status DTO restricts enum', async () => {
      const ok = plainToInstance(CollaboratorStatusDto, { status: 'active' })
      expect((await validate(ok))).toHaveLength(0)
      const bad = plainToInstance(CollaboratorStatusDto, { status: 'paused' as any })
      expect((await validate(bad)).length).toBeGreaterThan(0)
    })
  })

  describe('Users DTOs', () => {
    it('CreateUserDto lowercases email and checks password length', async () => {
      const dto = plainToInstance(CreateUserDto, {
        email: 'Alice@Example.com',
        fullName: 'Alice',
        password: '12345678',
      })
      const errs = await validate(dto)
      expect(errs).toHaveLength(0)
      expect(dto.email).toBe('alice@example.com')

      const bad = plainToInstance(CreateUserDto, {
        email: 'not-an-email',
        fullName: '',
        password: 'short',
      })
      expect((await validate(bad)).length).toBeGreaterThan(0)
    })

    it('EmailParamDto lowercases and validates email', async () => {
      const dto = plainToInstance(EmailParamDto, { email: 'X@Y.COM' })
      const errs = await validate(dto)
      expect(errs).toHaveLength(0)
      expect(dto.email).toBe('x@y.com')
    })

    it('UpdateUserStatusDto restricts enum', async () => {
      const ok = plainToInstance(UpdateUserStatusDto, { status: 'disabled' })
      expect((await validate(ok))).toHaveLength(0)
      const bad = plainToInstance(UpdateUserStatusDto, { status: 'locked' as any })
      expect((await validate(bad)).length).toBeGreaterThan(0)
    })

    it('UpdateUserRolesDto deduplicates roles', async () => {
      const dto = plainToInstance(UpdateUserRolesDto, { roles: ['admin', 'hr', 'admin'] })
      const errs = await validate(dto)
      expect(errs).toHaveLength(0)
      expect(dto.roles).toEqual(['admin', 'hr'])
    })
  })

  describe('Medical Certificates DTOs', () => {
    it('CreateMedicalCertificateDto enforces endDate >= startDate and days bounds', async () => {
      const ok = plainToInstance(CreateMedicalCertificateDto, {
        collaboratorId: '60ddae5f2f8fb814c89bd421',
        startDate: '2025-01-01',
        endDate: '2025-01-03',
        days: 3,
        icdCode: 'J06.9',
        icdTitle: 'URI, unspecified',
      })
      expect((await validate(ok))).toHaveLength(0)

      const bad = plainToInstance(CreateMedicalCertificateDto, {
        collaboratorId: '60ddae5f2f8fb814c89bd421',
        startDate: '2025-01-03',
        endDate: '2025-01-01',
        days: 0,
        icdCode: '',
        icdTitle: '',
      })
      expect((await validate(bad)).length).toBeGreaterThan(0)
    })

    it('FilterMedicalCertificatesDto validates filters and pagination', async () => {
      const dto = plainToInstance(FilterMedicalCertificatesDto, {
        limit: 10,
        offset: 5,
        status: 'active',
        startDate: '2025-01-01',
        endDate: '2025-01-10',
      })
      expect((await validate(dto))).toHaveLength(0)

      const bad = plainToInstance(FilterMedicalCertificatesDto, { limit: 1000, offset: -1 })
      expect((await validate(bad)).length).toBeGreaterThan(0)
    })
  })
})
