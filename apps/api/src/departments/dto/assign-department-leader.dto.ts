import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AssignDepartmentLeaderDto {
  @IsUUID()
  memberId!: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title?: string;

  @IsDateString({ strict: true })
  startsAt!: string;

  @IsOptional()
  @IsDateString({ strict: true })
  endsAt?: string | null;
}
