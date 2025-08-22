import { Type } from 'class-transformer'
import { IsDate, IsEnum, IsMongoId, IsOptional, IsString, IsInt, Min, Max } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class FilterMedicalCertificatesDto {
  @ApiPropertyOptional({ description: 'ID do colaborador (ObjectId)' })
  @IsOptional()
  @IsMongoId()
  collaboratorId?: string

  @ApiPropertyOptional({ description: 'Código CID-11' })
  @IsOptional()
  @IsString()
  icdCode?: string

  @ApiPropertyOptional({ enum: ['active', 'cancelled', 'expired'] })
  @IsOptional()
  @IsEnum(['active', 'cancelled', 'expired'])
  status?: 'active' | 'cancelled' | 'expired'

  @ApiPropertyOptional({ type: String, example: '2025-01-01' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date

  @ApiPropertyOptional({ type: String, example: '2025-01-31' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20
}
