import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { IsEndDateGteStartDate } from '../../common/validators/date-range.validator.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicalCertificateDto {
  @ApiProperty({
    description: 'ID do colaborador (ObjectId)',
    example: '64ddae5f2f8fb814c89bd421',
  })
  @IsMongoId()
  collaboratorId!: string;

  @ApiPropertyOptional({
    description: 'ID do emissor (usuário)',
    example: '64ddae5f2f8fb814c89bd422',
  })
  @IsOptional()
  @IsMongoId()
  issuerUserId?: string;

  @ApiProperty({ type: String, example: '2025-01-01' })
  @Type(() => Date)
  @IsDate()
  startDate!: Date;

  @ApiProperty({ type: String, example: '2025-01-05' })
  @Type(() => Date)
  @IsDate()
  endDate!: Date;

  @ApiProperty({ example: 5, minimum: 1, maximum: 365 })
  @IsInt()
  @Min(1)
  @Max(365)
  days!: number;

  @ApiPropertyOptional({ example: 'Resfriado comum' })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiProperty({ example: 'J06.9' })
  @IsString()
  @IsNotEmpty()
  icdCode!: string;

  @ApiProperty({ example: 'Acute upper respiratory infection, unspecified' })
  @IsString()
  @IsNotEmpty()
  icdTitle!: string;
}

// Apply cross-field validation on the class prototype
IsEndDateGteStartDate('startDate', 'endDate')(
  CreateMedicalCertificateDto.prototype,
  'endDate',
);
// For Swagger schema clarity
Reflect.defineMetadata(
  'swagger/apiModel',
  'CreateMedicalCertificateDto',
  CreateMedicalCertificateDto,
);
