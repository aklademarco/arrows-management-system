import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class SetPrimaryDepartmentDto {
  @ValidateIf(
    (value: SetPrimaryDepartmentDto) => value.departmentMembershipId !== null,
  )
  @IsUUID()
  departmentMembershipId!: string | null;

  @IsOptional()
  @IsDateString({ strict: true })
  effectiveOn?: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason!: string;
}
