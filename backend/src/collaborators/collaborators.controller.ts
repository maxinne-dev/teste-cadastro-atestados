import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { CollaboratorsService } from './collaborators.service.js';
import { CreateCollaboratorDto } from './dto/create-collaborator.dto.js';
import { CpfParamDto } from './dto/cpf-param.dto.js';
import { SearchCollaboratorsDto } from './dto/search-collaborators.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('collaborators')
@ApiTags('Collaborators')
@ApiBearerAuth('bearer')
export class CollaboratorsController {
  constructor(
    private readonly collaborators: CollaboratorsService,
    private readonly audit: AuditService,
  ) {}

  @Post()
  async create(@Body() dto: CreateCollaboratorDto) {
    const created = await this.collaborators.create(dto);
    await this.audit.record({
      action: 'collaborator.create',
      targetId: created?.cpf,
      resource: 'POST /collaborators',
    });
    return created;
  }

  @Get(':cpf')
  async getByCpf(@Param() params: CpfParamDto) {
    const found = await this.collaborators.findByCpf(params.cpf);
    if (!found) throw new NotFoundException('Collaborator not found');
    return found;
  }

  @Get()
  async search(@Query() q: SearchCollaboratorsDto) {
    const term = q.q || '';
    const limit = q.limit ?? 20;
    const offset = q.offset ?? 0;

    const { results, total } = await this.collaborators.searchByNameWithTotal(
      term,
      limit,
      offset,
    );
    return { results, limit, offset, total };
  }

  @Patch(':cpf/status')
  async updateStatus(
    @Param() params: CpfParamDto,
    @Body() body: UpdateStatusDto,
  ) {
    const updated = await this.collaborators.setStatus(params.cpf, body.status);
    if (!updated) throw new NotFoundException('Collaborator not found');
    await this.audit.record({
      action: 'collaborator.status.change',
      targetId: params.cpf,
      resource: 'PATCH /collaborators/:cpf/status',
      metadata: { status: body.status },
    });
    return updated;
  }
}
