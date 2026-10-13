import { IsDefined, IsUUID, ValidateIf } from 'class-validator';

export class AssignDutyDto {
  @IsDefined()
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsUUID()
  memberId!: string | null;
}
