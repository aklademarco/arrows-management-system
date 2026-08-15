import {
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class GenerateEventLiturgyDto {
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  preacherName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  sermonTitle?: string;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  preacherImageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  preacherImagePublicId?: string;
}
