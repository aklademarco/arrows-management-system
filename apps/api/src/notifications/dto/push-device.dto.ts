import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PushDeviceDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  previousSecret?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  @Matches(/^[A-Za-z0-9_:.-]+$/)
  token!: string;
}
