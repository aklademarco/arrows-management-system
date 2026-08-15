import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum LiturgyControlAction {
  START = 'START',
  PAUSE = 'PAUSE',
  RESUME = 'RESUME',
  EXTEND = 'EXTEND',
  SKIP = 'SKIP',
  COMPLETE = 'COMPLETE',
}

export class ControlLiturgyItemDto {
  @IsEnum(LiturgyControlAction)
  action!: LiturgyControlAction;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  extensionMinutes?: number;
}
