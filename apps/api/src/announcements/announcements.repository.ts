import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  and,
  count,
  desc,
  eq,
  gte,
  isNotNull,
  isNull,
  lt,
  or,
  sql,
} from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import { announcements, auditLogs, memberProfiles } from '../database/schema';
import type { ListAnnouncementsDto } from './dto/list-announcements.dto';

export type AnnouncementValues = {
  kind: 'ANNOUNCEMENT' | 'EVENT';
  title: string;
  theme: string | null;
  description: string | null;
  locationName: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  flyerUrl: string | null;
  flyerPublicId: string | null;
};

/** The moment an item is over: its end time, or its start time. */
const finishesAt = sql`coalesce(${announcements.endsAt}, ${announcements.startsAt})`;

@Injectable()
export class AnnouncementsRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async list(query: ListAnnouncementsDto, churchId: string, now: Date) {
    const filters = [
      eq(announcements.churchId, churchId),
      isNull(announcements.archivedAt),
      query.scope === 'past'
        ? and(isNotNull(announcements.startsAt), lt(finishesAt, now))!
        : or(isNull(announcements.startsAt), gte(finishesAt, now))!,
    ];
    if (query.kind) filters.push(eq(announcements.kind, query.kind));
    const where = and(...filters);

    const order =
      query.scope === 'past'
        ? [desc(announcements.startsAt)]
        : [
            sql`${announcements.startsAt} asc nulls last`,
            desc(announcements.createdAt),
          ];

    const [items, [{ total }]] = await Promise.all([
      this.selectAnnouncements()
        .where(where)
        .orderBy(...order)
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      this.database.select({ total: count() }).from(announcements).where(where),
    ]);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async findById(id: string, churchId: string) {
    const [item] = await this.selectAnnouncements()
      .where(
        and(
          eq(announcements.id, id),
          eq(announcements.churchId, churchId),
          isNull(announcements.archivedAt),
        ),
      )
      .limit(1);
    if (!item) throw new NotFoundException('Announcement not found.');
    return item;
  }

  async create(input: {
    churchId: string;
    actorUserId: string;
    values: AnnouncementValues;
  }) {
    const id = await this.database.transaction(async (transaction) => {
      const [created] = await transaction
        .insert(announcements)
        .values({
          ...input.values,
          churchId: input.churchId,
          createdBy: input.actorUserId,
          updatedBy: input.actorUserId,
        })
        .returning({ id: announcements.id });
      await transaction.insert(auditLogs).values({
        churchId: input.churchId,
        actorUserId: input.actorUserId,
        action: 'ANNOUNCEMENT_CREATED',
        entityType: 'ANNOUNCEMENT',
        entityId: created.id,
        newData: input.values,
      });
      return created.id;
    });
    return this.findById(id, input.churchId);
  }

  async update(input: {
    id: string;
    churchId: string;
    actorUserId: string;
    previous: AnnouncementValues;
    values: AnnouncementValues;
  }) {
    await this.database.transaction(async (transaction) => {
      const [updated] = await transaction
        .update(announcements)
        .set({
          ...input.values,
          updatedBy: input.actorUserId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(announcements.id, input.id),
            eq(announcements.churchId, input.churchId),
            isNull(announcements.archivedAt),
          ),
        )
        .returning({ id: announcements.id });
      if (!updated) throw new NotFoundException('Announcement not found.');
      await transaction.insert(auditLogs).values({
        churchId: input.churchId,
        actorUserId: input.actorUserId,
        action: 'ANNOUNCEMENT_UPDATED',
        entityType: 'ANNOUNCEMENT',
        entityId: input.id,
        previousData: input.previous,
        newData: input.values,
      });
    });
    return this.findById(input.id, input.churchId);
  }

  async archive(input: { id: string; churchId: string; actorUserId: string }) {
    await this.database.transaction(async (transaction) => {
      const now = new Date();
      const [archived] = await transaction
        .update(announcements)
        .set({
          archivedAt: now,
          archivedBy: input.actorUserId,
          updatedBy: input.actorUserId,
          updatedAt: now,
        })
        .where(
          and(
            eq(announcements.id, input.id),
            eq(announcements.churchId, input.churchId),
            isNull(announcements.archivedAt),
          ),
        )
        .returning({ id: announcements.id, title: announcements.title });
      if (!archived) throw new NotFoundException('Announcement not found.');
      await transaction.insert(auditLogs).values({
        churchId: input.churchId,
        actorUserId: input.actorUserId,
        action: 'ANNOUNCEMENT_ARCHIVED',
        entityType: 'ANNOUNCEMENT',
        entityId: input.id,
        metadata: { title: archived.title },
      });
    });
  }

  private selectAnnouncements() {
    return this.database
      .select({
        id: announcements.id,
        kind: announcements.kind,
        title: announcements.title,
        theme: announcements.theme,
        description: announcements.description,
        locationName: announcements.locationName,
        startsAt: announcements.startsAt,
        endsAt: announcements.endsAt,
        flyerUrl: announcements.flyerUrl,
        flyerPublicId: announcements.flyerPublicId,
        createdBy: announcements.createdBy,
        authorName: sql<
          string | null
        >`nullif(trim(concat_ws(' ', ${memberProfiles.firstName}, ${memberProfiles.lastName})), '')`,
        createdAt: announcements.createdAt,
        updatedAt: announcements.updatedAt,
      })
      .from(announcements)
      .leftJoin(
        memberProfiles,
        eq(memberProfiles.userId, announcements.createdBy),
      );
  }
}
