import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, isNull, lt, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import {
  attendanceRecords,
  departmentMembers,
  events,
  leaderboardEntries,
  memberProfiles,
  users,
} from '../database/schema';

@Injectable()
export class LeaderboardsRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async individual(input: {
    churchId: string;
    startsAt: Date;
    endsAt: Date;
    departmentId?: string;
  }) {
    const filters = [
      eq(users.churchId, input.churchId),
      eq(events.status, 'COMPLETED'),
      gte(events.startsAt, input.startsAt),
      lt(events.startsAt, input.endsAt),
    ];
    if (input.departmentId) {
      filters.push(
        sql`exists (select 1 from ${departmentMembers} dm where dm.member_id = ${memberProfiles.id} and dm.department_id = ${input.departmentId} and dm.joined_at <= (${events.startsAt} at time zone 'Africa/Accra')::date and (dm.left_at is null or dm.left_at > (${events.startsAt} at time zone 'Africa/Accra')::date))`,
      );
    }
    const rows = await this.database
      .select({
        memberId: memberProfiles.id,
        firstName: memberProfiles.firstName,
        lastName: memberProfiles.lastName,
        eventId: events.id,
        eventStartsAt: events.startsAt,
        status: attendanceRecords.status,
        punctualityStatus: attendanceRecords.punctualityStatus,
      })
      .from(attendanceRecords)
      .innerJoin(events, eq(events.id, attendanceRecords.eventId))
      .innerJoin(
        memberProfiles,
        eq(memberProfiles.id, attendanceRecords.memberId),
      )
      .innerJoin(users, eq(users.id, memberProfiles.userId))
      .where(and(...filters))
      .orderBy(asc(events.startsAt));

    const points = await this.database
      .select({
        memberId: leaderboardEntries.memberId,
        points: sql<number>`coalesce(sum(${leaderboardEntries.points}), 0)::int`,
      })
      .from(leaderboardEntries)
      .innerJoin(
        memberProfiles,
        eq(memberProfiles.id, leaderboardEntries.memberId),
      )
      .innerJoin(users, eq(users.id, memberProfiles.userId))
      .where(
        and(
          eq(users.churchId, input.churchId),
          gte(leaderboardEntries.occurredAt, input.startsAt),
          lt(leaderboardEntries.occurredAt, input.endsAt),
          isNull(leaderboardEntries.voidedAt),
        ),
      )
      .groupBy(leaderboardEntries.memberId);
    return { rows, points };
  }
}
