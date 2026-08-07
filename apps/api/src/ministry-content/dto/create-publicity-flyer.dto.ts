import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePublicityFlyerDto {
  @IsString() @MinLength(1) @MaxLength(180) title!: string;
  @IsOptional() @IsString() @MaxLength(2000) instructions?: string;
  @IsOptional() @IsUUID() eventId?: string;
  @IsOptional() @IsDateString() deadlineAt?: string;
  @IsUrl({ protocols: ['https'], require_protocol: true })
  cloudinaryUrl!: string;
  @IsString() @MinLength(1) @MaxLength(255) cloudinaryPublicId!: string;
  @IsString() @MinLength(1) @MaxLength(255) fileName!: string;
  @IsIn(['image/jpeg', 'image/png', 'image/webp']) mimeType!: string;
}
