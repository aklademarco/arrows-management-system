import { Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import type { Database } from '../database/database.module';
import {
  memberProfiles,
  notifications,
  users,
  events,
} from '../database/schema';
import { eligibleMemberCondition } from '../events/event-eligibility';

export type NotificationTransaction = Parameters<
  Parameters<Database['transaction']>[0]
>[0];
type Notice = Pick<
  typeof notifications.$inferInsert,
  'churchId' | 'type' | 'title' | 'body'
> &
  Partial<
    Pick<
      typeof notifications.$inferInsert,
      'actorUserId' | 'link' | 'eventId' | 'eventStartsAt' | 'expiresAt'
    >
  >;

/** All writes use the caller's business transaction; rollback also removes the notice. */
@Injectable()
export class NotificationPublisher {
  async toUsers(
    tx: NotificationTransaction,
    userIds: string[],
    notice: Notice,
    key?: string,
  ) {
    if (!userIds.length) return;
    const recipients = await tx
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.churchId, notice.churchId),
          eq(users.accountStatus, 'ACTIVE'),
          inArray(users.id, [...new Set(userIds)]),
        ),
      );
    // Bound statement parameters for large church audiences.
    for (let offset = 0; offset < recipients.length; offset += 500) {
      await tx
        .insert(notifications)
        .values(
          recipients.slice(offset, offset + 500).map(({ id }) => ({
            ...notice,
            title: notice.title.slice(0, 180),
            recipientUserId: id,
            link: notice.link ?? '/member/notifications',
            deduplicationKey: key ? `${key}:${id}` : undefined,
          })),
        )
        .onConflictDoNothing();
    }
  }

  async toMember(
    tx: NotificationTransaction,
    memberId: string,
    notice: Notice,
  ) {
    const [member] = await tx
      .select({ userId: memberProfiles.userId })
      .from(memberProfiles)
      .innerJoin(users, eq(users.id, memberProfiles.userId))
      .where(
        and(
          eq(memberProfiles.id, memberId),
          eq(users.churchId, notice.churchId),
        ),
      );
    if (member) await this.toUsers(tx, [member.userId], notice);
  }

  async event(
    tx: NotificationTransaction,
    event: typeof events.$inferSelect,
    type:
      'EVENT_CREATED' | 'EVENT_UPDATED' | 'EVENT_CANCELLED' | 'EVENT_REMINDER',
    reminderHours?: number,
    actorUserId?: string,
  ) {
    if (event.startsAt <= new Date() && type !== 'EVENT_CANCELLED') return;
    const members = await tx
      .select({ userId: memberProfiles.userId })
      .from(memberProfiles)
      .innerJoin(users, eq(users.id, memberProfiles.userId))
      .where(
        and(
          eq(users.churchId, event.churchId),
          eq(users.accountStatus, 'ACTIVE'),
          eq(memberProfiles.membershipStatus, 'ACTIVE'),
          eligibleMemberCondition(
            event.id,
            event.startsAt.toISOString().slice(0, 10),
          ),
        ),
      );
    const titles = {
      EVENT_CREATED: 'New church event',
      EVENT_UPDATED: 'Event details changed',
      EVENT_CANCELLED: 'Event cancelled',
      EVENT_REMINDER: 'Upcoming event reminder',
    };
    const date = new Intl.DateTimeFormat('en-GH', {
      timeZone: 'Africa/Accra',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(event.startsAt);
    await this.toUsers(
      tx,
      members.map((member) => member.userId),
      {
        churchId: event.churchId,
        actorUserId:
          type === 'EVENT_REMINDER' ? null : (actorUserId ?? event.createdBy),
        type,
        title:
          type === 'EVENT_REMINDER'
            ? `Event reminder: ${reminderHours} ${reminderHours === 1 ? 'hour' : 'hours'}`
            : titles[type],
        body:
          type === 'EVENT_CANCELLED'
            ? `${event.name} has been cancelled.`
            : `${event.name} is scheduled for ${date}${event.locationName ? ` at ${event.locationName}` : ''}.${type === 'EVENT_UPDATED' ? ' Please review the updated details.' : ''}`,
        eventId: event.id,
        eventStartsAt: event.startsAt,
        expiresAt:
          type === 'EVENT_CANCELLED'
            ? new Date(Date.now() + 86400000)
            : event.startsAt,
      },
      type === 'EVENT_REMINDER'
        ? `reminder:${event.id}:${event.startsAt.toISOString()}:${reminderHours}`
        : undefined,
    );
  }
}
