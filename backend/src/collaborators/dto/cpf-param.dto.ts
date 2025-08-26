import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import {
  IsCpf,
  normalizeCpfTransform,
} from '../../common/validators/cpf.validator.js';
import { ApiProperty } from '@nestjs/swagger';

export class CpfParamDto {
  @ApiProperty({ type: String, example: '52998224725' })
  @IsString()
  @IsNotEmpty()
  @MinLength(11)
  @MaxLength(14)
  @IsCpf()
  @Transform(({ value }) => normalizeCpfTransform(value))
  cpf!: string;
}
