import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * A reviewer decision. APPROVED runs the reconciliation transaction; the other
 * terminal/holding states only update the request's review metadata.
 */
export class ReviewAbsenceRequestDto {
  @IsIn(['APPROVED', 'REJECTED', 'NEEDS_CLARIFICATION'])
  status!: 'APPROVED' | 'REJECTED' | 'NEEDS_CLARIFICATION';

  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reviewNote!: string;
}
