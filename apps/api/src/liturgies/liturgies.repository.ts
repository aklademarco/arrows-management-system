import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import { auditLogs, liturgyTemplateItems, liturgyTemplates } from '../database/schema';

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
}
