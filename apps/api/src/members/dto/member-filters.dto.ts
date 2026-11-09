import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Filters shared by the paginated member list and the Excel export. */
export class MemberFiltersDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'ARCHIVED'])
  membershipStatus?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'ARCHIVED';

  @IsOptional()
  @IsIn(['ACTIVE', 'SUSPENDED', 'ARCHIVED'])
  accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
}
