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
import {
  GHANA_E164_PHONE_PATTERN,
  normalizeGhanaPhoneNumber,
} from '../../common/phone-number';

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

  @Transform(({ value }: { value: unknown }) =>
    normalizeGhanaPhoneNumber(value),
  )
  @IsOptional()
  @Matches(GHANA_E164_PHONE_PATTERN, {
    message: 'Enter a valid Ghana phone number, such as 024 000 0000.',
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
  @MinLength(1, { each: true })
  @MaxLength(40, { each: true })
  skills?: string[];
}
