import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateEventDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(180) name?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsDateString() attendanceOpensAt?: string;
  @IsOptional() @IsDateString() attendanceClosesAt?: string;
  @IsOptional() @IsDateString() earlyUntil?: string;
  @IsOptional() @IsDateString() lateAfter?: string;
  @IsOptional() @IsString() @MaxLength(180) locationName?: string;
  @IsOptional() @IsInt() @Min(1) @Max(5000) geofenceRadiusMeters?: number;
  @IsOptional() @IsInt() @Min(1) @Max(1000) maximumAccuracyMeters?: number;
}
