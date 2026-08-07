import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePointsAdjustmentDto {
  @IsInt() @Min(-1000) @Max(1000) points!: number;
  @IsString() @IsNotEmpty() @MaxLength(180) reason!: string;
}
