import { IsOptional, IsString, MaxLength, MinLength, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchIcdDto {
  @ApiPropertyOptional({ description: 'Termo de busca', minLength: 1, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ 
    description: 'Versão do CID (10 ou 11)', 
    enum: ['10', '11'],
    default: '11' 
  })
  @IsOptional()
  @IsString()
  @IsIn(['10', '11'])
  version?: string;
}

