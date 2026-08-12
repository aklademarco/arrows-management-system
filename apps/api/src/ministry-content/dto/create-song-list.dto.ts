import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateSongItemDto {
  @IsString() @MinLength(1) @MaxLength(180) title!: string;
  @IsOptional() @IsString() @MaxLength(20_000) lyrics?: string;
  @IsOptional() @IsString() @MaxLength(30) musicalKey?: string;
  @IsOptional() @IsString() @MaxLength(2_000) notes?: string;
}

export class CreateSongListDto {
  @IsString() @MinLength(1) @MaxLength(180) title!: string;
  @IsOptional() @IsString() @MaxLength(2_000) instructions?: string;
  @IsOptional() @IsUUID() eventId?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => CreateSongItemDto)
  songs!: CreateSongItemDto[];
}
