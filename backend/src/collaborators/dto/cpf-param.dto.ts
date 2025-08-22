import { Transform } from 'class-transformer'
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'
import { IsCpf, normalizeCpfTransform } from '../../common/validators/cpf.validator.js'

export class CpfParamDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(11)
  @MaxLength(14)
  @IsCpf()
  @Transform(({ value }) => normalizeCpfTransform(value))
  cpf!: string
}

