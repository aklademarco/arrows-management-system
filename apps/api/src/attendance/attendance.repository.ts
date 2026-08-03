import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, gt, gte, inArray, lte } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import type { AdminPrincipal } from '../auth/admin.guard';
import {
  attendanceRecords,
  auditLogs,
  events,
  memberProfiles,
  users,
} from '../database/schema';
import type { CorrectAttendanceDto } from './dto/correct-attendance.dto';
import type { ManualAttendanceDto } from './dto/manual-attendance.dto';

function isUniqueViolation(error: unknown): boolean {
  let current = error;
  for (let depth = 0; depth < 4; depth += 1) {
    if (typeof current !== 'object' || current === null) return false;
    if ('code' in current && current.code === '23505') return true;
    current = 'cause' in current ? current.cause : null;
  }
  return false;
}

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

  async listOwnAttendance(userId: string, churchId: string) {
    const [member] = await this.database
      .select({ id: memberProfiles.id })
      .from(memberProfiles)
      .innerJoin(users, eq(users.id, memberProfiles.userId))
      .where(and(eq(users.id, userId), eq(users.churchId, churchId)))
      .limit(1);
    if (!member) throw new NotFoundException('Member profile not found.');

    const rows = await this.database
      .select({
        id: attendanceRecords.id,
        eventId: attendanceRecords.eventId,
        eventName: events.name,
        eventStartsAt: events.startsAt,
        locationName: events.locationName,
        status: attendanceRecords.status,
        method: attendanceRecords.method,
        checkedInAt: attendanceRecords.checkedInAt,
        distanceMeters: attendanceRecords.distanceMeters,
        accuracyMeters: attendanceRecords.accuracyMeters,
        pointsAwarded: attendanceRecords.pointsAwarded,
      })
      .from(attendanceRecords)
      .innerJoin(events, eq(events.id, attendanceRecords.eventId))
      .where(
        and(
          eq(attendanceRecords.memberId, member.id),
          eq(events.churchId, churchId),
        ),
      )
      .orderBy(desc(attendanceRecords.checkedInAt))
      .limit(50);

    return rows.map((row) => ({
      ...row,
      distanceMeters:
        row.distanceMeters === null ? null : Number(row.distanceMeters),
      accuracyMeters:
        row.accuracyMeters === null ? null : Number(row.accuracyMeters),
    }));
  }

  async eventRoster(eventId: string, churchId: string) {
    const [event] = await this.database
      .select({
        id: events.id,
        name: events.name,
        status: events.status,
        attendanceFinalizedAt: events.attendanceFinalizedAt,
      })
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.churchId, churchId)))
      .limit(1);
    if (!event) throw new NotFoundException('Event not found.');
    const members = await this.database
      .select({
        memberId: memberProfiles.id,
        firstName: memberProfiles.firstName,
        lastName: memberProfiles.lastName,
        email: users.email,
        attendanceId: attendanceRecords.id,
        attendanceStatus: attendanceRecords.status,
        method: attendanceRecords.method,
        checkedInAt: attendanceRecords.checkedInAt,
        accuracyMeters: attendanceRecords.accuracyMeters,
        distanceMeters: attendanceRecords.distanceMeters,
        pointsAwarded: attendanceRecords.pointsAwarded,
      })
      .from(memberProfiles)
      .innerJoin(users, eq(users.id, memberProfiles.userId))
      .leftJoin(
        attendanceRecords,
        and(
          eq(attendanceRecords.memberId, memberProfiles.id),
          eq(attendanceRecords.eventId, eventId),
        ),
      )
      .where(
        and(
          eq(users.churchId, churchId),
          eq(users.accountStatus, 'ACTIVE'),
          eq(memberProfiles.membershipStatus, 'ACTIVE'),
        ),
      )
      .orderBy(asc(memberProfiles.lastName), asc(memberProfiles.firstName));
    return {
      event,
      members: members.map((member) => ({
        ...member,
        accuracyMeters:
          member.accuracyMeters === null ? null : Number(member.accuracyMeters),
        distanceMeters:
          member.distanceMeters === null ? null : Number(member.distanceMeters),
      })),
    };
  }

  async markManual(dto: ManualAttendanceDto, admin: AdminPrincipal) {
    try {
      return await this.database.transaction(async (transaction) => {
        const [event] = await transaction
          .select({ id: events.id, status: events.status })
          .from(events)
          .where(
            and(
              eq(events.id, dto.eventId),
              eq(events.churchId, admin.churchId),
            ),
          )
          .limit(1)
          .for('update');
        if (!event) throw new NotFoundException('Event not found.');
        if (['CANCELLED', 'COMPLETED'].includes(event.status))
          throw new ConflictException(
            'Attendance cannot be added to this event.',
          );
        const [member] = await transaction
          .select({ id: memberProfiles.id })
          .from(memberProfiles)
          .innerJoin(users, eq(users.id, memberProfiles.userId))
          .where(
            and(
              eq(memberProfiles.id, dto.memberId),
              eq(users.churchId, admin.churchId),
              eq(users.accountStatus, 'ACTIVE'),
            ),
          )
          .limit(1);
        if (!member) throw new NotFoundException('Member not found.');
        const now = new Date();
        const [record] = await transaction
          .insert(attendanceRecords)
          .values({
            eventId: dto.eventId,
            memberId: dto.memberId,
            status: dto.status,
            method: 'MANUAL',
            checkedInAt: now,
            markedBy: admin.id,
            manualReason: dto.reason.trim(),
            pointsAwarded: 10,
          })
          .returning();
        await transaction.insert(auditLogs).values({
          churchId: admin.churchId,
          actorUserId: admin.id,
          action: 'ATTENDANCE_MANUALLY_RECORDED',
          entityType: 'ATTENDANCE_RECORD',
          entityId: record.id,
          newData: {
            eventId: dto.eventId,
            memberId: dto.memberId,
            status: dto.status,
            method: 'MANUAL',
          },
          metadata: { reason: dto.reason.trim() },
        });
        return record;
      });
    } catch (error: unknown) {
      if (isUniqueViolation(error))
        throw new ConflictException(
          'Attendance already exists for this member and event.',
        );
      throw error;
    }
  }

  async correct(
    attendanceId: string,
    dto: CorrectAttendanceDto,
    admin: AdminPrincipal,
  ) {
    return this.database.transaction(async (transaction) => {
      const [current] = await transaction
        .select({
          id: attendanceRecords.id,
          status: attendanceRecords.status,
          eventStatus: events.status,
        })
        .from(attendanceRecords)
        .innerJoin(events, eq(events.id, attendanceRecords.eventId))
        .where(
          and(
            eq(attendanceRecords.id, attendanceId),
            eq(events.churchId, admin.churchId),
          ),
        )
        .limit(1)
        .for('update');
      if (!current) throw new NotFoundException('Attendance record not found.');
      if (current.eventStatus === 'CANCELLED')
        throw new ConflictException(
          'Cancelled-event attendance cannot be corrected.',
        );
      const pointsAwarded = ['EARLY', 'ON_TIME', 'LATE'].includes(dto.status)
        ? 10
        : 0;
      const [record] = await transaction
        .update(attendanceRecords)
        .set({
          status: dto.status,
          pointsAwarded,
          reviewNote: dto.reviewNote.trim(),
          updatedAt: new Date(),
        })
        .where(eq(attendanceRecords.id, attendanceId))
        .returning();
      await transaction.insert(auditLogs).values({
        churchId: admin.churchId,
        actorUserId: admin.id,
        action: 'ATTENDANCE_CORRECTED',
        entityType: 'ATTENDANCE_RECORD',
        entityId: attendanceId,
        previousData: { status: current.status },
        newData: { status: dto.status, pointsAwarded },
        metadata: { reviewNote: dto.reviewNote.trim() },
      });
      return record;
    });
  }

  async finalizeEvent(eventId: string, admin: AdminPrincipal, now: Date) {
    return this.database.transaction(async (transaction) => {
      const [event] = await transaction
        .select({
          id: events.id,
          name: events.name,
          status: events.status,
          attendanceClosesAt: events.attendanceClosesAt,
          attendanceFinalizedAt: events.attendanceFinalizedAt,
        })
        .from(events)
        .where(and(eq(events.id, eventId), eq(events.churchId, admin.churchId)))
        .limit(1)
        .for('update');
      if (!event) throw new NotFoundException('Event not found.');
      if (event.status === 'CANCELLED')
        throw new ConflictException('Cancelled events cannot be finalized.');
      if (event.attendanceClosesAt > now)
        throw new ConflictException(
          'Attendance cannot be finalized before the attendance window closes.',
        );
      if (event.attendanceFinalizedAt) {
        const existing = await transaction
          .select({ id: attendanceRecords.id })
          .from(attendanceRecords)
          .where(eq(attendanceRecords.eventId, eventId));
        return {
          event,
          alreadyFinalized: true,
          eligibleMembers: existing.length,
          existingRecords: existing.length,
          absentRecordsCreated: 0,
        };
      }

      const eligibleMembers = await transaction
        .select({ id: memberProfiles.id })
        .from(memberProfiles)
        .innerJoin(users, eq(users.id, memberProfiles.userId))
        .where(
          and(
            eq(users.churchId, admin.churchId),
            eq(users.accountStatus, 'ACTIVE'),
            eq(memberProfiles.membershipStatus, 'ACTIVE'),
          ),
        );
      const existing = await transaction
        .select({ memberId: attendanceRecords.memberId })
        .from(attendanceRecords)
        .where(eq(attendanceRecords.eventId, eventId));
      const existingMemberIds = new Set(
        existing.map((record) => record.memberId),
      );
      const missingMembers = eligibleMembers.filter(
        (member) => !existingMemberIds.has(member.id),
      );

      const inserted =
        missingMembers.length === 0
          ? []
          : await transaction
              .insert(attendanceRecords)
              .values(
                missingMembers.map((member) => ({
                  eventId,
                  memberId: member.id,
                  status: 'ABSENT' as const,
                  method: 'SYSTEM' as const,
                  pointsAwarded: 0,
                })),
              )
              .returning({ id: attendanceRecords.id });

      const [finalizedEvent] = await transaction
        .update(events)
        .set({
          status: 'COMPLETED',
          attendanceFinalizedAt: now,
          attendanceFinalizedBy: admin.id,
          updatedAt: now,
        })
        .where(eq(events.id, eventId))
        .returning();
      await transaction.insert(auditLogs).values({
        churchId: admin.churchId,
        actorUserId: admin.id,
        action: 'ATTENDANCE_FINALIZED',
        entityType: 'EVENT',
        entityId: eventId,
        previousData: { status: event.status },
        newData: { status: 'COMPLETED' },
        metadata: {
          eligibleMembers: eligibleMembers.length,
          existingRecords: existing.length,
          absentRecordsCreated: inserted.length,
        },
      });
      return {
        event: finalizedEvent,
        alreadyFinalized: false,
        eligibleMembers: eligibleMembers.length,
        existingRecords: existing.length,
        absentRecordsCreated: inserted.length,
      };
    });
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
      if (isUniqueViolation(error))
        throw new ConflictException({
          code: 'DUPLICATE_ATTENDANCE',
          message: 'You have already checked in for this event.',
        });
      throw error;
    }
  }
}
