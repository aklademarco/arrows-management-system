import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfilePhotoDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  profilePhotoUrl!: string | null;
}
