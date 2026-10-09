import { Transform } from 'class-transformer';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

function trim({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateCareRequestDto {
  @IsIn(['MESSAGE', 'PRAYER_REQUEST'])
  type!: 'MESSAGE' | 'PRAYER_REQUEST';

  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  subject!: string;

  @Transform(trim)
  @IsString()
  @MinLength(10)
  @MaxLength(5_000)
  body!: string;
}
