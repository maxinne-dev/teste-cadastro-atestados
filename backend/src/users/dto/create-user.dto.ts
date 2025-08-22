import { Transform } from 'class-transformer'
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateUserDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  email!: string

  @ApiProperty({ example: 'Alice', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullName!: string

  @ApiProperty({ example: 'secret12345', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string

  @ApiPropertyOptional({ type: [String], example: ['admin'] })
  @IsOptional()
  @IsArray()
  roles?: string[]
}
