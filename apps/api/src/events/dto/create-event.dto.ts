import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  eventType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsDateString()
  attendanceOpensAt!: string;

  @IsDateString()
  attendanceClosesAt!: string;

  @IsOptional()
  @IsDateString()
  earlyUntil?: string;

  @IsDateString()
  lateAfter!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  locationName?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5000)
  geofenceRadiusMeters!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  maximumAccuracyMeters!: number;
}
