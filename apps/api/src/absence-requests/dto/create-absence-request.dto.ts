import {
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Submit an absence request in exactly one of two modes:
 *  - event-specific: supply `eventId` only.
 *  - date-range: supply both `startsOn` and `endsOn` only.
 *
 * The mode exclusivity (and start/end ordering) is enforced in the service so
 * that a violation surfaces as a single VALIDATION_ERROR rather than a mix of
 * field-level messages.
 */
export class CreateAbsenceRequestDto {
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'startsOn must be a YYYY-MM-DD date.' })
  startsOn?: string;

  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'endsOn must be a YYYY-MM-DD date.' })
  endsOn?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  details?: string;
}
