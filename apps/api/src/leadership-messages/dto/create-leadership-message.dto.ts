import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum LeadershipMessageAudience {
  CHURCH = 'CHURCH',
  DEPARTMENT = 'DEPARTMENT',
}

export class CreateLeadershipMessageDto {
  @IsEnum(LeadershipMessageAudience)
  audience!: LeadershipMessageAudience;

  @IsString()
  @MinLength(1)
  @MaxLength(180)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5_000)
  body!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  departmentIds?: string[];

  @IsOptional()
  @IsBoolean()
  smsRequested?: boolean;
}
