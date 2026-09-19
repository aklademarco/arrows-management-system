import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  eq,
  gt,
  isNotNull,
  isNull,
  lt,
  lte,
  or,
  sql,
} from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import {
  attendanceRecords,
  attendanceReportDeliveries,
  auditLogs,
  churches,
  departmentLeaders,
  departmentMembers,
  departments,
  events,
  memberProfiles,
  roles,
  userRoles,
  users,
} from '../database/schema';

@Injectable()
export class AttendanceReportDeliveryRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async queueFinalizedEvents(limit = 20) {
    return this.database.transaction(async (transaction) => {
      const finalizedEvents = await transaction
        .select({
          id: events.id,
          churchId: events.churchId,
          startsAt: events.startsAt,
        })
        .from(events)
        .where(
          and(
            isNotNull(events.attendanceFinalizedAt),
            isNull(events.attendanceReportsQueuedAt),
          ),
        )
        .orderBy(asc(events.attendanceFinalizedAt))
        .limit(limit)
        .for('update', { skipLocked: true });

      let deliveryCount = 0;
      for (const event of finalizedEvents) {
        const serviceDate = event.startsAt.toISOString().slice(0, 10);
        const pastors = await transaction
          .selectDistinct({
            userId: users.id,
            email: users.email,
            firstName: memberProfiles.firstName,
            lastName: memberProfiles.lastName,
          })
          .from(users)
          .innerJoin(userRoles, eq(userRoles.userId, users.id))
          .innerJoin(roles, eq(roles.id, userRoles.roleId))
          .leftJoin(memberProfiles, eq(memberProfiles.userId, users.id))
          .where(
            and(
              eq(users.churchId, event.churchId),
              eq(users.accountStatus, 'ACTIVE'),
              eq(roles.name, 'PASTOR'),
            ),
          );
        const pastorIds = new Set(pastors.map((pastor) => pastor.userId));
        const leaders = await transaction
          .selectDistinct({
            userId: users.id,
            email: users.email,
            firstName: memberProfiles.firstName,
            lastName: memberProfiles.lastName,
            departmentId: departments.id,
          })
          .from(departmentLeaders)
          .innerJoin(
            memberProfiles,
            eq(memberProfiles.id, departmentLeaders.memberId),
          )
          .innerJoin(users, eq(users.id, memberProfiles.userId))
          .innerJoin(
            departments,
            eq(departments.id, departmentLeaders.departmentId),
          )
          .innerJoin(
            departmentMembers,
            and(
              eq(departmentMembers.memberId, memberProfiles.id),
              eq(departmentMembers.departmentId, departments.id),
            ),
          )
          .innerJoin(userRoles, eq(userRoles.userId, users.id))
          .innerJoin(roles, eq(roles.id, userRoles.roleId))
          .where(
            and(
              eq(users.churchId, event.churchId),
              eq(users.accountStatus, 'ACTIVE'),
              eq(departments.isActive, true),
              eq(roles.name, 'DEPARTMENT_LEADER'),
              isNull(departmentLeaders.revokedAt),
              lte(departmentLeaders.startsAt, serviceDate),
              or(
                isNull(departmentLeaders.endsAt),
                sql`${departmentLeaders.endsAt} >= ${serviceDate}`,
              ),
              lte(departmentMembers.joinedAt, serviceDate),
              or(
                isNull(departmentMembers.leftAt),
                gt(departmentMembers.leftAt, serviceDate),
              ),
            ),
          );

        const deliveries = [
          ...pastors.map((pastor) => ({
            eventId: event.id,
            recipientUserId: pastor.userId,
            departmentId: null,
            scopeKey: 'CHURCH',
            recipientEmail: pastor.email,
            recipientName:
              [pastor.firstName, pastor.lastName].filter(Boolean).join(' ') ||
              pastor.email,
          })),
          ...leaders
            .filter((leader) => !pastorIds.has(leader.userId))
            .map((leader) => ({
              eventId: event.id,
              recipientUserId: leader.userId,
              departmentId: leader.departmentId,
              scopeKey: `DEPARTMENT:${leader.departmentId}`,
              recipientEmail: leader.email,
              recipientName:
                [leader.firstName, leader.lastName].filter(Boolean).join(' ') ||
                leader.email,
            })),
        ];
        if (deliveries.length) {
          const inserted = await transaction
            .insert(attendanceReportDeliveries)
            .values(deliveries)
            .onConflictDoNothing()
            .returning({ id: attendanceReportDeliveries.id });
          deliveryCount += inserted.length;
        }
        await transaction
          .update(events)
          .set({ attendanceReportsQueuedAt: new Date() })
          .where(eq(events.id, event.id));
      }
      return { eventCount: finalizedEvents.length, deliveryCount };
    });
  }

  async claimBatch(limit = 10) {
    const now = new Date();
    const leaseExpiredAt = new Date(now.getTime() - 5 * 60_000);
    const candidates = await this.database
      .select({
        id: attendanceReportDeliveries.id,
        retryCount: attendanceReportDeliveries.retryCount,
      })
      .from(attendanceReportDeliveries)
      .where(
        and(
          eq(attendanceReportDeliveries.status, 'QUEUED'),
          lte(attendanceReportDeliveries.nextAttemptAt, now),
          or(
            isNull(attendanceReportDeliveries.attemptedAt),
            lt(attendanceReportDeliveries.attemptedAt, leaseExpiredAt),
          ),
        ),
      )
      .orderBy(asc(attendanceReportDeliveries.createdAt))
      .limit(limit);
    const claimed: typeof candidates = [];
    for (const candidate of candidates) {
      const [row] = await this.database
        .update(attendanceReportDeliveries)
        .set({ attemptedAt: now, updatedAt: now })
        .where(
          and(
            eq(attendanceReportDeliveries.id, candidate.id),
            eq(attendanceReportDeliveries.status, 'QUEUED'),
            or(
              isNull(attendanceReportDeliveries.attemptedAt),
              lt(attendanceReportDeliveries.attemptedAt, leaseExpiredAt),
            ),
          ),
        )
        .returning({ id: attendanceReportDeliveries.id });
      if (row) claimed.push(candidate);
    }
    return claimed;
  }

  async reportData(deliveryId: string) {
    const [delivery] = await this.database
      .select({
        id: attendanceReportDeliveries.id,
        eventId: events.id,
        churchId: events.churchId,
        churchName: churches.name,
        timezone: churches.timezone,
        eventName: events.name,
        startsAt: events.startsAt,
        endsAt: events.endsAt,
        recipientEmail: attendanceReportDeliveries.recipientEmail,
        recipientName: attendanceReportDeliveries.recipientName,
        departmentId: attendanceReportDeliveries.departmentId,
        departmentName: departments.name,
      })
      .from(attendanceReportDeliveries)
      .innerJoin(events, eq(events.id, attendanceReportDeliveries.eventId))
      .innerJoin(churches, eq(churches.id, events.churchId))
      .leftJoin(
        departments,
        eq(departments.id, attendanceReportDeliveries.departmentId),
      )
      .where(eq(attendanceReportDeliveries.id, deliveryId))
      .limit(1);
    if (!delivery) return null;

    const filters = [eq(attendanceRecords.eventId, delivery.eventId)];
    if (delivery.departmentId) {
      filters.push(
        sql`exists (select 1 from ${departmentMembers} dm where dm.member_id = ${memberProfiles.id} and dm.department_id = ${delivery.departmentId} and dm.joined_at <= (${events.startsAt} at time zone ${delivery.timezone})::date and (dm.left_at is null or dm.left_at > (${events.startsAt} at time zone ${delivery.timezone})::date))`,
      );
    }
    const records = await this.database
      .select({
        memberId: memberProfiles.id,
        firstName: memberProfiles.firstName,
        lastName: memberProfiles.lastName,
        status: attendanceRecords.status,
        punctualityStatus: attendanceRecords.punctualityStatus,
        checkedInAt: attendanceRecords.checkedInAt,
      })
      .from(attendanceRecords)
      .innerJoin(events, eq(events.id, attendanceRecords.eventId))
      .innerJoin(
        memberProfiles,
        eq(memberProfiles.id, attendanceRecords.memberId),
      )
      .where(and(...filters))
      .orderBy(asc(memberProfiles.lastName), asc(memberProfiles.firstName));
    return { ...delivery, records };
  }

  async markSent(id: string, churchId: string, eventId: string) {
    await this.database.transaction(async (transaction) => {
      const now = new Date();
      await transaction
        .update(attendanceReportDeliveries)
        .set({
          status: 'SENT',
          sentAt: now,
          failureReason: null,
          updatedAt: now,
        })
        .where(eq(attendanceReportDeliveries.id, id));
      await transaction.insert(auditLogs).values({
        churchId,
        action: 'ATTENDANCE_REPORT_EMAILED',
        entityType: 'EVENT',
        entityId: eventId,
        metadata: { deliveryId: id },
      });
    });
  }

  async markFailed(id: string, retryCount: number, reason: string) {
    const shouldRetry = retryCount < 3;
    await this.database
      .update(attendanceReportDeliveries)
      .set({
        status: shouldRetry ? 'QUEUED' : 'FAILED',
        retryCount,
        failureReason: reason.slice(0, 2_000),
        nextAttemptAt: shouldRetry
          ? new Date(Date.now() + 2 ** retryCount * 60_000)
          : new Date(),
        updatedAt: new Date(),
      })
      .where(eq(attendanceReportDeliveries.id, id));
  }
}
