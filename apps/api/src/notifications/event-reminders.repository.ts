import { Inject, Injectable } from '@nestjs/common';
import { and, gt, inArray, lte, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import { eventReminderRuns, events } from '../database/schema';
import { NotificationPublisher } from './notification-publisher.service';

@Injectable()
export class EventRemindersRepository {
  constructor(
    @Inject(DATABASE) private readonly database: Database,
    private readonly publisher: NotificationPublisher,
  ) {}
  async queueDue(now = new Date()) {
    return this.database.transaction(async (tx) => {
      const due = await tx
        .select()
        .from(events)
        .where(
          and(
            inArray(events.status, ['SCHEDULED', 'ACTIVE']),
            gt(events.startsAt, now),
            lte(events.startsAt, new Date(now.getTime() + 24 * 3600000)),
            sql`NOT EXISTS (SELECT 1 FROM event_reminder_runs r WHERE r.event_id = ${events.id}
          AND r.starts_at = ${events.startsAt}
          AND r.hours_before = CASE WHEN ${events.startsAt} <= ${new Date(now.getTime() + 3600000)} THEN 1 ELSE 24 END)`,
          ),
        )
        .orderBy(events.startsAt)
        .limit(100)
        .for('update', { skipLocked: true });
      for (const event of due) {
        const hours =
          event.startsAt.getTime() - now.getTime() <= 3600000 ? 1 : 24;
        const inserted = await tx
          .insert(eventReminderRuns)
          .values({
            eventId: event.id,
            startsAt: event.startsAt,
            hoursBefore: hours,
          })
          .onConflictDoNothing()
          .returning({ id: eventReminderRuns.id });
        if (inserted.length)
          await this.publisher.event(tx, event, 'EVENT_REMINDER', hours);
      }
      return due.length;
    });
  }
}
