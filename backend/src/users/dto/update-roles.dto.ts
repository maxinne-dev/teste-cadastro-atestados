import { Transform } from 'class-transformer';
import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRolesDto {
  @ApiProperty({ type: [String], example: ['admin', 'hr'] })
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    Array.from(new Set((value || []).map((r: any) => String(r)))),
  )
  roles!: string[];
}
