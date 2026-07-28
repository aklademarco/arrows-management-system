import { IsIn, IsOptional } from 'class-validator';
import { UpdateOwnProfileDto } from './update-own-profile.dto';

export class UpdateMemberDto extends UpdateOwnProfileDto {
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'ARCHIVED'])
  membershipStatus?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'ARCHIVED';
}
