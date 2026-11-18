import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNull,
  ne,
  sql,
} from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import {
  announcementCommentReports,
  announcementComments,
  announcementReactions,
  announcements,
  auditLogs,
  memberProfiles,
  users,
} from '../database/schema';
import { NotificationPublisher } from '../notifications/notification-publisher.service';
import type { FeedReaction } from './dto/feed.dto';

const authorName = sql<
  string | null
>`nullif(trim(concat_ws(' ', ${memberProfiles.firstName}, ${memberProfiles.lastName})), '')`;

/** Feed posts are live announcement-kind posts. */
const feedPostCondition = (churchId: string) =>
  and(
    eq(announcements.churchId, churchId),
    eq(announcements.kind, 'ANNOUNCEMENT'),
    isNull(announcements.archivedAt),
  );

/** Comments everyone can see: not deleted by the author or hidden. */
const visibleComment = and(
  isNull(announcementComments.deletedAt),
  isNull(announcementComments.hiddenAt),
);

/** Where notifications link; the web app routes it to the viewer's portal. */
export const feedPostLink = (postId: string) => `/feed/${postId}`;

@Injectable()
export class FeedRepository {
  constructor(
    @Inject(DATABASE) private readonly database: Database,
    private readonly publisher: NotificationPublisher,
  ) {}

  async listPosts(churchId: string, page: number, limit: number) {
    const where = feedPostCondition(churchId);
    const [items, [{ total }]] = await Promise.all([
      this.selectPosts()
        .where(where)
        .orderBy(
          sql`${announcements.pinnedAt} desc nulls last`,
          desc(announcements.createdAt),
        )
        .limit(limit)
        .offset((page - 1) * limit),
      this.database.select({ total: count() }).from(announcements).where(where),
    ]);
    return { items, total };
  }

  async findPost(postId: string, churchId: string) {
    const [post] = await this.selectPosts()
      .where(and(eq(announcements.id, postId), feedPostCondition(churchId)))
      .limit(1);
    if (!post) throw new NotFoundException('Post not found.');
    return post;
  }

  /** Reaction counts, the viewer's reaction, and visible comment counts. */
  async engagement(postIds: string[], userId: string) {
    if (postIds.length === 0) {
      return { reactions: [], mine: [], comments: [] };
    }
    const [reactions, mine, comments] = await Promise.all([
      this.database
        .select({
          postId: announcementReactions.announcementId,
          reaction: announcementReactions.reaction,
          total: count(),
        })
        .from(announcementReactions)
        .where(inArray(announcementReactions.announcementId, postIds))
        .groupBy(
          announcementReactions.announcementId,
          announcementReactions.reaction,
        ),
      this.database
        .select({
          postId: announcementReactions.announcementId,
          reaction: announcementReactions.reaction,
        })
        .from(announcementReactions)
        .where(
          and(
            inArray(announcementReactions.announcementId, postIds),
            eq(announcementReactions.userId, userId),
          ),
        ),
      this.database
        .select({
          postId: announcementComments.announcementId,
          total: count(),
        })
        .from(announcementComments)
        .where(
          and(
            inArray(announcementComments.announcementId, postIds),
            visibleComment,
          ),
        )
        .groupBy(announcementComments.announcementId),
    ]);
    return { reactions, mine, comments };
  }

  /** Idempotent: a retried or changed reaction leaves one row per member. */
  async upsertReaction(input: {
    churchId: string;
    postId: string;
    userId: string;
    reaction: FeedReaction;
  }) {
    await this.database
      .insert(announcementReactions)
      .values({
        churchId: input.churchId,
        announcementId: input.postId,
        userId: input.userId,
        reaction: input.reaction,
      })
      .onConflictDoUpdate({
        target: [
          announcementReactions.announcementId,
          announcementReactions.userId,
        ],
        set: { reaction: input.reaction, updatedAt: new Date() },
      });
  }

  async removeReaction(postId: string, userId: string) {
    await this.database
      .delete(announcementReactions)
      .where(
        and(
          eq(announcementReactions.announcementId, postId),
          eq(announcementReactions.userId, userId),
        ),
      );
  }

  /** Visible comments, oldest first, so a thread reads top to bottom. */
  async listComments(postId: string, page: number, limit: number) {
    const where = and(
      eq(announcementComments.announcementId, postId),
      visibleComment,
    );
    const [items, [{ total }]] = await Promise.all([
      this.database
        .select({
          id: announcementComments.id,
          body: announcementComments.body,
          authorUserId: announcementComments.authorUserId,
          authorName,
          authorPhotoUrl: memberProfiles.profilePhotoUrl,
          editedAt: announcementComments.editedAt,
          createdAt: announcementComments.createdAt,
        })
        .from(announcementComments)
        .leftJoin(
          memberProfiles,
          eq(memberProfiles.userId, announcementComments.authorUserId),
        )
        .where(where)
        .orderBy(asc(announcementComments.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      this.database
        .select({ total: count() })
        .from(announcementComments)
        .where(where),
    ]);
    return { items, total };
  }

  async findComment(commentId: string, postId: string, churchId: string) {
    const [comment] = await this.database
      .select({
        id: announcementComments.id,
        authorUserId: announcementComments.authorUserId,
        deletedAt: announcementComments.deletedAt,
        hiddenAt: announcementComments.hiddenAt,
      })
      .from(announcementComments)
      .where(
        and(
          eq(announcementComments.id, commentId),
          eq(announcementComments.announcementId, postId),
          eq(announcementComments.churchId, churchId),
        ),
      )
      .limit(1);
    if (!comment || comment.deletedAt || comment.hiddenAt) {
      throw new NotFoundException('Comment not found.');
    }
    return comment;
  }

  /**
   * Adds a comment and tells the post author. Notices are grouped: the
   * author gets at most one per post per hour, however many comments arrive.
   */
  async createComment(input: {
    churchId: string;
    post: { id: string; title: string; createdBy: string };
    authorUserId: string;
    body: string;
  }) {
    return this.database.transaction(async (transaction) => {
      const [comment] = await transaction
        .insert(announcementComments)
        .values({
          churchId: input.churchId,
          announcementId: input.post.id,
          authorUserId: input.authorUserId,
          body: input.body,
        })
        .returning({ id: announcementComments.id });
      if (input.post.createdBy !== input.authorUserId) {
        const hour = new Date().toISOString().slice(0, 13);
        await this.publisher.toUsers(
          transaction,
          [input.post.createdBy],
          {
            churchId: input.churchId,
            actorUserId: input.authorUserId,
            type: 'FEED_COMMENT',
            title: 'New comments on your post',
            body: `Members are commenting on "${input.post.title}".`,
            link: feedPostLink(input.post.id),
          },
          `feed-comments:${input.post.id}:${hour}`,
        );
      }
      return comment;
    });
  }

  async updateCommentBody(commentId: string, body: string) {
    const now = new Date();
    await this.database
      .update(announcementComments)
      .set({ body, editedAt: now, updatedAt: now })
      .where(eq(announcementComments.id, commentId));
  }

  async deleteComment(commentId: string, actorUserId: string) {
    const now = new Date();
    await this.database
      .update(announcementComments)
      .set({ deletedAt: now, deletedBy: actorUserId, updatedAt: now })
      .where(
        and(
          eq(announcementComments.id, commentId),
          isNull(announcementComments.deletedAt),
        ),
      );
  }

  /** One report per member per comment; repeats are ignored. */
  async reportComment(input: {
    churchId: string;
    commentId: string;
    reporterUserId: string;
    reason: string;
  }) {
    await this.database
      .insert(announcementCommentReports)
      .values({
        churchId: input.churchId,
        commentId: input.commentId,
        reporterUserId: input.reporterUserId,
        reason: input.reason,
      })
      .onConflictDoNothing();
  }

  /** Pins or unpins a notice. Pinning notifies the church once per post. */
  async setPinned(input: {
    churchId: string;
    post: { id: string; title: string };
    actorUserId: string;
    pinned: boolean;
  }) {
    await this.database.transaction(async (transaction) => {
      const now = new Date();
      await transaction
        .update(announcements)
        .set(
          input.pinned
            ? { pinnedAt: now, pinnedBy: input.actorUserId }
            : { pinnedAt: null, pinnedBy: null },
        )
        .where(eq(announcements.id, input.post.id));
      await transaction.insert(auditLogs).values({
        churchId: input.churchId,
        actorUserId: input.actorUserId,
        action: input.pinned ? 'FEED_POST_PINNED' : 'FEED_POST_UNPINNED',
        entityType: 'ANNOUNCEMENT',
        entityId: input.post.id,
      });
      if (input.pinned) {
        const members = await transaction
          .select({ id: users.id })
          .from(users)
          .where(
            and(
              eq(users.churchId, input.churchId),
              eq(users.accountStatus, 'ACTIVE'),
              ne(users.id, input.actorUserId),
            ),
          );
        await this.publisher.toUsers(
          transaction,
          members.map((member) => member.id),
          {
            churchId: input.churchId,
            actorUserId: input.actorUserId,
            type: 'FEED_PINNED_NOTICE',
            title: 'Important church notice',
            body: input.post.title,
            link: feedPostLink(input.post.id),
          },
          `feed-pin:${input.post.id}`,
        );
      }
    });
  }

  async setCommentsClosed(input: {
    churchId: string;
    postId: string;
    actorUserId: string;
    closed: boolean;
  }) {
    await this.database.transaction(async (transaction) => {
      await transaction
        .update(announcements)
        .set(
          input.closed
            ? {
                commentsClosedAt: new Date(),
                commentsClosedBy: input.actorUserId,
              }
            : { commentsClosedAt: null, commentsClosedBy: null },
        )
        .where(eq(announcements.id, input.postId));
      await transaction.insert(auditLogs).values({
        churchId: input.churchId,
        actorUserId: input.actorUserId,
        action: input.closed ? 'FEED_COMMENTS_CLOSED' : 'FEED_COMMENTS_OPENED',
        entityType: 'ANNOUNCEMENT',
        entityId: input.postId,
      });
    });
  }

  /** Comments with open reports, most reported first. */
  async listOpenReports(churchId: string) {
    return this.database
      .select({
        commentId: announcementComments.id,
        body: announcementComments.body,
        authorName,
        postId: announcements.id,
        postTitle: announcements.title,
        reportCount: count(announcementCommentReports.id),
        reasons: sql<
          string[]
        >`array_agg(${announcementCommentReports.reason} order by ${announcementCommentReports.createdAt})`,
        firstReportedAt: sql<Date>`min(${announcementCommentReports.createdAt})`,
      })
      .from(announcementCommentReports)
      .innerJoin(
        announcementComments,
        eq(announcementComments.id, announcementCommentReports.commentId),
      )
      .innerJoin(
        announcements,
        eq(announcements.id, announcementComments.announcementId),
      )
      .leftJoin(
        memberProfiles,
        eq(memberProfiles.userId, announcementComments.authorUserId),
      )
      .where(
        and(
          eq(announcementCommentReports.churchId, churchId),
          eq(announcementCommentReports.status, 'OPEN'),
          visibleComment,
        ),
      )
      .groupBy(
        announcementComments.id,
        announcements.id,
        memberProfiles.firstName,
        memberProfiles.lastName,
      )
      .orderBy(
        desc(count(announcementCommentReports.id)),
        sql`min(${announcementCommentReports.createdAt})`,
      );
  }

  /** Finds a visible comment anywhere in the church, for moderation. */
  async findCommentForModeration(commentId: string, churchId: string) {
    const [comment] = await this.database
      .select({ id: announcementComments.id })
      .from(announcementComments)
      .where(
        and(
          eq(announcementComments.id, commentId),
          eq(announcementComments.churchId, churchId),
          visibleComment,
        ),
      )
      .limit(1);
    if (!comment) throw new NotFoundException('Comment not found.');
    return comment;
  }

  /** Hides a comment and closes its open reports, with an audit entry. */
  async hideComment(input: {
    churchId: string;
    commentId: string;
    actorUserId: string;
    reason: string;
  }) {
    await this.database.transaction(async (transaction) => {
      const now = new Date();
      await transaction
        .update(announcementComments)
        .set({
          hiddenAt: now,
          hiddenBy: input.actorUserId,
          hiddenReason: input.reason,
          updatedAt: now,
        })
        .where(eq(announcementComments.id, input.commentId));
      await this.resolveReports(transaction, input, 'HIDDEN', now);
      await transaction.insert(auditLogs).values({
        churchId: input.churchId,
        actorUserId: input.actorUserId,
        action: 'FEED_COMMENT_HIDDEN',
        entityType: 'ANNOUNCEMENT_COMMENT',
        entityId: input.commentId,
        metadata: { reason: input.reason },
      });
    });
  }

  /** Keeps a reported comment visible and closes its open reports. */
  async dismissReports(input: {
    churchId: string;
    commentId: string;
    actorUserId: string;
  }) {
    await this.database.transaction(async (transaction) => {
      await this.resolveReports(transaction, input, 'DISMISSED', new Date());
      await transaction.insert(auditLogs).values({
        churchId: input.churchId,
        actorUserId: input.actorUserId,
        action: 'FEED_COMMENT_REPORTS_DISMISSED',
        entityType: 'ANNOUNCEMENT_COMMENT',
        entityId: input.commentId,
      });
    });
  }

  private async resolveReports(
    transaction: Parameters<Parameters<Database['transaction']>[0]>[0],
    input: { churchId: string; commentId: string; actorUserId: string },
    status: 'HIDDEN' | 'DISMISSED',
    now: Date,
  ) {
    await transaction
      .update(announcementCommentReports)
      .set({ status, resolvedBy: input.actorUserId, resolvedAt: now })
      .where(
        and(
          eq(announcementCommentReports.commentId, input.commentId),
          eq(announcementCommentReports.churchId, input.churchId),
          eq(announcementCommentReports.status, 'OPEN'),
        ),
      );
  }

  private selectPosts() {
    return this.database
      .select({
        id: announcements.id,
        title: announcements.title,
        theme: announcements.theme,
        description: announcements.description,
        locationName: announcements.locationName,
        startsAt: announcements.startsAt,
        endsAt: announcements.endsAt,
        flyerUrl: announcements.flyerUrl,
        createdBy: announcements.createdBy,
        authorName,
        authorPhotoUrl: memberProfiles.profilePhotoUrl,
        pinnedAt: announcements.pinnedAt,
        commentsClosedAt: announcements.commentsClosedAt,
        createdAt: announcements.createdAt,
        updatedAt: announcements.updatedAt,
      })
      .from(announcements)
      .leftJoin(
        memberProfiles,
        eq(memberProfiles.userId, announcements.createdBy),
      );
  }
}
