import {
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import type { AuthenticatedPrincipal } from '../auth/authenticated.guard';
import {
  absenceRequests,
  attendanceRecords,
  auditLogs,
  departmentLeaders,
  departmentMembers,
  departments,
  eventDepartments,
  events,
  memberProfiles,
  primaryDepartmentAssignments,
  users,
} from '../database/schema';
import { eligibleEventCondition } from '../events/event-eligibility';

// Attendance statuses that represent a real, protected presence. An approved
// absence must never overwrite one of these.
const PROTECTED_STATUSES = ['EARLY', 'ON_TIME', 'LATE'] as const;

function todayString(now: Date): string {
  return now.toISOString().slice(0, 10);
}

@Injectable()
export class AbsenceRequestsRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async findActiveMemberId(
    userId: string,
    churchId: string,
  ): Promise<string | null> {
    const [member] = await this.database
      .select({ id: memberProfiles.id })
      .from(memberProfiles)
      .innerJoin(users, eq(users.id, memberProfiles.userId))
      .where(
        and(
          eq(users.id, userId),
          eq(users.churchId, churchId),
          eq(memberProfiles.membershipStatus, 'ACTIVE'),
        ),
      )
      .limit(1);
    return member?.id ?? null;
  }

  /**
   * Persist a new request. For event-specific requests the event must exist in
   * the church and still be open to absence requests (not cancelled/completed),
   * and the member must not already hold an open request for it.
   */
  async create(input: {
    memberId: string;
    churchId: string;
    eventId: string | null;
    startsOn: string | null;
    endsOn: string | null;
    reason: string;
    details: string | null;
  }) {
    if (input.eventId) {
      const [event] = await this.database
        .select({ id: events.id, status: events.status })
        .from(events)
        .where(
          and(eq(events.id, input.eventId), eq(events.churchId, input.churchId)),
        )
        .limit(1);
      if (!event) throw new NotFoundException('Event not found.');
      if (['CANCELLED', 'COMPLETED'].includes(event.status))
        throw new ConflictException(
          'Absence cannot be requested for this event.',
        );
      const [existing] = await this.database
        .select({ id: absenceRequests.id })
        .from(absenceRequests)
        .where(
          and(
            eq(absenceRequests.memberId, input.memberId),
            eq(absenceRequests.eventId, input.eventId),
            inArray(absenceRequests.status, [
              'PENDING',
              'APPROVED',
              'NEEDS_CLARIFICATION',
            ]),
          ),
        )
        .limit(1);
      if (existing)
        throw new ConflictException(
          'An open absence request already exists for this event.',
        );
    }
    const [record] = await this.database
      .insert(absenceRequests)
      .values({
        memberId: input.memberId,
        eventId: input.eventId,
        startsOn: input.startsOn,
        endsOn: input.endsOn,
        reason: input.reason,
        details: input.details,
      })
      .returning();
    return record;
  }

  async listOwn(memberId: string) {
    return this.database
      .select({
        id: absenceRequests.id,
        eventId: absenceRequests.eventId,
        eventName: events.name,
        eventStartsAt: events.startsAt,
        startsOn: absenceRequests.startsOn,
        endsOn: absenceRequests.endsOn,
        reason: absenceRequests.reason,
        details: absenceRequests.details,
        status: absenceRequests.status,
        reviewNote: absenceRequests.reviewNote,
        reviewedAt: absenceRequests.reviewedAt,
        createdAt: absenceRequests.createdAt,
        updatedAt: absenceRequests.updatedAt,
      })
      .from(absenceRequests)
      .leftJoin(events, eq(events.id, absenceRequests.eventId))
      .where(eq(absenceRequests.memberId, memberId))
      .orderBy(sql`${absenceRequests.createdAt} desc`)
      .limit(100);
  }

  /**
   * Load a request within the reviewer's church. Returns null when the request
   * does not exist or belongs to another church, which the service maps to a
   * NOT_FOUND so cross-church identifiers are indistinguishable from unknown
   * ones.
   */
  async findScopedRequest(requestId: string, churchId: string) {
    const [request] = await this.database
      .select({
        id: absenceRequests.id,
        memberId: absenceRequests.memberId,
        eventId: absenceRequests.eventId,
        startsOn: absenceRequests.startsOn,
        endsOn: absenceRequests.endsOn,
        status: absenceRequests.status,
      })
      .from(absenceRequests)
      .innerJoin(
        memberProfiles,
        eq(memberProfiles.id, absenceRequests.memberId),
      )
      .innerJoin(users, eq(users.id, memberProfiles.userId))
      .where(and(eq(absenceRequests.id, requestId), eq(users.churchId, churchId)))
      .limit(1);
    return request ?? null;
  }

  /** Department IDs the user actively leads in the church (today, half-open). */
  async findLedDepartmentIds(
    userId: string,
    churchId: string,
    today: string,
  ): Promise<string[]> {
    const rows = await this.database
      .selectDistinct({ departmentId: departmentLeaders.departmentId })
      .from(departmentLeaders)
      .innerJoin(
        memberProfiles,
        eq(memberProfiles.id, departmentLeaders.memberId),
      )
      .innerJoin(departments, eq(departments.id, departmentLeaders.departmentId))
      .where(
        and(
          eq(memberProfiles.userId, userId),
          eq(departments.churchId, churchId),
          isNull(departmentLeaders.revokedAt),
          sql`${departmentLeaders.startsAt} <= ${today}`,
          or(
            isNull(departmentLeaders.endsAt),
            sql`${departmentLeaders.endsAt} >= ${today}`,
          ),
        ),
      );
    return rows.map((row) => row.departmentId);
  }

  /** True when the event has no department restriction (open to all members). */
  async isEventOpenToAll(eventId: string): Promise<boolean> {
    const [row] = await this.database
      .select({ id: eventDepartments.id })
      .from(eventDepartments)
      .where(eq(eventDepartments.eventId, eventId))
      .limit(1);
    return !row;
  }

  async findEventStartsAt(eventId: string): Promise<Date | null> {
    const [event] = await this.database
      .select({ startsAt: events.startsAt })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);
    return event?.startsAt ?? null;
  }

  /**
   * For a department-scoped event, does any of the reviewer's led departments
   * both include the member and make them eligible (membership held as of the
   * event start date)? A non-empty intersection authorises the review.
   */
  async leaderCoversEvent(
    eventId: string,
    memberId: string,
    ledDepartmentIds: string[],
    eventStartDate: string,
  ): Promise<boolean> {
    if (ledDepartmentIds.length === 0) return false;
    const [row] = await this.database
      .select({ departmentId: eventDepartments.departmentId })
      .from(eventDepartments)
      .innerJoin(
        departmentMembers,
        eq(departmentMembers.departmentId, eventDepartments.departmentId),
      )
      .where(
        and(
          eq(eventDepartments.eventId, eventId),
          inArray(eventDepartments.departmentId, ledDepartmentIds),
          eq(departmentMembers.memberId, memberId),
          sql`${departmentMembers.joinedAt} <= ${eventStartDate}`,
          or(
            isNull(departmentMembers.leftAt),
            sql`${eventStartDate} < ${departmentMembers.leftAt}`,
          ),
        ),
      )
      .limit(1);
    return Boolean(row);
  }

  /** The member's current primary department id (today, half-open), or null. */
  async findPrimaryDepartmentId(
    memberId: string,
    today: string,
  ): Promise<string | null> {
    const [row] = await this.database
      .select({ departmentId: departmentMembers.departmentId })
      .from(primaryDepartmentAssignments)
      .innerJoin(
        departmentMembers,
        eq(
          departmentMembers.id,
          primaryDepartmentAssignments.departmentMembershipId,
        ),
      )
      .where(
        and(
          eq(primaryDepartmentAssignments.memberId, memberId),
          sql`${primaryDepartmentAssignments.startsAt} <= ${today}`,
          or(
            isNull(primaryDepartmentAssignments.endsAt),
            sql`${primaryDepartmentAssignments.endsAt} > ${today}`,
          ),
        ),
      )
      .orderBy(sql`${primaryDepartmentAssignments.startsAt} desc`)
      .limit(1);
    return row?.departmentId ?? null;
  }

  /** Non-approval decisions: only touch the request's review metadata. */
  async recordDecision(
    requestId: string,
    reviewer: AuthenticatedPrincipal,
    status: 'REJECTED' | 'NEEDS_CLARIFICATION',
    reviewNote: string,
    now: Date,
  ) {
    return this.database.transaction(async (transaction) => {
      const [current] = await transaction
        .select({ id: absenceRequests.id, status: absenceRequests.status })
        .from(absenceRequests)
        .where(eq(absenceRequests.id, requestId))
        .limit(1)
        .for('update');
      if (!current) throw new NotFoundException('Absence request not found.');
      if (!['PENDING', 'NEEDS_CLARIFICATION'].includes(current.status))
        throw new ConflictException(
          'This absence request has already been decided.',
        );
      const [record] = await transaction
        .update(absenceRequests)
        .set({
          status,
          reviewedBy: reviewer.id,
          reviewNote,
          reviewedAt: now,
          updatedAt: now,
        })
        .where(eq(absenceRequests.id, requestId))
        .returning();
      await transaction.insert(auditLogs).values({
        churchId: reviewer.churchId,
        actorUserId: reviewer.id,
        action: 'ABSENCE_REQUEST_REVIEWED',
        entityType: 'ABSENCE_REQUEST',
        entityId: requestId,
        previousData: { status: current.status },
        newData: { status },
        metadata: { reviewNote },
      });
      return record;
    });
  }

  /**
   * Approve a request and reconcile the covered, already-closed events. Open and
   * future events are left for finalization to materialize so a genuine
   * check-in can still take precedence.
   */
  async approve(
    requestId: string,
    reviewer: AuthenticatedPrincipal,
    reviewNote: string,
    now: Date,
  ) {
    return this.database.transaction(async (transaction) => {
      const [request] = await transaction
        .select({
          id: absenceRequests.id,
          memberId: absenceRequests.memberId,
          eventId: absenceRequests.eventId,
          startsOn: absenceRequests.startsOn,
          endsOn: absenceRequests.endsOn,
          status: absenceRequests.status,
        })
        .from(absenceRequests)
        .where(eq(absenceRequests.id, requestId))
        .limit(1)
        .for('update');
      if (!request) throw new NotFoundException('Absence request not found.');
      if (!['PENDING', 'NEEDS_CLARIFICATION'].includes(request.status))
        throw new ConflictException(
          'This absence request has already been decided.',
        );

      // Resolve the covered events (eligible, not cancelled) and split them into
      // those whose attendance window has closed (reconcile now) and those still
      // open/future (defer to finalization).
      const coveredEvents = request.eventId
        ? await transaction
            .select({
              id: events.id,
              closesAt: events.attendanceClosesAt,
            })
            .from(events)
            .where(eq(events.id, request.eventId))
        : await transaction
            .select({
              id: events.id,
              closesAt: events.attendanceClosesAt,
            })
            .from(events)
            .where(
              and(
                eq(events.churchId, reviewer.churchId),
                sql`${events.status} <> 'CANCELLED'`,
                sql`(${events.startsAt} AT TIME ZONE 'UTC')::date >= ${request.startsOn}`,
                sql`(${events.startsAt} AT TIME ZONE 'UTC')::date <= ${request.endsOn}`,
                eligibleEventCondition(request.memberId),
              ),
            );

      const closedEventIds: string[] = [];
      let deferred = 0;
      for (const event of coveredEvents) {
        if (event.closesAt <= now) closedEventIds.push(event.id);
        else deferred += 1;
      }

      // Existing attendance for the member across the closed covered events.
      const existingRecords =
        closedEventIds.length === 0
          ? []
          : await transaction
              .select({
                id: attendanceRecords.id,
                eventId: attendanceRecords.eventId,
                status: attendanceRecords.status,
              })
              .from(attendanceRecords)
              .where(
                and(
                  eq(attendanceRecords.memberId, request.memberId),
                  inArray(attendanceRecords.eventId, closedEventIds),
                ),
              );
      const existingByEvent = new Map(
        existingRecords.map((record) => [record.eventId, record]),
      );

      // Event-specific approval is rejected outright when the single event
      // already carries a protected presence; date-range approval preserves and
      // skips such events.
      if (request.eventId) {
        const existing = existingByEvent.get(request.eventId);
        if (existing && PROTECTED_STATUSES.includes(existing.status as never))
          throw new HttpException(
            {
              code: 'ATTENDANCE_CONFLICT',
              message:
                'This event already has a recorded attendance that cannot be excused.',
            },
            409,
          );
      }

      let excusedCreated = 0;
      let excusedUpdated = 0;
      let skippedAttended = 0;
      const insertRows: Array<{
        eventId: string;
        memberId: string;
        status: 'EXCUSED';
        method: 'SYSTEM';
        pointsAwarded: number;
        absenceRequestId: string;
      }> = [];

      for (const eventId of closedEventIds) {
        const existing = existingByEvent.get(eventId);
        if (!existing) {
          insertRows.push({
            eventId,
            memberId: request.memberId,
            status: 'EXCUSED',
            method: 'SYSTEM',
            pointsAwarded: 0,
            absenceRequestId: request.id,
          });
          continue;
        }
        if (PROTECTED_STATUSES.includes(existing.status as never)) {
          skippedAttended += 1;
          continue;
        }
        // ABSENT or already-EXCUSED: re-point to this request and clear points.
        await transaction
          .update(attendanceRecords)
          .set({
            status: 'EXCUSED',
            method: 'SYSTEM',
            absenceRequestId: request.id,
            pointsAwarded: 0,
            updatedAt: now,
          })
          .where(eq(attendanceRecords.id, existing.id));
        excusedUpdated += 1;
      }

      if (insertRows.length > 0) {
        const inserted = await transaction
          .insert(attendanceRecords)
          .values(insertRows)
          .returning({ id: attendanceRecords.id });
        excusedCreated = inserted.length;
      }

      const [record] = await transaction
        .update(absenceRequests)
        .set({
          status: 'APPROVED',
          reviewedBy: reviewer.id,
          reviewNote,
          reviewedAt: now,
          updatedAt: now,
        })
        .where(eq(absenceRequests.id, requestId))
        .returning();

      await transaction.insert(auditLogs).values({
        churchId: reviewer.churchId,
        actorUserId: reviewer.id,
        action: 'ABSENCE_REQUEST_APPROVED',
        entityType: 'ABSENCE_REQUEST',
        entityId: requestId,
        previousData: { status: request.status },
        newData: { status: 'APPROVED' },
        metadata: {
          excusedCreated,
          excusedUpdated,
          skippedAttended,
          deferred,
        },
      });

      return {
        request: record,
        affected: excusedCreated + excusedUpdated,
        excusedCreated,
        excusedUpdated,
        deferred,
        skippedAttended,
      };
    });
  }
}
