import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  NotFoundException,
} from '@nestjs/common'
import { CollaboratorsService } from './collaborators.service.js'
import { CreateCollaboratorDto } from './dto/create-collaborator.dto.js'
import { CpfParamDto } from './dto/cpf-param.dto.js'
import { SearchCollaboratorsDto } from './dto/search-collaborators.dto.js'
import { UpdateStatusDto } from './dto/update-status.dto.js'

@Controller('collaborators')
export class CollaboratorsController {
  constructor(private readonly collaborators: CollaboratorsService) {}

  @Post()
  async create(@Body() dto: CreateCollaboratorDto) {
    const created = await this.collaborators.create(dto)
    return created
  }

  @Get(':cpf')
  async getByCpf(@Param() params: CpfParamDto) {
    const found = await this.collaborators.findByCpf(params.cpf)
    if (!found) throw new NotFoundException('Collaborator not found')
    return found
  }

  @Get()
  async search(@Query() q: SearchCollaboratorsDto) {
    const term = q.q || ''
    const limit = q.limit ?? 20
    const offset = q.offset ?? 0

    const { results, total } = await this.collaborators.searchByNameWithTotal(
      term,
      limit,
      offset
    )
    return { results, limit, offset, total }
  }

  @Patch(':cpf/status')
  async updateStatus(@Param() params: CpfParamDto, @Body() body: UpdateStatusDto) {
    const updated = await this.collaborators.setStatus(params.cpf, body.status)
    if (!updated) throw new NotFoundException('Collaborator not found')
    return updated
  }
}
