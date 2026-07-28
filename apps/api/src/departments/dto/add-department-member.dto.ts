import { IsBoolean, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class AddDepartmentMemberDto {
  @IsUUID()
  memberId!: string;

  @IsOptional()
  @IsBoolean()
  makePrimary = false;

  @IsOptional()
  @IsDateString({ strict: true })
  joinedAt?: string;
}
