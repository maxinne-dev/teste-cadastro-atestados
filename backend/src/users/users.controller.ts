import { Body, Controller, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common'
import { UsersService } from './users.service.js'
import { CreateUserDto } from './dto/create-user.dto.js'
import { EmailParamDto } from './dto/email-param.dto.js'
import { UpdateUserStatusDto } from './dto/update-status.dto.js'
import { UpdateUserRolesDto } from './dto/update-roles.dto.js'
import { PasswordService } from '../auth/password.service.js'

@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly passwords: PasswordService
  ) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const email = String(dto.email).trim().toLowerCase()
    const passwordHash = await this.passwords.hash(dto.password)
    const created = await this.users.create({
      email,
      fullName: dto.fullName,
      passwordHash,
      roles: dto.roles,
    })
    return created
  }

  @Get(':email')
  async get(@Param() params: EmailParamDto) {
    const found = await this.users.findByEmail(params.email)
    if (!found) throw new NotFoundException('User not found')
    return found
  }

  @Patch(':email/status')
  async updateStatus(@Param() params: EmailParamDto, @Body() dto: UpdateUserStatusDto) {
    const updated = await this.users.setStatus(params.email, dto.status)
    if (!updated) throw new NotFoundException('User not found')
    return updated
  }

  @Patch(':email/roles')
  async updateRoles(@Param() params: EmailParamDto, @Body() dto: UpdateUserRolesDto) {
    const updated = await this.users.assignRoles(params.email, dto.roles)
    if (!updated) throw new NotFoundException('User not found')
    return updated
  }
}
