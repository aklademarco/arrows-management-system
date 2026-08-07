import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import {
  attendanceRecords,
  auditLogs,
  departments,
  eventDepartments,
  events,
} from '../database/schema';
import type { CreateEventDto } from './dto/create-event.dto';
import type { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  list(churchId: string) {
    return this.database
      .select()
      .from(events)
      .where(eq(events.churchId, churchId))
      .orderBy(desc(events.startsAt));
  }

  create(dto: CreateEventDto, admin: { id: string; churchId: string }) {
    const requiredDepartmentIds = Array.from(
      new Set(dto.requiredDepartmentIds ?? []),
    );
    return this.database.transaction(async (transaction) => {
      if (requiredDepartmentIds.length > 0) {
        const owned = await transaction
          .select({ id: departments.id })
          .from(departments)
          .where(
            and(
              eq(departments.churchId, admin.churchId),
              eq(departments.isActive, true),
              inArray(departments.id, requiredDepartmentIds),
            ),
          );
        if (owned.length !== requiredDepartmentIds.length)
          throw new BadRequestException(
            'One or more required departments were not found in this church.',
          );
      }
      const [event] = await transaction
        .insert(events)
        .values({
          churchId: admin.churchId,
          name: dto.name.trim(),
          eventType: dto.eventType.trim().toUpperCase(),
          description: dto.description?.trim() || null,
          startsAt: new Date(dto.startsAt),
          endsAt: new Date(dto.endsAt),
          attendanceOpensAt: new Date(dto.attendanceOpensAt),
          attendanceClosesAt: new Date(dto.attendanceClosesAt),
          earlyUntil: dto.earlyUntil ? new Date(dto.earlyUntil) : null,
          lateAfter: new Date(dto.lateAfter),
          locationName: dto.locationName?.trim() || null,
          latitude: String(dto.latitude),
          longitude: String(dto.longitude),
          geofenceRadiusMeters: dto.geofenceRadiusMeters,
          maximumAccuracyMeters: dto.maximumAccuracyMeters,
          status: 'SCHEDULED',
          createdBy: admin.id,
        })
        .returning();
      if (requiredDepartmentIds.length > 0) {
        await transaction.insert(eventDepartments).values(
          requiredDepartmentIds.map((departmentId) => ({
            eventId: event.id,
            departmentId,
          })),
        );
      }
      await transaction.insert(auditLogs).values({
        churchId: admin.churchId,
        actorUserId: admin.id,
        action: 'EVENT_CREATED',
        entityType: 'EVENT',
        entityId: event.id,
        newData: {
          name: event.name,
          startsAt: event.startsAt,
          status: event.status,
          requiredDepartmentIds,
        },
      });
      return { ...event, requiredDepartmentIds };
    });
  }

  async findById(eventId: string, churchId: string) {
    const [event] = await this.database
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.churchId, churchId)))
      .limit(1);
    if (!event) throw new NotFoundException('Event not found.');
    const assigned = await this.database
      .select({ departmentId: eventDepartments.departmentId })
      .from(eventDepartments)
      .where(eq(eventDepartments.eventId, eventId));
    return {
      ...event,
      requiredDepartmentIds: assigned.map((row) => row.departmentId),
    };
  }

  update(
    eventId: string,
    churchId: string,
    dto: UpdateEventDto,
    actorId: string,
  ) {
    return this.database.transaction(async (transaction) => {
      const [event] = await transaction
        .update(events)
        .set({
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description.trim() || null }
            : {}),
          ...(dto.startsAt ? { startsAt: new Date(dto.startsAt) } : {}),
          ...(dto.endsAt ? { endsAt: new Date(dto.endsAt) } : {}),
          ...(dto.attendanceOpensAt
            ? { attendanceOpensAt: new Date(dto.attendanceOpensAt) }
            : {}),
          ...(dto.attendanceClosesAt
            ? { attendanceClosesAt: new Date(dto.attendanceClosesAt) }
            : {}),
          ...(dto.earlyUntil ? { earlyUntil: new Date(dto.earlyUntil) } : {}),
          ...(dto.lateAfter ? { lateAfter: new Date(dto.lateAfter) } : {}),
          ...(dto.locationName !== undefined
            ? { locationName: dto.locationName.trim() || null }
            : {}),
          ...(dto.geofenceRadiusMeters !== undefined
            ? { geofenceRadiusMeters: dto.geofenceRadiusMeters }
            : {}),
          ...(dto.maximumAccuracyMeters !== undefined
            ? { maximumAccuracyMeters: dto.maximumAccuracyMeters }
            : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(events.id, eventId), eq(events.churchId, churchId)))
        .returning();
      if (!event) throw new NotFoundException('Event not found.');
      await transaction.insert(auditLogs).values({
        churchId,
        actorUserId: actorId,
        action: 'EVENT_UPDATED',
        entityType: 'EVENT',
        entityId: eventId,
        newData: dto,
      });
      return event;
    });
  }

  cancel(eventId: string, churchId: string, actorId: string, reason: string) {
    return this.database.transaction(async (transaction) => {
      const [current] = await transaction
        .select()
        .from(events)
        .where(and(eq(events.id, eventId), eq(events.churchId, churchId)))
        .limit(1)
        .for('update');
      if (!current) throw new NotFoundException('Event not found.');
      if (current.status === 'CANCELLED') {
        const preserved = await transaction
          .select({ id: attendanceRecords.id })
          .from(attendanceRecords)
          .where(eq(attendanceRecords.eventId, eventId));
        return {
          event: current,
          preservedAttendanceRecords: preserved.length,
          alreadyCancelled: true,
        };
      }
      const now = new Date();
      const [event] = await transaction
        .update(events)
        .set({
          status: 'CANCELLED',
          cancelledAt: now,
          cancelledBy: actorId,
          cancellationReason: reason,
          updatedAt: now,
        })
        .where(eq(events.id, eventId))
        .returning();
      const affected = await transaction
        .update(attendanceRecords)
        .set({ pointsAwarded: 0, updatedAt: now })
        .where(eq(attendanceRecords.eventId, eventId))
        .returning({ id: attendanceRecords.id });
      await transaction.insert(auditLogs).values({
        churchId,
        actorUserId: actorId,
        action: 'EVENT_CANCELLED',
        entityType: 'EVENT',
        entityId: eventId,
        previousData: { status: current.status },
        newData: { status: 'CANCELLED' },
        metadata: { reason, preservedAttendanceRecords: affected.length },
      });
      return {
        event,
        preservedAttendanceRecords: affected.length,
        alreadyCancelled: false,
      };
    });
  }
}
