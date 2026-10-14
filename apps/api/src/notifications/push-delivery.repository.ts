import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull, lte, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { DATABASE, type Database } from '../database/database.module';
import {
  events,
  notifications,
  pushDeliveries,
  pushDevices,
  users,
} from '../database/schema';

@Injectable()
export class PushDeliveryRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async enqueue(now = new Date()) {
    return this.database.transaction(async (tx) => {
      const pending = await tx
        .select()
        .from(notifications)
        .where(isNull(notifications.pushEnqueuedAt))
        .orderBy(notifications.createdAt)
        .limit(100)
        .for('update', { skipLocked: true });
      for (const notice of pending) {
        const devices = await tx
          .select({
            id: pushDevices.id,
            generation: pushDevices.generation,
            approvalOnly: pushDevices.approvalOnly,
          })
          .from(pushDevices)
          .innerJoin(users, eq(users.id, pushDevices.userId))
          .where(
            and(
              eq(pushDevices.userId, notice.recipientUserId),
              eq(pushDevices.churchId, notice.churchId),
              eq(users.churchId, notice.churchId),
              eq(users.accountStatus, 'ACTIVE'),
              isNull(pushDevices.revokedAt),
              gt(pushDevices.expiresAt, now),
              lte(pushDevices.subscribedAt, notice.createdAt),
            ),
          );
        const eligible = devices.filter(
          (device) =>
            !device.approvalOnly || notice.type === 'ACCOUNT_APPROVED',
        );
        if (
          eligible.length &&
          (!notice.expiresAt || notice.expiresAt > now) &&
          notice.createdAt.getTime() > now.getTime() - 86400000
        ) {
          await tx
            .insert(pushDeliveries)
            .values(
              eligible.map((device) => ({
                notificationId: notice.id,
                deviceId: device.id,
                deviceGeneration: device.generation,
              })),
            )
            .onConflictDoNothing();
        }
        await tx
          .update(notifications)
          .set({ pushEnqueuedAt: now })
          .where(eq(notifications.id, notice.id));
      }
      return pending.length;
    });
  }

  async claimNext(now = new Date()) {
    const leaseId = randomUUID();
    const result = await this.database.execute<{ id: string }>(sql`
      WITH candidate AS (
        SELECT id FROM push_deliveries
        WHERE status = 'QUEUED' AND next_attempt_at <= ${now}
          AND (lease_until IS NULL OR lease_until < ${now})
        ORDER BY next_attempt_at, created_at FOR UPDATE SKIP LOCKED LIMIT 1
      )
      UPDATE push_deliveries AS d
      SET lease_id = ${leaseId}, lease_until = ${new Date(now.getTime() + 60000)}, attempts = attempts + 1
      FROM candidate WHERE d.id = candidate.id RETURNING d.id
    `);
    return result.rows[0] ? { id: result.rows[0].id, leaseId } : null;
  }

  async load(id: string, leaseId: string) {
    const rows = await this.database
      .select({
        delivery: pushDeliveries,
        notice: notifications,
        device: pushDevices,
        accountStatus: users.accountStatus,
        accountChurchId: users.churchId,
        eventStatus: events.status,
        currentEventStart: events.startsAt,
      })
      .from(pushDeliveries)
      .innerJoin(
        notifications,
        eq(notifications.id, pushDeliveries.notificationId),
      )
      .innerJoin(pushDevices, eq(pushDevices.id, pushDeliveries.deviceId))
      .innerJoin(users, eq(users.id, notifications.recipientUserId))
      .leftJoin(events, eq(events.id, notifications.eventId))
      .where(
        and(
          eq(pushDeliveries.id, id),
          eq(pushDeliveries.leaseId, leaseId),
          eq(pushDeliveries.status, 'QUEUED'),
        ),
      );
    return rows.length ? rows[0] : null;
  }

  async finish(
    id: string,
    leaseId: string,
    status: 'SENT' | 'FAILED' | 'SKIPPED' | 'QUEUED',
    code?: string,
    nextAttemptAt?: Date,
    invalidDevice?: { id: string; generation: string },
  ) {
    await this.database.transaction(async (tx) => {
      const updated = await tx
        .update(pushDeliveries)
        .set({
          status,
          errorCode: code ?? null,
          leaseId: null,
          leaseUntil: null,
          sentAt: status === 'SENT' ? new Date() : null,
          ...(nextAttemptAt ? { nextAttemptAt } : {}),
        })
        .where(
          and(eq(pushDeliveries.id, id), eq(pushDeliveries.leaseId, leaseId)),
        )
        .returning({ id: pushDeliveries.id });
      if (updated.length && invalidDevice) {
        await tx
          .update(pushDevices)
          .set({ revokedAt: new Date() })
          .where(
            and(
              eq(pushDevices.id, invalidDevice.id),
              eq(pushDevices.generation, invalidDevice.generation),
            ),
          );
      }
    });
  }
}
