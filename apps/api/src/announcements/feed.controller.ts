import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthenticatedUser } from '../auth/authenticated-user.decorator';
import {
  AuthenticatedGuard,
  type AuthenticatedPrincipal,
} from '../auth/authenticated.guard';
import { RATE_LIMITS } from '../common/security/rate-limits';
import {
  CommentBodyDto,
  ListCommentsDto,
  ListFeedDto,
  ReactDto,
  ReasonDto,
  SetCommentsClosedDto,
  SetPinnedDto,
} from './dto/feed.dto';
import { FeedService } from './feed.service';

/**
 * The church feed. Posts are created, edited, and archived through
 * /announcements; this controller covers reading and interaction.
 */
@Controller('feed')
@UseGuards(AuthenticatedGuard)
export class FeedController {
  constructor(private readonly service: FeedService) {}

  @Get()
  async list(
    @Query() query: ListFeedDto,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Feed retrieved.',
      data: await this.service.list(query, viewer),
    };
  }

  // Declared before ':postId' so "moderation" is not read as a post ID.
  @Get('moderation/reports')
  async reports(@AuthenticatedUser() viewer: AuthenticatedPrincipal) {
    return {
      success: true,
      message: 'Reported comments retrieved.',
      data: await this.service.listOpenReports(viewer),
    };
  }

  @Post('moderation/comments/:commentId/hide')
  @HttpCode(200)
  async hideComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() body: ReasonDto,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    await this.service.hideComment(commentId, body.reason, viewer);
    return { success: true, message: 'Comment hidden.', data: null };
  }

  @Post('moderation/comments/:commentId/dismiss-reports')
  @HttpCode(200)
  async dismissReports(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    await this.service.dismissReports(commentId, viewer);
    return { success: true, message: 'Reports dismissed.', data: null };
  }

  @Get(':postId')
  async get(
    @Param('postId', ParseUUIDPipe) postId: string,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Post retrieved.',
      data: await this.service.get(postId, viewer),
    };
  }

  @Put(':postId/reaction')
  @Throttle({ default: RATE_LIMITS.feedInteraction })
  async react(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() body: ReactDto,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Reaction saved.',
      data: await this.service.react(postId, body.reaction, viewer),
    };
  }

  @Delete(':postId/reaction')
  @Throttle({ default: RATE_LIMITS.feedInteraction })
  async removeReaction(
    @Param('postId', ParseUUIDPipe) postId: string,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Reaction removed.',
      data: await this.service.removeReaction(postId, viewer),
    };
  }

  @Get(':postId/comments')
  async comments(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() query: ListCommentsDto,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Comments retrieved.',
      data: await this.service.listComments(postId, query, viewer),
    };
  }

  @Post(':postId/comments')
  @Throttle({ default: RATE_LIMITS.feedInteraction })
  async addComment(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() body: CommentBodyDto,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Comment added.',
      data: await this.service.addComment(postId, body.body, viewer),
    };
  }

  @Patch(':postId/comments/:commentId')
  @Throttle({ default: RATE_LIMITS.feedInteraction })
  async editComment(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() body: CommentBodyDto,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    await this.service.editComment(postId, commentId, body.body, viewer);
    return { success: true, message: 'Comment updated.', data: null };
  }

  @Delete(':postId/comments/:commentId')
  @Throttle({ default: RATE_LIMITS.feedInteraction })
  async deleteComment(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    await this.service.deleteComment(postId, commentId, viewer);
    return { success: true, message: 'Comment removed.', data: null };
  }

  @Post(':postId/comments/:commentId/report')
  @HttpCode(200)
  @Throttle({ default: RATE_LIMITS.feedReport })
  async reportComment(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() body: ReasonDto,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    await this.service.reportComment(postId, commentId, body.reason, viewer);
    return {
      success: true,
      message: 'Thank you. A pastor or administrator will review it.',
      data: null,
    };
  }

  @Put(':postId/pinned')
  async setPinned(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() body: SetPinnedDto,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: body.pinned ? 'Post pinned.' : 'Post unpinned.',
      data: await this.service.setPinned(postId, body.pinned, viewer),
    };
  }

  @Put(':postId/comments-closed')
  async setCommentsClosed(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() body: SetCommentsClosedDto,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: body.closed ? 'Comments closed.' : 'Comments reopened.',
      data: await this.service.setCommentsClosed(postId, body.closed, viewer),
    };
  }
}
