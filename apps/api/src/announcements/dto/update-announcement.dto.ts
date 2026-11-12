import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  ANNOUNCEMENT_KINDS,
  type AnnouncementKind,
} from './create-announcement.dto';

/**
 * Partial update. Omitted fields are unchanged; `null` clears an optional
 * field. Kind and title cannot be cleared.
 */
export class UpdateAnnouncementDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsIn(ANNOUNCEMENT_KINDS)
  kind?: AnnouncementKind;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  theme?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  locationName?: string | null;

  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  flyerUrl?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  flyerPublicId?: string | null;
}
