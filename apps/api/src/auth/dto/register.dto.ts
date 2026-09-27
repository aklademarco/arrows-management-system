import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  GHANA_E164_PHONE_PATTERN,
  normalizeGhanaPhoneNumber,
} from '../../common/phone-number';

const normalizeText = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const VALID_EMAIL_DOMAIN =
  /@(?!gmal\.com$|gmial\.com$|gmai\.com$|gmail\.con$|gmail\.co$|yaho\.com$|yhoo\.com$|yahoo\.con$|hotmal\.com$|hotmai\.com$|hotmail\.con$|outlok\.com$|outloo\.com$|outlook\.con$)[^@]+$/i;

export class RegisterDto {
  @Transform(normalizeText)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @Transform(normalizeText)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @Transform(normalizeText)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  otherNames?: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @Matches(VALID_EMAIL_DOMAIN, {
    message: 'Check your email address. The email domain may be misspelled.',
  })
  @MaxLength(255)
  email!: string;

  @Transform(({ value }: { value: unknown }) =>
    normalizeGhanaPhoneNumber(value),
  )
  @IsOptional()
  @Matches(GHANA_E164_PHONE_PATTERN, {
    message: 'Enter a valid Ghana phone number, such as 024 000 0000.',
  })
  phone?: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  @Matches(/[a-z]/, { message: 'password must contain a lowercase letter' })
  @Matches(/[A-Z]/, { message: 'password must contain an uppercase letter' })
  @Matches(/\d/, { message: 'password must contain a number' })
  @Matches(/[^A-Za-z0-9]/, {
    message: 'password must contain a special character',
  })
  password!: string;

  @IsOptional()
  @IsUUID()
  requestedDepartmentId?: string;
}
