import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, lt, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import {
  attendanceRecords,
  departmentMembers,
  events,
  memberProfiles,
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
}
