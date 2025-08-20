import { Transform } from 'class-transformer'
import { IsArray, IsString } from 'class-validator'

export class UpdateUserRolesDto {
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.from(new Set((value || []).map((r: any) => String(r)))))
  roles!: string[]
}
