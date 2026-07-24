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

const normalizeText = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

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
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @Transform(normalizeText)
  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'phone must use international format, for example +233240000000',
  })
  phone?: string;

  @IsString()
  @MinLength(12)
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
