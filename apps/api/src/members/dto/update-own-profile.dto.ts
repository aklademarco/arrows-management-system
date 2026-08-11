import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateOwnProfileDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  otherNames?: string | null;

  @Transform(trim)
  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'phone must use international format, for example +233240000000',
  })
  phone?: string | null;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  directoryBio?: string | null;

  @IsOptional()
  @IsBoolean()
  directoryVisible?: boolean;

  @IsOptional()
  @IsBoolean()
  directoryPhoneVisible?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  skills?: string[];
}
