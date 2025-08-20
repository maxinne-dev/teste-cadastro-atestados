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

export class CreateCollaboratorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullName!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(11)
  @MaxLength(14)
  @IsCpf()
  @Transform(({ value }) => normalizeCpfTransform(value))
  cpf!: string

  @Type(() => Date)
  @IsDate()
  birthDate!: Date

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  position!: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string
}

