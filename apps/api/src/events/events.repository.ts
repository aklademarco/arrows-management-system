import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import { auditLogs, events } from '../database/schema';
import type { CreateEventDto } from './dto/create-event.dto';

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
    return this.database.transaction(async (transaction) => {
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
        },
      });
      return event;
    });
  }
}
