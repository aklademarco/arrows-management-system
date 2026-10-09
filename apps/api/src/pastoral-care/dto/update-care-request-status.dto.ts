import { IsIn } from 'class-validator';

export class UpdateCareRequestStatusDto {
  @IsIn(['IN_REVIEW', 'RESOLVED'])
  status!: 'IN_REVIEW' | 'RESOLVED';
}
