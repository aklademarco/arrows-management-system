import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, lt, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import {
  attendanceRecords,
  departmentMembers,
  departments,
  events,
  memberProfiles,
  users,
} from '../database/schema';

@Injectable()
export class ReportsRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  attendance(input: {
    churchId: string;
    startsAt: Date;
    endsAt: Date;
    departmentId?: string;
  }) {
    const filters = [
      eq(events.churchId, input.churchId),
      gte(events.startsAt, input.startsAt),
      lt(events.startsAt, input.endsAt),
    ];
    if (input.departmentId) {
      filters.push(
        sql`exists (select 1 from ${departmentMembers} dm where dm.member_id = ${memberProfiles.id} and dm.department_id = ${input.departmentId} and dm.joined_at <= (${events.startsAt} at time zone 'Africa/Accra')::date and (dm.left_at is null or dm.left_at > (${events.startsAt} at time zone 'Africa/Accra')::date))`,
      );
    }
    return this.database
      .select({
        eventId: events.id,
        eventName: events.name,
        eventStartsAt: events.startsAt,
        attendanceId: attendanceRecords.id,
        memberId: attendanceRecords.memberId,
        firstName: memberProfiles.firstName,
        lastName: memberProfiles.lastName,
        status: attendanceRecords.status,
        method: attendanceRecords.method,
        punctualityStatus: attendanceRecords.punctualityStatus,
        checkedInAt: attendanceRecords.checkedInAt,
        manualReason: attendanceRecords.manualReason,
      })
      .from(attendanceRecords)
      .innerJoin(events, eq(events.id, attendanceRecords.eventId))
      .innerJoin(
        memberProfiles,
        eq(memberProfiles.id, attendanceRecords.memberId),
      )
      .where(and(...filters))
      .orderBy(asc(events.startsAt));
  }

  departmentAttendance(input: {
    churchId: string;
    startsAt: Date;
    endsAt: Date;
    departmentId?: string;
  }) {
    const filters = [
      eq(events.churchId, input.churchId),
      gte(events.startsAt, input.startsAt),
      lt(events.startsAt, input.endsAt),
      sql`${departmentMembers.joinedAt} <= (${events.startsAt} at time zone 'Africa/Accra')::date`,
      sql`(${departmentMembers.leftAt} is null or ${departmentMembers.leftAt} > (${events.startsAt} at time zone 'Africa/Accra')::date)`,
    ];
    if (input.departmentId)
      filters.push(eq(departmentMembers.departmentId, input.departmentId));
    return this.database
      .select({
        departmentId: departments.id,
        departmentName: departments.name,
        eventId: events.id,
        memberId: attendanceRecords.memberId,
        status: attendanceRecords.status,
        method: attendanceRecords.method,
        punctualityStatus: attendanceRecords.punctualityStatus,
      })
      .from(attendanceRecords)
      .innerJoin(events, eq(events.id, attendanceRecords.eventId))
      .innerJoin(
        departmentMembers,
        eq(departmentMembers.memberId, attendanceRecords.memberId),
      )
      .innerJoin(
        departments,
        eq(departments.id, departmentMembers.departmentId),
      )
      .where(and(...filters))
      .orderBy(asc(departments.name), asc(events.startsAt));
  }

  pendingRegistrations(churchId: string) {
    return this.database
      .select({
        userId: users.id,
        displayName: sql<string>`${memberProfiles.firstName} || ' ' || ${memberProfiles.lastName}`,
        email: users.email,
        requestedDepartmentName: departments.name,
        emailVerifiedAt: users.emailVerifiedAt,
        registeredAt: users.createdAt,
      })
      .from(users)
      .innerJoin(memberProfiles, eq(memberProfiles.userId, users.id))
      .leftJoin(
        departments,
        eq(departments.id, memberProfiles.requestedDepartmentId),
      )
      .where(
        and(
          eq(users.churchId, churchId),
          eq(users.accountStatus, 'PENDING_APPROVAL'),
        ),
      )
      .orderBy(asc(users.createdAt));
  }
}
