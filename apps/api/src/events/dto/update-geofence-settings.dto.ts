import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateGeofenceSettingsDto {
  @IsString()
  @MaxLength(180)
  locationName!: string;

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
