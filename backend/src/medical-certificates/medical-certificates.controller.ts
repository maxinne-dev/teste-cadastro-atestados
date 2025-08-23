import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MedicalCertificatesService } from './medical-certificates.service.js';
import { CreateMedicalCertificateDto } from './dto/create-medical-certificate.dto.js';
import { FilterMedicalCertificatesDto } from './dto/filter-medical-certificates.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('medical-certificates')
@ApiTags('Medical Certificates')
@ApiBearerAuth('bearer')
export class MedicalCertificatesController {
  constructor(
    private readonly certs: MedicalCertificatesService,
    private readonly audit: AuditService,
  ) {}

  @Post()
  async create(@Body() dto: CreateMedicalCertificateDto) {
    const created = await this.certs.create(dto as any);
    await this.audit.record({
      action: 'certificate.create',
      targetId: (created as any)?._id?.toString?.(),
      resource: 'POST /medical-certificates',
      metadata: { collaboratorId: dto.collaboratorId, icdCode: dto.icdCode },
    });
    return created;
  }

  @Get()
  async list(@Query() q: FilterMedicalCertificatesDto) {
    const filter: any = {};
    if (q.collaboratorId) filter.collaboratorId = q.collaboratorId;
    if (q.status) filter.status = q.status;
    if (q.icdCode) filter.icdCode = q.icdCode;
    if (q.startDate || q.endDate)
      filter.range = { start: q.startDate, end: q.endDate };

    const all = await this.certs.filter(filter);
    // Sort by requested field and direction; default issueDate desc
    const sortBy = q.sortBy || 'issueDate';
    const dir = (q.sortDir || 'desc') === 'desc' ? -1 : 1;
    const sorted = all.sort((a: any, b: any) => {
      const av = a[sortBy] ?? a.startDate; // fallback for issueDate
      const bv = b[sortBy] ?? b.startDate;
      const da = new Date(av).getTime();
      const db = new Date(bv).getTime();
      if (!isFinite(da) || !isFinite(db)) return 0;
      return (da - db) * dir;
    });
    const limit = q.limit ?? 20;
    const offset = q.offset ?? 0;
    const total = sorted.length;
    const results = sorted.slice(offset, offset + limit);
    return { results, limit, offset, total };
  }

  @Patch(':id/cancel')
  async cancel(@Param('id') id: string) {
    const updated = await this.certs.cancel(id);
    if (!updated) throw new NotFoundException('Medical certificate not found');
    await this.audit.record({
      action: 'certificate.cancel',
      targetId: id,
      resource: 'PATCH /medical-certificates/:id/cancel',
    });
    return updated;
  }
}
