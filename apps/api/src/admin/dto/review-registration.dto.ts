import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ApproveRegistrationDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class RejectRegistrationDto {
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason!: string;
}
