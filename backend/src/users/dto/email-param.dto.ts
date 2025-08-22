import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EmailParamDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  email!: string;
}
