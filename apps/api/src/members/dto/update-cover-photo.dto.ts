import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCoverPhotoDto {
  @IsOptional()
  @IsString()
  @MaxLength(900000)
  coverPhotoUrl!: string | null;
}
