import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import {
  attendanceRecords,
  auditLogs,
  events,
  memberProfiles,
  pastoralFollowUps,
  users,
} from '../database/schema';
import type { CreateFollowUpDto } from './dto/create-follow-up.dto';

@Injectable()
export class PastoralCareRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async absentRecords(churchId: string, since: Date) {
    return this.database
      .select({
        memberId: memberProfiles.id,
        firstName: memberProfiles.firstName,
        lastName: memberProfiles.lastName,
        profilePhotoUrl: memberProfiles.profilePhotoUrl,
        email: users.email,
        phone: users.phone,
        eventId: events.id,
        eventName: events.name,
        eventStartsAt: events.startsAt,
      })
      .from(attendanceRecords)
      .innerJoin(events, eq(events.id, attendanceRecords.eventId))
      .innerJoin(
        memberProfiles,
        eq(memberProfiles.id, attendanceRecords.memberId),
      )
      .innerJoin(users, eq(users.id, memberProfiles.userId))
      .where(
        and(
          eq(events.churchId, churchId),
          eq(attendanceRecords.status, 'ABSENT'),
          gte(events.startsAt, since),
        ),
      )
      .orderBy(desc(events.startsAt));
  }

  async recentFollowUps(churchId: string, memberIds: string[]) {
    if (memberIds.length === 0) return [];
    return this.database
      .select({
        id: pastoralFollowUps.id,
        memberId: pastoralFollowUps.memberId,
        method: pastoralFollowUps.method,
        outcome: pastoralFollowUps.outcome,
        notes: pastoralFollowUps.notes,
        contactedAt: pastoralFollowUps.contactedAt,
        nextFollowUpOn: pastoralFollowUps.nextFollowUpOn,
        contactedByEmail: users.email,
      })
      .from(pastoralFollowUps)
      .innerJoin(users, eq(users.id, pastoralFollowUps.contactedBy))
      .where(
        and(
          eq(pastoralFollowUps.churchId, churchId),
          inArray(pastoralFollowUps.memberId, memberIds),
        ),
      )
      .orderBy(desc(pastoralFollowUps.contactedAt));
  }

  async memberInChurch(memberId: string, churchId: string) {
    const [member] = await this.database
      .select({ id: memberProfiles.id })
      .from(memberProfiles)
      .innerJoin(users, eq(users.id, memberProfiles.userId))
      .where(and(eq(memberProfiles.id, memberId), eq(users.churchId, churchId)))
      .limit(1);
    return member ?? null;
  }

  async createFollowUp(
    memberId: string,
    input: CreateFollowUpDto,
    actor: { id: string; churchId: string },
  ) {
    return this.database.transaction(async (transaction) => {
      const [followUp] = await transaction
        .insert(pastoralFollowUps)
        .values({
          churchId: actor.churchId,
          memberId,
          contactedBy: actor.id,
          method: input.method,
          outcome: input.outcome,
          notes: input.notes?.trim() || null,
          nextFollowUpOn: input.nextFollowUpOn ?? null,
        })
        .returning();
      await transaction.insert(auditLogs).values({
        churchId: actor.churchId,
        actorUserId: actor.id,
        action: 'PASTORAL_FOLLOW_UP_RECORDED',
        entityType: 'PASTORAL_FOLLOW_UP',
        entityId: followUp.id,
        newData: {
          memberId,
          method: input.method,
          outcome: input.outcome,
          nextFollowUpOn: input.nextFollowUpOn ?? null,
        },
      });
      return followUp;
    });
  }
}
