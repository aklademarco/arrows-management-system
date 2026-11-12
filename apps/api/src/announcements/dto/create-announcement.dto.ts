import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export const ANNOUNCEMENT_KINDS = ['ANNOUNCEMENT', 'EVENT'] as const;
export type AnnouncementKind = (typeof ANNOUNCEMENT_KINDS)[number];

export class CreateAnnouncementDto {
  @IsIn(ANNOUNCEMENT_KINDS)
  kind!: AnnouncementKind;

  @IsString()
  @MinLength(1)
  @MaxLength(180)
  title!: string;

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

  /** Required for events, optional for announcements. */
  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  /** Must be sent together with flyerPublicId. */
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  flyerUrl?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  flyerPublicId?: string | null;
}
