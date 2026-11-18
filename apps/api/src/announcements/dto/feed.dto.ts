import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const FEED_REACTIONS = ['LIKE', 'AMEN', 'LOVE'] as const;
export type FeedReaction = (typeof FEED_REACTIONS)[number];

export class ListFeedDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  limit = 10;
}

export class ListCommentsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 30;
}

export class ReactDto {
  @IsIn(FEED_REACTIONS)
  reaction!: FeedReaction;
}

export class CommentBodyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  body!: string;
}

export class ReasonDto {
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  reason!: string;
}

export class SetPinnedDto {
  @IsBoolean()
  pinned!: boolean;
}

export class SetCommentsClosedDto {
  @IsBoolean()
  closed!: boolean;
}
