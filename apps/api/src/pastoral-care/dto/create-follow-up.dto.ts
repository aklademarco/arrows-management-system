import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateFollowUpDto {
  @IsIn(['CALL', 'MESSAGE', 'VISIT', 'IN_PERSON', 'OTHER'])
  method!: 'CALL' | 'MESSAGE' | 'VISIT' | 'IN_PERSON' | 'OTHER';

  @IsIn([
    'NO_RESPONSE',
    'REACHED',
    'NEEDS_PRAYER',
    'NEEDS_VISIT',
    'SICK',
    'TRAVELLING',
    'RETURNING_SOON',
    'CARE_COMPLETED',
  ])
  outcome!:
    | 'NO_RESPONSE'
    | 'REACHED'
    | 'NEEDS_PRAYER'
    | 'NEEDS_VISIT'
    | 'SICK'
    | 'TRAVELLING'
    | 'RETURNING_SOON'
    | 'CARE_COMPLETED';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  nextFollowUpOn?: string;
}
