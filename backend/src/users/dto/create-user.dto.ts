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

export class CreateUserDto {
  @IsEmail()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  email!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullName!: string

  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string

  @IsOptional()
  @IsArray()
  roles?: string[]
}

