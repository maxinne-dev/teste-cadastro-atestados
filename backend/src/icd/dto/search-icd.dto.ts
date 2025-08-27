import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchIcdDto {
  @ApiPropertyOptional({ 
    description: 'Termo de busca. Para códigos CID-10 (ex: F84, F84.1): valida na tabela CREMESP e busca dados da API ICD. Para outros termos: busca diretamente na API CID-11', 
    minLength: 1, 
    maxLength: 100,
    examples: ['F84', 'F84.1', 'autismo', 'depression']
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  q?: string;
}

