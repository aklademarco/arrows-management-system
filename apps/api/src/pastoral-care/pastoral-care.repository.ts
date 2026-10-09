import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import {
  attendanceRecords,
  auditLogs,
  events,
  memberProfiles,
  pastoralCareRequests,
  pastoralFollowUps,
  users,
} from '../database/schema';
import type { CreateCareRequestDto } from './dto/create-care-request.dto';
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

  async findActiveMemberId(userId: string, churchId: string) {
    const [member] = await this.database
      .select({ id: memberProfiles.id })
      .from(memberProfiles)
      .innerJoin(users, eq(users.id, memberProfiles.userId))
      .where(
        and(
          eq(users.id, userId),
          eq(users.churchId, churchId),
          eq(users.accountStatus, 'ACTIVE'),
          eq(memberProfiles.membershipStatus, 'ACTIVE'),
        ),
      )
      .limit(1);
    return member?.id ?? null;
  }

  async createCareRequest(
    memberId: string,
    input: CreateCareRequestDto,
    actor: { id: string; churchId: string },
  ) {
    return this.database.transaction(async (transaction) => {
      const [request] = await transaction
        .insert(pastoralCareRequests)
        .values({
          churchId: actor.churchId,
          memberId,
          type: input.type,
          subject: input.subject,
          body: input.body,
        })
        .returning();
      await transaction.insert(auditLogs).values({
        churchId: actor.churchId,
        actorUserId: actor.id,
        action: 'PASTORAL_CARE_REQUEST_SUBMITTED',
        entityType: 'PASTORAL_CARE_REQUEST',
        entityId: request.id,
        newData: {
          memberId,
          type: input.type,
          status: 'NEW',
        },
      });
      return request;
    });
  }

  listOwnCareRequests(memberId: string, churchId: string) {
    return this.database
      .select({
        id: pastoralCareRequests.id,
        type: pastoralCareRequests.type,
        subject: pastoralCareRequests.subject,
        body: pastoralCareRequests.body,
        status: pastoralCareRequests.status,
        handledAt: pastoralCareRequests.handledAt,
        createdAt: pastoralCareRequests.createdAt,
        updatedAt: pastoralCareRequests.updatedAt,
      })
      .from(pastoralCareRequests)
      .where(
        and(
          eq(pastoralCareRequests.memberId, memberId),
          eq(pastoralCareRequests.churchId, churchId),
        ),
      )
      .orderBy(desc(pastoralCareRequests.createdAt))
      .limit(50);
  }

  listCareRequestInbox(churchId: string) {
    return this.database
      .select({
        id: pastoralCareRequests.id,
        memberId: pastoralCareRequests.memberId,
        type: pastoralCareRequests.type,
        subject: pastoralCareRequests.subject,
        body: pastoralCareRequests.body,
        status: pastoralCareRequests.status,
        handledAt: pastoralCareRequests.handledAt,
        createdAt: pastoralCareRequests.createdAt,
        firstName: memberProfiles.firstName,
        lastName: memberProfiles.lastName,
        profilePhotoUrl: memberProfiles.profilePhotoUrl,
        email: users.email,
        phone: users.phone,
      })
      .from(pastoralCareRequests)
      .innerJoin(
        memberProfiles,
        eq(memberProfiles.id, pastoralCareRequests.memberId),
      )
      .innerJoin(users, eq(users.id, memberProfiles.userId))
      .where(eq(pastoralCareRequests.churchId, churchId))
      .orderBy(desc(pastoralCareRequests.createdAt))
      .limit(100);
  }

  async updateCareRequestStatus(
    requestId: string,
    status: 'IN_REVIEW' | 'RESOLVED',
    actor: { id: string; churchId: string },
  ) {
    return this.database.transaction(async (transaction) => {
      const [existing] = await transaction
        .select({
          id: pastoralCareRequests.id,
          status: pastoralCareRequests.status,
        })
        .from(pastoralCareRequests)
        .where(
          and(
            eq(pastoralCareRequests.id, requestId),
            eq(pastoralCareRequests.churchId, actor.churchId),
          ),
        )
        .limit(1)
        .for('update');
      if (!existing) return null;
      if (existing.status === status) return existing;

      const now = new Date();
      const [updated] = await transaction
        .update(pastoralCareRequests)
        .set({
          status,
          handledBy: actor.id,
          handledAt: now,
          updatedAt: now,
        })
        .where(eq(pastoralCareRequests.id, requestId))
        .returning();
      await transaction.insert(auditLogs).values({
        churchId: actor.churchId,
        actorUserId: actor.id,
        action: 'PASTORAL_CARE_REQUEST_STATUS_UPDATED',
        entityType: 'PASTORAL_CARE_REQUEST',
        entityId: requestId,
        previousData: { status: existing.status },
        newData: { status },
      });
      return updated;
    });
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
