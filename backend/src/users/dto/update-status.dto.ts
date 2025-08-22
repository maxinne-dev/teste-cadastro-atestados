import { IsEnum } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateUserStatusDto {
  @ApiProperty({ enum: ['active', 'disabled'] })
  @IsEnum(['active', 'disabled'])
  status!: 'active' | 'disabled'
}
