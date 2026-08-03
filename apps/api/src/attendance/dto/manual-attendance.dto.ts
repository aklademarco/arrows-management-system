import { IsIn, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class ManualAttendanceDto {
  @IsUUID()
  eventId!: string;
  @IsUUID()
  memberId!: string;
  @IsIn(['EARLY', 'ON_TIME', 'LATE'])
  status!: 'EARLY' | 'ON_TIME' | 'LATE';
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason!: string;
}
