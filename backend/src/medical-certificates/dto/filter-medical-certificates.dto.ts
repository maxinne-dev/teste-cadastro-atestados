import { Type } from 'class-transformer'
import { IsDate, IsEnum, IsMongoId, IsOptional, IsString, IsInt, Min, Max } from 'class-validator'

export class FilterMedicalCertificatesDto {
  @IsOptional()
  @IsMongoId()
  collaboratorId?: string

  @IsOptional()
  @IsString()
  icdCode?: string

  @IsOptional()
  @IsEnum(['active', 'cancelled', 'expired'])
  status?: 'active' | 'cancelled' | 'expired'

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20
}

