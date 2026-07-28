import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ApproveRegistrationDto {
  @IsUUID()
  primaryDepartmentId!: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  additionalDepartmentIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class RejectRegistrationDto {
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason!: string;
}
