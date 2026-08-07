import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import distance from '@turf/distance';
import { point } from '@turf/helpers';
import type { AuthenticatedPrincipal } from '../auth/authenticated.guard';
import type { AdminPrincipal } from '../auth/admin.guard';
import { events } from '../database/schema';
import { CheckInDto } from './dto/check-in.dto';
import { CorrectAttendanceDto } from './dto/correct-attendance.dto';
import { ManualAttendanceDto } from './dto/manual-attendance.dto';
import { AttendanceRepository } from './attendance.repository';
import { Inject } from '@nestjs/common';
import { DATABASE, type Database } from '../database/database.module';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly repository: AttendanceRepository,
    @Inject(DATABASE) private readonly database: Database,
  ) {}

  listActiveEvents(user: AuthenticatedPrincipal) {
    return this.repository.listActiveEvents(user.id, user.churchId, new Date());
  }

  listUpcomingEvents(user: AuthenticatedPrincipal) {
    return this.repository.listUpcomingEvents(
      user.id,
      user.churchId,
      new Date(),
    );
  }

  listOwnAttendance(user: AuthenticatedPrincipal) {
    return this.repository.listOwnAttendance(user.id, user.churchId);
  }

  eventRoster(eventId: string, admin: AdminPrincipal) {
    return this.repository.eventRoster(eventId, admin.churchId);
  }

  markManual(dto: ManualAttendanceDto, admin: AdminPrincipal) {
    return this.repository.markManual(dto, admin);
  }

  correct(
    attendanceId: string,
    dto: CorrectAttendanceDto,
    admin: AdminPrincipal,
  ) {
    return this.repository.correct(attendanceId, dto, admin);
  }

  finalizeEvent(eventId: string, admin: AdminPrincipal) {
    return this.repository.finalizeEvent(eventId, admin, new Date());
  }

  async checkIn(user: AuthenticatedPrincipal, dto: CheckInDto) {
    const now = new Date();
    const memberId = await this.repository.findActiveMemberId(
      user.id,
      user.churchId,
    );
    if (!memberId) throw new NotFoundException('Member profile not found.');
    const [event] = await this.database
      .select()
      .from(events)
      .where(
        and(eq(events.id, dto.eventId), eq(events.churchId, user.churchId)),
      )
      .limit(1);
    if (!event) throw new NotFoundException('Event not found.');
    if (
      !['SCHEDULED', 'ACTIVE'].includes(event.status) ||
      now < event.attendanceOpensAt ||
      now > event.attendanceClosesAt
    )
      throw new HttpException(
        {
          code: 'ATTENDANCE_CLOSED',
          message: 'Attendance is not open for this event.',
        },
        422,
      );
    const eligible = await this.repository.isMemberEligibleForEvent(
      memberId,
      event.id,
      user.churchId,
    );
    if (!eligible)
      throw new HttpException(
        {
          code: 'EVENT_NOT_ELIGIBLE',
          message: 'You are not eligible to attend this event.',
        },
        422,
      );
    if (dto.accuracyMeters > event.maximumAccuracyMeters)
      throw new HttpException(
        {
          code: 'POOR_LOCATION_ACCURACY',
          message: 'Location accuracy is not precise enough.',
          details: {
            accuracyMeters: dto.accuracyMeters,
            maximumAccuracyMeters: event.maximumAccuracyMeters,
          },
        },
        422,
      );
    const distanceMeters =
      distance(
        point([dto.longitude, dto.latitude]),
        point([Number(event.longitude), Number(event.latitude)]),
        { units: 'kilometers' },
      ) * 1000;
    if (distanceMeters > event.geofenceRadiusMeters)
      throw new HttpException(
        {
          code: 'OUTSIDE_GEOFENCE',
          message: 'You are outside the attendance area.',
          details: {
            distanceMeters,
            allowedRadiusMeters: event.geofenceRadiusMeters,
          },
        },
        422,
      );
    const status =
      event.earlyUntil && now <= event.earlyUntil
        ? 'EARLY'
        : now > event.lateAfter
          ? 'LATE'
          : 'ON_TIME';
    const record = await this.repository.checkIn({
      memberId,
      eventId: event.id,
      now,
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracyMeters: dto.accuracyMeters,
      distanceMeters,
      status,
    });
    return {
      attendanceId: record.id,
      eventId: event.id,
      status,
      checkedInAt: now,
      distanceMeters: Number(distanceMeters.toFixed(2)),
      pointsAwarded: 10,
    };
  }
}
