import { Transform, Type } from 'class-transformer'
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'
import { IsCpf, normalizeCpfTransform } from '../../common/validators/cpf.validator.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateCollaboratorDto {
  @ApiProperty({ example: 'Maria da Silva', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullName!: string

  @ApiProperty({ example: '52998224725', description: 'CPF apenas dígitos', minLength: 11, maxLength: 14 })
  @IsString()
  @IsNotEmpty()
  @MinLength(11)
  @MaxLength(14)
  @IsCpf()
  @Transform(({ value }) => normalizeCpfTransform(value))
  cpf!: string

  @ApiProperty({ type: String, example: '1990-05-10' })
  @Type(() => Date)
  @IsDate()
  birthDate!: Date

  @ApiProperty({ example: 'Analista de RH', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  position!: string

  @ApiPropertyOptional({ example: 'Recursos Humanos', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string
}
