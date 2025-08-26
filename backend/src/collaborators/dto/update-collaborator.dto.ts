import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCollaboratorDto {
  @ApiPropertyOptional({ example: 'Maria da Silva', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  @ApiPropertyOptional({ type: String, example: '1990-05-10' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  birthDate?: Date;

  @ApiPropertyOptional({ example: 'Analista de RH', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  position?: string;

  @ApiPropertyOptional({ example: 'Recursos Humanos', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;
}

