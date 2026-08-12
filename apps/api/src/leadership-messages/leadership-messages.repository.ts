import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, gt, inArray, isNull, lt, lte, or, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import {
  auditLogs,
  departmentLeaders,
  departmentMembers,
  departments,
  leadershipMessageDepartments,
  leadershipMessageRecipients,
  leadershipMessages,
  memberProfiles,
  notifications,
  users,
} from '../database/schema';

@Injectable()
export class LeadershipMessagesRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async activeLedDepartments(userId: string, churchId: string) {
    const today = new Date().toISOString().slice(0, 10);
    return this.database.selectDistinct({ id: departments.id, name: departments.name })
      .from(departmentLeaders)
      .innerJoin(memberProfiles, eq(memberProfiles.id, departmentLeaders.memberId))
      .innerJoin(departments, eq(departments.id, departmentLeaders.departmentId))
      .where(and(
        eq(memberProfiles.userId, userId),
        eq(departments.churchId, churchId),
        eq(departments.isActive, true),
        isNull(departmentLeaders.revokedAt),
        lte(departmentLeaders.startsAt, today),
        or(isNull(departmentLeaders.endsAt), sql`${departmentLeaders.endsAt} >= ${today}`),
      ));
  }

  async sent(userId: string, churchId: string) {
    return this.database.select({
      id: leadershipMessages.id,
      audience: leadershipMessages.audience,
      title: leadershipMessages.title,
      body: leadershipMessages.body,
      sentAt: leadershipMessages.sentAt,
      smsRequested: leadershipMessages.smsRequested,
      recipientCount: count(leadershipMessageRecipients.id),
      smsQueuedCount: sql<number>`count(*) filter (where ${leadershipMessageRecipients.smsStatus} = 'QUEUED')::int`,
      smsSentCount: sql<number>`count(*) filter (where ${leadershipMessageRecipients.smsStatus} in ('SENT', 'DELIVERED'))::int`,
      smsDeliveredCount: sql<number>`count(*) filter (where ${leadershipMessageRecipients.smsStatus} = 'DELIVERED')::int`,
      smsFailedCount: sql<number>`count(*) filter (where ${leadershipMessageRecipients.smsStatus} = 'FAILED')::int`,
    }).from(leadershipMessages)
      .leftJoin(leadershipMessageRecipients, eq(leadershipMessageRecipients.messageId, leadershipMessages.id))
      .where(and(eq(leadershipMessages.senderUserId, userId), eq(leadershipMessages.churchId, churchId)))
      .groupBy(leadershipMessages.id)
      .orderBy(desc(leadershipMessages.sentAt))
      .limit(50);
  }

  async create(input: {
    churchId: string;
    senderUserId: string;
    audience: 'CHURCH' | 'DEPARTMENT';
    title: string;
    body: string;
    departmentIds: string[];
    smsRequested: boolean;
  }) {
    const today = new Date().toISOString().slice(0, 10);
    return this.database.transaction(async (transaction) => {
      const [message] = await transaction.insert(leadershipMessages).values({
        churchId: input.churchId,
        senderUserId: input.senderUserId,
        audience: input.audience,
        title: input.title,
        body: input.body,
        smsRequested: input.smsRequested,
      }).returning();
      if (input.departmentIds.length)
        await transaction.insert(leadershipMessageDepartments).values(
          input.departmentIds.map((departmentId) => ({ messageId: message.id, departmentId })),
        );
      const baseRecipients = transaction.selectDistinct({
        userId: users.id,
        phone: users.phone,
      }).from(memberProfiles).innerJoin(users, eq(users.id, memberProfiles.userId));
      const recipients = input.audience === 'CHURCH'
        ? await baseRecipients.where(and(eq(users.churchId, input.churchId), eq(users.accountStatus, 'ACTIVE')))
        : await baseRecipients
          .innerJoin(departmentMembers, eq(departmentMembers.memberId, memberProfiles.id))
          .where(and(
            eq(users.churchId, input.churchId),
            eq(users.accountStatus, 'ACTIVE'),
            inArray(departmentMembers.departmentId, input.departmentIds),
            lte(departmentMembers.joinedAt, today),
            or(isNull(departmentMembers.leftAt), gt(departmentMembers.leftAt, today)),
          ));
      if (recipients.length) {
        await transaction.insert(leadershipMessageRecipients).values(recipients.map((recipient) => ({
          messageId: message.id,
          recipientUserId: recipient.userId,
          phoneSnapshot: recipient.phone,
          smsStatus: input.smsRequested && recipient.phone ? 'QUEUED' : 'NOT_REQUESTED',
          smsNextAttemptAt: input.smsRequested && recipient.phone ? new Date() : undefined,
        })));
        await transaction.insert(notifications).values(recipients.map((recipient) => ({
          churchId: input.churchId,
          recipientUserId: recipient.userId,
          actorUserId: input.senderUserId,
          type: 'LEADERSHIP_MESSAGE',
          title: input.title,
          body: input.body,
          link: '/member/notifications',
        })));
      }
      await transaction.insert(auditLogs).values({
        churchId: input.churchId,
        actorUserId: input.senderUserId,
        action: 'LEADERSHIP_MESSAGE_SENT',
        entityType: 'LEADERSHIP_MESSAGE',
        entityId: message.id,
        newData: { audience: input.audience, title: input.title, departmentIds: input.departmentIds },
        metadata: { recipientCount: recipients.length },
      });
      return {
        ...message,
        recipientCount: recipients.length,
        smsQueuedCount: input.smsRequested
          ? recipients.filter((recipient) => recipient.phone).length
          : 0,
      };
    });
  }

  async claimSmsBatch(limit = 25) {
    const now = new Date();
    const leaseExpiredAt = new Date(now.getTime() - 5 * 60_000);
    const candidates = await this.database.select({
      id: leadershipMessageRecipients.id,
      phone: leadershipMessageRecipients.phoneSnapshot,
      retryCount: leadershipMessageRecipients.smsRetryCount,
      title: leadershipMessages.title,
      message: leadershipMessages.body,
    }).from(leadershipMessageRecipients)
      .innerJoin(leadershipMessages, eq(leadershipMessages.id, leadershipMessageRecipients.messageId))
      .where(and(
        eq(leadershipMessageRecipients.smsStatus, 'QUEUED'),
        lte(leadershipMessageRecipients.smsNextAttemptAt, now),
        or(isNull(leadershipMessageRecipients.smsAttemptedAt), lt(leadershipMessageRecipients.smsAttemptedAt, leaseExpiredAt)),
      ))
      .orderBy(leadershipMessageRecipients.createdAt)
      .limit(limit);
    const claimed = [];
    for (const candidate of candidates) {
      const [row] = await this.database.update(leadershipMessageRecipients)
        .set({ smsAttemptedAt: now })
        .where(and(
          eq(leadershipMessageRecipients.id, candidate.id),
          eq(leadershipMessageRecipients.smsStatus, 'QUEUED'),
          or(isNull(leadershipMessageRecipients.smsAttemptedAt), lt(leadershipMessageRecipients.smsAttemptedAt, leaseExpiredAt)),
        ))
        .returning({ id: leadershipMessageRecipients.id });
      if (row) claimed.push(candidate);
    }
    return claimed;
  }

  async markSmsSent(id: string, providerId: string) {
    await this.database.update(leadershipMessageRecipients).set({
      smsStatus: 'SENT',
      smsProviderId: providerId,
      smsFailureReason: null,
      smsNextAttemptAt: null,
    }).where(eq(leadershipMessageRecipients.id, id));
  }

  async markSmsFailed(id: string, retryCount: number, reason: string, retryable: boolean) {
    const shouldRetry = retryable && retryCount < 3;
    await this.database.update(leadershipMessageRecipients).set({
      smsStatus: shouldRetry ? 'QUEUED' : 'FAILED',
      smsRetryCount: retryCount,
      smsFailureReason: reason.slice(0, 2_000),
      smsNextAttemptAt: shouldRetry ? new Date(Date.now() + 2 ** retryCount * 60_000) : null,
    }).where(eq(leadershipMessageRecipients.id, id));
  }

  async sentSmsAwaitingDelivery(limit = 50) {
    return this.database.select({
      id: leadershipMessageRecipients.id,
      providerId: leadershipMessageRecipients.smsProviderId,
    }).from(leadershipMessageRecipients)
      .where(and(
        eq(leadershipMessageRecipients.smsStatus, 'SENT'),
        sql`${leadershipMessageRecipients.smsProviderId} is not null`,
      ))
      .orderBy(leadershipMessageRecipients.smsAttemptedAt)
      .limit(limit);
  }

  async markSmsDelivered(id: string) {
    await this.database.update(leadershipMessageRecipients).set({
      smsStatus: 'DELIVERED',
      smsDeliveredAt: new Date(),
      smsFailureReason: null,
    }).where(eq(leadershipMessageRecipients.id, id));
  }
}
