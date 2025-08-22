import { IsEnum } from 'class-validator'

export class UpdateUserStatusDto {
  @IsEnum(['active', 'disabled'])
  status!: 'active' | 'disabled'
}

