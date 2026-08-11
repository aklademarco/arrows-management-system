import { ArrayUnique, IsArray, IsIn } from 'class-validator';

export class UpdateMinistryRolesDto {
  @IsArray()
  @ArrayUnique()
  @IsIn(['PASTOR', 'DEPARTMENT_LEADER'], { each: true })
  roles!: Array<'PASTOR' | 'DEPARTMENT_LEADER'>;
}
