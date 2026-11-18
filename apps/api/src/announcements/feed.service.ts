import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/authenticated.guard';
import {
  FEED_REACTIONS,
  type FeedReaction,
  ListCommentsDto,
  ListFeedDto,
} from './dto/feed.dto';
import { FeedRepository } from './feed.repository';
import {
  PublisherAccessService,
  type PublisherAccess,
} from './publisher-access.service';

type FeedPost = Awaited<ReturnType<FeedRepository['findPost']>>;
type Engagement = Awaited<ReturnType<FeedRepository['engagement']>>;

/** Trims and checks free text written by members. */
function cleanBody(value: string, field: string, max: number) {
  const text = value.trim();
  if (!text) throw new BadRequestException(`${field} cannot be empty.`);
  if (text.length > max) {
    throw new BadRequestException(
      `${field} must be ${max} characters or fewer.`,
    );
  }
  return text;
}

@Injectable()
export class FeedService {
  constructor(
    private readonly repository: FeedRepository,
    private readonly access: PublisherAccessService,
  ) {}

  /** Pinned notices first, then newest. Readable by every signed-in member. */
  async list(query: ListFeedDto, viewer: AuthenticatedPrincipal) {
    const [{ items, total }, access] = await Promise.all([
      this.repository.listPosts(viewer.churchId, query.page, query.limit),
      this.access.resolve(viewer),
    ]);
    const engagement = await this.repository.engagement(
      items.map((post) => post.id),
      viewer.id,
    );
    return {
      items: items.map((post) =>
        this.present(post, engagement, viewer, access),
      ),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
      canPublish: access.canPublish,
      canModerate: access.canModerate,
    };
  }

  async get(postId: string, viewer: AuthenticatedPrincipal) {
    const [post, access] = await Promise.all([
      this.repository.findPost(postId, viewer.churchId),
      this.access.resolve(viewer),
    ]);
    const engagement = await this.repository.engagement([post.id], viewer.id);
    return {
      ...this.present(post, engagement, viewer, access),
      canModerate: access.canModerate,
    };
  }

  async react(
    postId: string,
    reaction: FeedReaction,
    viewer: AuthenticatedPrincipal,
  ) {
    await this.repository.findPost(postId, viewer.churchId);
    await this.repository.upsertReaction({
      churchId: viewer.churchId,
      postId,
      userId: viewer.id,
      reaction,
    });
    return this.get(postId, viewer);
  }

  async removeReaction(postId: string, viewer: AuthenticatedPrincipal) {
    await this.repository.findPost(postId, viewer.churchId);
    await this.repository.removeReaction(postId, viewer.id);
    return this.get(postId, viewer);
  }

  async listComments(
    postId: string,
    query: ListCommentsDto,
    viewer: AuthenticatedPrincipal,
  ) {
    await this.repository.findPost(postId, viewer.churchId);
    const { items, total } = await this.repository.listComments(
      postId,
      query.page,
      query.limit,
    );
    return {
      items: items.map(({ authorUserId, ...comment }) => ({
        ...comment,
        isOwn: authorUserId === viewer.id,
      })),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async addComment(
    postId: string,
    body: string,
    viewer: AuthenticatedPrincipal,
  ) {
    const post = await this.openPost(postId, viewer);
    return this.repository.createComment({
      churchId: viewer.churchId,
      post,
      authorUserId: viewer.id,
      body: cleanBody(body, 'A comment', 1000),
    });
  }

  async editComment(
    postId: string,
    commentId: string,
    body: string,
    viewer: AuthenticatedPrincipal,
  ) {
    await this.openPost(postId, viewer);
    await this.ownComment(postId, commentId, viewer);
    await this.repository.updateCommentBody(
      commentId,
      cleanBody(body, 'A comment', 1000),
    );
  }

  /** Authors remove their own comments; the record is kept, not erased. */
  async deleteComment(
    postId: string,
    commentId: string,
    viewer: AuthenticatedPrincipal,
  ) {
    await this.repository.findPost(postId, viewer.churchId);
    await this.ownComment(postId, commentId, viewer);
    await this.repository.deleteComment(commentId, viewer.id);
  }

  async reportComment(
    postId: string,
    commentId: string,
    reason: string,
    viewer: AuthenticatedPrincipal,
  ) {
    await this.repository.findPost(postId, viewer.churchId);
    const comment = await this.repository.findComment(
      commentId,
      postId,
      viewer.churchId,
    );
    if (comment.authorUserId === viewer.id) {
      throw new BadRequestException('You cannot report your own comment.');
    }
    await this.repository.reportComment({
      churchId: viewer.churchId,
      commentId,
      reporterUserId: viewer.id,
      reason: cleanBody(reason, 'A reason', 300),
    });
  }

  async setPinned(
    postId: string,
    pinned: boolean,
    viewer: AuthenticatedPrincipal,
  ) {
    await this.assertModerator(viewer);
    const post = await this.repository.findPost(postId, viewer.churchId);
    if (Boolean(post.pinnedAt) === pinned) return this.get(postId, viewer);
    await this.repository.setPinned({
      churchId: viewer.churchId,
      post,
      actorUserId: viewer.id,
      pinned,
    });
    return this.get(postId, viewer);
  }

  async setCommentsClosed(
    postId: string,
    closed: boolean,
    viewer: AuthenticatedPrincipal,
  ) {
    await this.assertModerator(viewer);
    const post = await this.repository.findPost(postId, viewer.churchId);
    if (Boolean(post.commentsClosedAt) === closed)
      return this.get(postId, viewer);
    await this.repository.setCommentsClosed({
      churchId: viewer.churchId,
      postId,
      actorUserId: viewer.id,
      closed,
    });
    return this.get(postId, viewer);
  }

  async listOpenReports(viewer: AuthenticatedPrincipal) {
    await this.assertModerator(viewer);
    return this.repository.listOpenReports(viewer.churchId);
  }

  async hideComment(
    commentId: string,
    reason: string,
    viewer: AuthenticatedPrincipal,
  ) {
    await this.assertModerator(viewer);
    await this.repository.findCommentForModeration(commentId, viewer.churchId);
    await this.repository.hideComment({
      churchId: viewer.churchId,
      commentId,
      actorUserId: viewer.id,
      reason: cleanBody(reason, 'A reason', 300),
    });
  }

  async dismissReports(commentId: string, viewer: AuthenticatedPrincipal) {
    await this.assertModerator(viewer);
    await this.repository.findCommentForModeration(commentId, viewer.churchId);
    await this.repository.dismissReports({
      churchId: viewer.churchId,
      commentId,
      actorUserId: viewer.id,
    });
  }

  /** A live post that still accepts comments. */
  private async openPost(postId: string, viewer: AuthenticatedPrincipal) {
    const post = await this.repository.findPost(postId, viewer.churchId);
    if (post.commentsClosedAt) {
      throw new ForbiddenException('Comments are closed on this post.');
    }
    return post;
  }

  private async ownComment(
    postId: string,
    commentId: string,
    viewer: AuthenticatedPrincipal,
  ) {
    const comment = await this.repository.findComment(
      commentId,
      postId,
      viewer.churchId,
    );
    if (comment.authorUserId !== viewer.id) {
      throw new ForbiddenException('You can only change your own comments.');
    }
    return comment;
  }

  private async assertModerator(viewer: AuthenticatedPrincipal) {
    const access = await this.access.resolve(viewer);
    if (!access.canModerate) {
      throw new ForbiddenException(
        'Only administrators and pastors can moderate the feed.',
      );
    }
  }

  private present(
    post: FeedPost,
    engagement: Engagement,
    viewer: AuthenticatedPrincipal,
    access: PublisherAccess,
  ) {
    const reactionCounts = Object.fromEntries(
      FEED_REACTIONS.map((reaction) => [
        reaction,
        engagement.reactions.find(
          (row) => row.postId === post.id && row.reaction === reaction,
        )?.total ?? 0,
      ]),
    ) as Record<FeedReaction, number>;
    return {
      ...post,
      isPinned: post.pinnedAt !== null,
      commentsClosed: post.commentsClosedAt !== null,
      reactionCounts,
      myReaction:
        engagement.mine.find((row) => row.postId === post.id)?.reaction ?? null,
      commentCount:
        engagement.comments.find((row) => row.postId === post.id)?.total ?? 0,
      canManage: this.access.canManage(post, viewer, access),
    };
  }
}
