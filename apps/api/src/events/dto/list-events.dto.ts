import { IsIn, IsOptional, Matches } from 'class-validator';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class ListEventsDto {
  @IsOptional()
  @IsIn(['DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'])
  status?: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'from must be a YYYY-MM-DD date.' })
  from?: string;

  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'to must be a YYYY-MM-DD date.' })
  to?: string;
}
