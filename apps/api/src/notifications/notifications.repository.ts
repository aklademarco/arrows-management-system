import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import { notifications } from '../database/schema';
import type { ListNotificationsDto } from './dto/list-notifications.dto';

@Injectable()
export class NotificationsRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async list(userId: string, churchId: string, query: ListNotificationsDto) {
    const filters = [
      eq(notifications.recipientUserId, userId),
      eq(notifications.churchId, churchId),
    ];
    if (query.unreadOnly) filters.push(isNull(notifications.readAt));
    const where = and(...filters);
    const [items, [{ total }]] = await Promise.all([
      this.database
        .select({
          id: notifications.id,
          type: notifications.type,
          title: notifications.title,
          body: notifications.body,
          link: notifications.link,
          readAt: notifications.readAt,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .where(where)
        .orderBy(desc(notifications.createdAt))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      this.database.select({ total: count() }).from(notifications).where(where),
    ]);
    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async unreadCount(userId: string, churchId: string) {
    const [result] = await this.database
      .select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientUserId, userId),
          eq(notifications.churchId, churchId),
          isNull(notifications.readAt),
        ),
      );
    return result.count;
  }

  async markRead(notificationId: string, userId: string, churchId: string) {
    const [updated] = await this.database
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.recipientUserId, userId),
          eq(notifications.churchId, churchId),
          isNull(notifications.readAt),
        ),
      )
      .returning({ id: notifications.id, readAt: notifications.readAt });
    if (updated) return updated;
    const [existing] = await this.database
      .select({ id: notifications.id, readAt: notifications.readAt })
      .from(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.recipientUserId, userId),
          eq(notifications.churchId, churchId),
        ),
      )
      .limit(1);
    return existing ?? null;
  }

  async markAllRead(userId: string, churchId: string) {
    const result = await this.database
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.recipientUserId, userId),
          eq(notifications.churchId, churchId),
          isNull(notifications.readAt),
        ),
      )
      .returning({ id: notifications.id });
    return result.length;
  }
}
