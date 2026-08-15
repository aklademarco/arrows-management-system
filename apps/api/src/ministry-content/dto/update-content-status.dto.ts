import { IsEnum } from 'class-validator';

export enum MinistryContentAction {
  ACKNOWLEDGE = 'ACKNOWLEDGE',
  COMPLETE = 'COMPLETE',
}

export class UpdateContentStatusDto {
  @IsEnum(MinistryContentAction)
  action!: MinistryContentAction;
}
