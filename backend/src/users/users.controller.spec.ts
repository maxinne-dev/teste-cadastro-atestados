import { Test } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { PasswordService } from '../auth/password.service'

describe('UsersController', () => {
  let controller: UsersController
  let service: jest.Mocked<Partial<UsersService>>

  beforeEach(async () => {
    service = {
      create: jest.fn(async (dto: any) => ({ _id: 'u1', ...dto })),
      findByEmail: jest.fn(async () => null),
      setStatus: jest.fn(async () => null),
      assignRoles: jest.fn(async () => null),
    }

    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [PasswordService, { provide: UsersService, useValue: service }],
    }).compile()

    controller = module.get(UsersController)
  })

  it('creates user via service with hashed password', async () => {
    const res = await controller.create({
      email: 'Alice@Example.com',
      fullName: 'Alice',
      password: 'secret123',
      roles: ['admin', 'hr'],
    } as any)
    expect(service.create).toHaveBeenCalled()
    const payload = (service.create as jest.Mock).mock.calls[0][0]
    expect(payload.email).toBe('alice@example.com')
    expect(typeof payload.passwordHash).toBe('string')
    expect(payload.passwordHash).not.toBe('secret123')
  })

  it('get throws 404 when not found', async () => {
    await expect(controller.get({ email: 'nobody@example.com' } as any)).rejects.toBeInstanceOf(
      NotFoundException
    )
  })

  it('updateStatus throws 404 when service returns null', async () => {
    await expect(
      controller.updateStatus({ email: 'nobody@example.com' } as any, { status: 'disabled' } as any)
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('updateRoles throws 404 when service returns null', async () => {
    await expect(
      controller.updateRoles({ email: 'nobody@example.com' } as any, { roles: ['admin'] } as any)
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})
