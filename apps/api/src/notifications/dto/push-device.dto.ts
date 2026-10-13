import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class PushDeviceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  @Matches(/^[A-Za-z0-9_:.-]+$/)
  token!: string;
}
