import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import { auditLogs, eventLiturgies, eventLiturgyItems, events, liturgyTemplateItems, liturgyTemplates } from '../database/schema';
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
}
