import { IsEnum } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateStatusDto {
  @ApiProperty({ enum: ['active', 'inactive'] })
  @IsEnum(['active', 'inactive'])
  status!: 'active' | 'inactive'
}
