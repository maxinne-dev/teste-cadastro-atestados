import { Type } from 'class-transformer'
import {
  IsDate,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator'
import { IsEndDateGteStartDate } from '../../common/validators/date-range.validator.js'

export class CreateMedicalCertificateDto {
  @IsMongoId()
  collaboratorId!: string

  @IsOptional()
  @IsMongoId()
  issuerUserId?: string

  @Type(() => Date)
  @IsDate()
  startDate!: Date

  @Type(() => Date)
  @IsDate()
  endDate!: Date

  @IsInt()
  @Min(1)
  @Max(365)
  days!: number

  @IsOptional()
  @IsString()
  diagnosis?: string

  @IsString()
  @IsNotEmpty()
  icdCode!: string

  @IsString()
  @IsNotEmpty()
  icdTitle!: string
}

// Apply cross-field validation on the class prototype
IsEndDateGteStartDate('startDate', 'endDate')(
  CreateMedicalCertificateDto.prototype,
  'endDate'
)

