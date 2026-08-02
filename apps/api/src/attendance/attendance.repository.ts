import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, gt, gte, inArray, lte } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import {
  attendanceRecords,
  events,
  memberProfiles,
  users,
} from '../database/schema';

@Injectable()
export class AttendanceRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async listActiveEvents(userId: string, churchId: string, now: Date) {
    const [member] = await this.database
      .select({ id: memberProfiles.id })
      .from(memberProfiles)
      .where(
        and(
          eq(memberProfiles.userId, userId),
          eq(memberProfiles.membershipStatus, 'ACTIVE'),
        ),
      )
      .limit(1);
    if (!member) throw new NotFoundException('Member profile not found.');
    const rows = await this.database
      .select()
      .from(events)
      .where(
        and(
          eq(events.churchId, churchId),
          inArray(events.status, ['SCHEDULED', 'ACTIVE']),
          lte(events.attendanceOpensAt, now),
          gte(events.attendanceClosesAt, now),
        ),
      );
    return rows.map((event) => ({
      ...event,
      latitude: Number(event.latitude),
      longitude: Number(event.longitude),
    }));
  }

  async listUpcomingEvents(userId: string, churchId: string, now: Date) {
    const [member] = await this.database
      .select({ id: memberProfiles.id })
      .from(memberProfiles)
      .where(
        and(
          eq(memberProfiles.userId, userId),
          eq(memberProfiles.membershipStatus, 'ACTIVE'),
        ),
      )
      .limit(1);
    if (!member) throw new NotFoundException('Member profile not found.');
    const rows = await this.database
      .select()
      .from(events)
      .where(
        and(
          eq(events.churchId, churchId),
          eq(events.status, 'SCHEDULED'),
          gt(events.attendanceOpensAt, now),
        ),
      )
      .orderBy(asc(events.startsAt))
      .limit(20);
    return rows.map((event) => ({
      ...event,
      latitude: Number(event.latitude),
      longitude: Number(event.longitude),
    }));
  }

  async checkIn(input: {
    userId: string;
    churchId: string;
    eventId: string;
    now: Date;
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    distanceMeters: number;
    status: 'EARLY' | 'ON_TIME' | 'LATE';
  }) {
    try {
      return await this.database.transaction(async (transaction) => {
        const [member] = await transaction
          .select({ id: memberProfiles.id })
          .from(memberProfiles)
          .innerJoin(users, eq(users.id, memberProfiles.userId))
          .where(
            and(
              eq(users.id, input.userId),
              eq(users.churchId, input.churchId),
              eq(memberProfiles.membershipStatus, 'ACTIVE'),
            ),
          )
          .limit(1);
        if (!member) throw new NotFoundException('Member profile not found.');
        const [record] = await transaction
          .insert(attendanceRecords)
          .values({
            eventId: input.eventId,
            memberId: member.id,
            status: input.status,
            method: 'GEOLOCATION',
            checkedInAt: input.now,
            latitude: String(input.latitude),
            longitude: String(input.longitude),
            accuracyMeters: input.accuracyMeters.toFixed(2),
            distanceMeters: input.distanceMeters.toFixed(2),
            withinGeofence: true,
            pointsAwarded: 10,
          })
          .returning();
        return record;
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      )
        throw new ConflictException({
          code: 'DUPLICATE_ATTENDANCE',
          message: 'You have already checked in for this event.',
        });
      throw error;
    }
  }
}
