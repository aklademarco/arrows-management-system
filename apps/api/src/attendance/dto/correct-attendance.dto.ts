import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class CorrectAttendanceDto {
  @IsIn(['EARLY', 'ON_TIME', 'LATE', 'ABSENT', 'EXCUSED'])
  status!: 'EARLY' | 'ON_TIME' | 'LATE' | 'ABSENT' | 'EXCUSED';
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reviewNote!: string;
}
