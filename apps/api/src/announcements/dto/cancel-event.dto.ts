import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelEventDto {
  /** Shown to members on the cancelled event. */
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
