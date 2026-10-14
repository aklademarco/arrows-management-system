import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { LoginDto } from './login.dto';

export class AccountStatusDto extends LoginDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  @Matches(/^[A-Za-z0-9_:.-]+$/)
  pushToken?: string;
}
