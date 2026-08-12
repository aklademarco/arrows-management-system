import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, gt, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import { auditLogs, departmentMembers, departments, eventLiturgies, eventLiturgyItems, events, liturgyTemplateItems, liturgyTemplates, memberProfiles } from '../database/schema';
import type { GenerateEventLiturgyDto } from './dto/generate-event-liturgy.dto';

type DefaultItem = {
  title: string;
  duration: number;
  owner?: string;
  notes?: string;
};

const NORMAL_SERVICE: DefaultItem[] = [
  { title: 'Prayers', duration: 20, owner: 'Prayer leader' },
  { title: 'Praises', duration: 15, owner: 'Choir' },
  { title: 'Worship / Congregational Song', duration: 15, owner: 'Choir' },
  { title: 'Testimony and Exhortation', duration: 15 },
  { title: 'Song Ministration', duration: 10, owner: 'Choir' },
  { title: 'Word Ministration', duration: 55, owner: 'Preacher' },
  { title: 'Tithes, Offertory and Ghana Prayers', duration: 30 },
  { title: 'Bible Study', duration: 30 },
  { title: 'Announcements', duration: 5, owner: 'General Secretary' },
];

const DAY_OF_TRUMPETS: DefaultItem[] = [
  { title: 'Prayers', duration: 20, owner: 'Prayer leader' },
  { title: 'Praises', duration: 20, owner: 'Choir' },
  { title: 'Worship / Adoration Moment', duration: 30 },
  { title: 'Testimony', duration: 10 },
  { title: 'Song Ministration / Project Offering', duration: 10, owner: 'Choir' },
  { title: 'Word Ministration', duration: 40, owner: 'Preacher' },
  { title: 'Tithes, Offertory and Ghana Prayers', duration: 55 },
  { title: 'Announcements', duration: 5, owner: 'General Secretary' },
  { title: 'Benediction', duration: 10, owner: 'Youth Pastor or Preacher' },
];

@Injectable()
export class LiturgiesRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async ensureSundayDefaults(churchId: string, actorUserId: string) {
    const definitions = [
      { name: 'Normal Sunday Service', description: 'Used every Sunday unless a higher-priority or event-specific service applies.', recurrenceRule: 'EVERY_SUNDAY', priority: 10, isDefault: true, items: NORMAL_SERVICE },
      { name: 'Day of Trumpets', description: 'Automatically takes priority on the first Sunday of every month.', recurrenceRule: 'FIRST_SUNDAY', priority: 100, isDefault: false, items: DAY_OF_TRUMPETS },
    ] as const;
    await this.database.transaction(async (transaction) => {
      const existing = await transaction.select({ id: liturgyTemplates.id, name: liturgyTemplates.name })
        .from(liturgyTemplates)
        .where(and(eq(liturgyTemplates.churchId, churchId), inArray(liturgyTemplates.name, definitions.map((item) => item.name))));
      for (const definition of definitions) {
        if (existing.some((item) => item.name === definition.name)) continue;
        const [template] = await transaction.insert(liturgyTemplates).values({
          churchId,
          createdBy: actorUserId,
          name: definition.name,
          description: definition.description,
          recurrenceRule: definition.recurrenceRule,
          priority: definition.priority,
          isDefault: definition.isDefault,
        }).returning({ id: liturgyTemplates.id });
        let offset = 0;
        await transaction.insert(liturgyTemplateItems).values(definition.items.map((item, index) => {
          const row = {
            templateId: template.id,
            position: index + 1,
            title: item.title,
            plannedOffsetMinutes: offset,
            plannedDurationMinutes: item.duration,
            ownerLabel: item.owner,
            notes: item.notes,
          };
          offset += item.duration;
          return row;
        }));
        await transaction.insert(auditLogs).values({
          churchId,
          actorUserId,
          action: 'LITURGY_TEMPLATE_CREATED',
          entityType: 'LITURGY_TEMPLATE',
          entityId: template.id,
          newData: { name: definition.name, recurrenceRule: definition.recurrenceRule, itemCount: definition.items.length },
        });
      }
    });
  }

  async listTemplates(churchId: string) {
    const templates = await this.database.select({
      id: liturgyTemplates.id,
      name: liturgyTemplates.name,
      description: liturgyTemplates.description,
      recurrenceRule: liturgyTemplates.recurrenceRule,
      priority: liturgyTemplates.priority,
      isDefault: liturgyTemplates.isDefault,
      isActive: liturgyTemplates.isActive,
    }).from(liturgyTemplates).where(eq(liturgyTemplates.churchId, churchId)).orderBy(asc(liturgyTemplates.name));
    const templateIds = templates.map((template) => template.id);
    const items = templateIds.length ? await this.database.select({
      id: liturgyTemplateItems.id,
      templateId: liturgyTemplateItems.templateId,
      position: liturgyTemplateItems.position,
      title: liturgyTemplateItems.title,
      plannedOffsetMinutes: liturgyTemplateItems.plannedOffsetMinutes,
      plannedDurationMinutes: liturgyTemplateItems.plannedDurationMinutes,
      ownerLabel: liturgyTemplateItems.ownerLabel,
      notes: liturgyTemplateItems.notes,
      showOnProjection: liturgyTemplateItems.showOnProjection,
    }).from(liturgyTemplateItems).where(inArray(liturgyTemplateItems.templateId, templateIds)).orderBy(asc(liturgyTemplateItems.position)) : [];
    return templates.map((template) => ({ ...template, items: items.filter((item) => item.templateId === template.id) }));
  }

  async eventLiturgy(eventId: string, churchId: string) {
    const [liturgy] = await this.database.select({
      id: eventLiturgies.id,
      eventId: eventLiturgies.eventId,
      sourceTemplateId: eventLiturgies.sourceTemplateId,
      preacherName: eventLiturgies.preacherName,
      sermonTitle: eventLiturgies.sermonTitle,
      preacherImageUrl: eventLiturgies.preacherImageUrl,
      projectionEnabled: eventLiturgies.projectionEnabled,
      startedAt: eventLiturgies.startedAt,
      completedAt: eventLiturgies.completedAt,
      eventName: events.name,
      eventStartsAt: events.startsAt,
      eventEndsAt: events.endsAt,
    }).from(eventLiturgies).innerJoin(events, eq(events.id, eventLiturgies.eventId))
      .where(and(eq(eventLiturgies.eventId, eventId), eq(events.churchId, churchId))).limit(1);
    if (!liturgy) return null;
    const items = await this.database.select().from(eventLiturgyItems)
      .where(eq(eventLiturgyItems.liturgyId, liturgy.id)).orderBy(asc(eventLiturgyItems.position));
    return { ...liturgy, items };
  }

  async generateEventLiturgy(input: GenerateEventLiturgyDto & { eventId: string; churchId: string; actorUserId: string }) {
    return this.database.transaction(async (transaction) => {
      const [event] = await transaction.select({ id: events.id, startsAt: events.startsAt })
        .from(events).where(and(eq(events.id, input.eventId), eq(events.churchId, input.churchId))).limit(1);
      if (!event) throw new NotFoundException('Event not found.');
      const [existing] = await transaction.select({ id: eventLiturgies.id }).from(eventLiturgies)
        .where(eq(eventLiturgies.eventId, input.eventId)).limit(1);
      if (existing) throw new ConflictException('This event already has a liturgy.');
      let template;
      if (input.templateId) {
        [template] = await transaction.select().from(liturgyTemplates).where(and(
          eq(liturgyTemplates.id, input.templateId),
          eq(liturgyTemplates.churchId, input.churchId),
          eq(liturgyTemplates.isActive, true),
        )).limit(1);
      } else {
        const local = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Accra', weekday: 'short', day: 'numeric' }).formatToParts(event.startsAt);
        const isFirstSunday = local.find((part) => part.type === 'weekday')?.value === 'Sun' && Number(local.find((part) => part.type === 'day')?.value) <= 7;
        const candidates = await transaction.select().from(liturgyTemplates).where(and(
          eq(liturgyTemplates.churchId, input.churchId),
          eq(liturgyTemplates.isActive, true),
          inArray(liturgyTemplates.recurrenceRule, isFirstSunday ? ['FIRST_SUNDAY', 'EVERY_SUNDAY'] : ['EVERY_SUNDAY']),
        ));
        template = candidates.sort((a, b) => b.priority - a.priority)[0];
      }
      if (!template) throw new NotFoundException('No applicable liturgy template was found.');
      const templateItems = await transaction.select().from(liturgyTemplateItems)
        .where(eq(liturgyTemplateItems.templateId, template.id)).orderBy(asc(liturgyTemplateItems.position));
      const [liturgy] = await transaction.insert(eventLiturgies).values({
        eventId: event.id,
        sourceTemplateId: template.id,
        preacherName: input.preacherName?.trim() || undefined,
        sermonTitle: input.sermonTitle?.trim() || undefined,
        preacherImageUrl: input.preacherImageUrl,
        preacherImagePublicId: input.preacherImagePublicId,
        createdBy: input.actorUserId,
      }).returning();
      const items = await transaction.insert(eventLiturgyItems).values(templateItems.map((item) => ({
        liturgyId: liturgy.id,
        position: item.position,
        title: item.title,
        plannedStartAt: new Date(event.startsAt.getTime() + item.plannedOffsetMinutes * 60_000),
        plannedDurationMinutes: item.plannedDurationMinutes,
        ownerLabel: item.ownerLabel,
        notes: item.notes,
        showOnProjection: item.showOnProjection,
      }))).returning();
      await transaction.insert(auditLogs).values({
        churchId: input.churchId,
        actorUserId: input.actorUserId,
        action: 'EVENT_LITURGY_GENERATED',
        entityType: 'EVENT_LITURGY',
        entityId: liturgy.id,
        newData: { eventId: event.id, templateId: template.id, preacherName: input.preacherName, itemCount: items.length },
      });
      return { ...liturgy, items };
    });
  }

  async isActiveMediaMember(userId: string, churchId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const [membership] = await this.database.select({ id: departmentMembers.id })
      .from(departmentMembers)
      .innerJoin(memberProfiles, eq(memberProfiles.id, departmentMembers.memberId))
      .innerJoin(departments, eq(departments.id, departmentMembers.departmentId))
      .where(and(
        eq(memberProfiles.userId, userId),
        eq(departments.churchId, churchId),
        eq(departments.isActive, true),
        sql`lower(${departments.name}) like '%media%'`,
        lte(departmentMembers.joinedAt, today),
        or(isNull(departmentMembers.leftAt), gt(departmentMembers.leftAt, today)),
      )).limit(1);
    return Boolean(membership);
  }

  async controlItem(input: {
    itemId: string;
    churchId: string;
    actorUserId: string;
    action: 'START' | 'PAUSE' | 'RESUME' | 'EXTEND' | 'SKIP' | 'COMPLETE';
    extensionMinutes?: number;
  }) {
    return this.database.transaction(async (transaction) => {
      const [current] = await transaction.select({
        id: eventLiturgyItems.id,
        liturgyId: eventLiturgyItems.liturgyId,
        position: eventLiturgyItems.position,
        status: eventLiturgyItems.status,
        pausedAt: eventLiturgyItems.pausedAt,
        accumulatedPauseSeconds: eventLiturgyItems.accumulatedPauseSeconds,
        plannedDurationMinutes: eventLiturgyItems.plannedDurationMinutes,
      }).from(eventLiturgyItems)
        .innerJoin(eventLiturgies, eq(eventLiturgies.id, eventLiturgyItems.liturgyId))
        .innerJoin(events, eq(events.id, eventLiturgies.eventId))
        .where(and(eq(eventLiturgyItems.id, input.itemId), eq(events.churchId, input.churchId)))
        .limit(1).for('update');
      if (!current) throw new NotFoundException('Liturgy item not found.');
      const now = new Date();
      const updates: Partial<typeof eventLiturgyItems.$inferInsert> = { timingUpdatedBy: input.actorUserId, updatedAt: now };
      let advance = false;
      switch (input.action) {
        case 'START': {
          if (current.status !== 'PENDING') throw new ConflictException('Only a pending activity can be started.');
          const [running] = await transaction.select({ id: eventLiturgyItems.id }).from(eventLiturgyItems)
            .where(and(eq(eventLiturgyItems.liturgyId, current.liturgyId), inArray(eventLiturgyItems.status, ['ACTIVE', 'PAUSED']))).limit(1);
          if (running) throw new ConflictException('Complete or skip the current activity first.');
          Object.assign(updates, { status: 'ACTIVE' as const, actualStartedAt: now });
          await transaction.update(eventLiturgies).set({ startedAt: now, updatedAt: now })
            .where(and(eq(eventLiturgies.id, current.liturgyId), isNull(eventLiturgies.startedAt)));
          break;
        }
        case 'PAUSE':
          if (current.status !== 'ACTIVE') throw new ConflictException('Only an active activity can be paused.');
          Object.assign(updates, { status: 'PAUSED' as const, pausedAt: now });
          break;
        case 'RESUME':
          if (current.status !== 'PAUSED' || !current.pausedAt) throw new ConflictException('Only a paused activity can be resumed.');
          Object.assign(updates, {
            status: 'ACTIVE' as const,
            pausedAt: null,
            accumulatedPauseSeconds: current.accumulatedPauseSeconds + Math.max(0, Math.floor((now.getTime() - current.pausedAt.getTime()) / 1000)),
          });
          break;
        case 'EXTEND':
          if (!['PENDING', 'ACTIVE', 'PAUSED'].includes(current.status)) throw new ConflictException('This activity can no longer be extended.');
          updates.plannedDurationMinutes = current.plannedDurationMinutes + (input.extensionMinutes ?? 0);
          break;
        case 'SKIP':
          if (!['PENDING', 'ACTIVE', 'PAUSED'].includes(current.status)) throw new ConflictException('This activity can no longer be skipped.');
          Object.assign(updates, { status: 'SKIPPED' as const, skippedAt: now, pausedAt: null });
          advance = current.status !== 'PENDING';
          break;
        case 'COMPLETE':
          if (!['ACTIVE', 'PAUSED'].includes(current.status)) throw new ConflictException('Start the activity before completing it.');
          Object.assign(updates, { status: 'COMPLETED' as const, actualCompletedAt: now, pausedAt: null });
          advance = true;
          break;
      }
      const [updated] = await transaction.update(eventLiturgyItems).set(updates)
        .where(eq(eventLiturgyItems.id, current.id)).returning();
      let nextItemId: string | null = null;
      if (advance) {
        const [next] = await transaction.select({ id: eventLiturgyItems.id }).from(eventLiturgyItems)
          .where(and(eq(eventLiturgyItems.liturgyId, current.liturgyId), gt(eventLiturgyItems.position, current.position), eq(eventLiturgyItems.status, 'PENDING')))
          .orderBy(asc(eventLiturgyItems.position)).limit(1).for('update');
        if (next) {
          nextItemId = next.id;
          await transaction.update(eventLiturgyItems).set({ status: 'ACTIVE', actualStartedAt: now, timingUpdatedBy: input.actorUserId, updatedAt: now }).where(eq(eventLiturgyItems.id, next.id));
        } else {
          await transaction.update(eventLiturgies).set({ completedAt: now, updatedAt: now }).where(eq(eventLiturgies.id, current.liturgyId));
        }
      }
      await transaction.insert(auditLogs).values({
        churchId: input.churchId,
        actorUserId: input.actorUserId,
        action: `LITURGY_ITEM_${input.action}`,
        entityType: 'EVENT_LITURGY_ITEM',
        entityId: current.id,
        previousData: { status: current.status, plannedDurationMinutes: current.plannedDurationMinutes },
        newData: { status: updated.status, plannedDurationMinutes: updated.plannedDurationMinutes, nextItemId },
      });
      return { ...updated, nextItemId };
    });
  }
}
