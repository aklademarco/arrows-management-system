import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, ilike, lt } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import { auditLogs, users } from '../database/schema';
import type { ListAuditLogsDto } from './dto/list-audit-logs.dto';

@Injectable()
export class AuditLogsRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async list(churchId: string, query: ListAuditLogsDto) {
    const filters = [eq(auditLogs.churchId, churchId)];
    if (query.action)
      filters.push(ilike(auditLogs.action, `%${query.action.trim()}%`));
    if (query.entityType)
      filters.push(ilike(auditLogs.entityType, `%${query.entityType.trim()}%`));
    if (query.from)
      filters.push(
        gte(auditLogs.createdAt, new Date(`${query.from}T00:00:00Z`)),
      );
    if (query.to) {
      const end = new Date(`${query.to}T00:00:00Z`);
      end.setUTCDate(end.getUTCDate() + 1);
      filters.push(lt(auditLogs.createdAt, end));
    }
    const where = and(...filters);
    const [items, [{ total }]] = await Promise.all([
      this.database
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          entityType: auditLogs.entityType,
          entityId: auditLogs.entityId,
          actorUserId: auditLogs.actorUserId,
          actorEmail: users.email,
          previousData: auditLogs.previousData,
          newData: auditLogs.newData,
          metadata: auditLogs.metadata,
          requestedIp: auditLogs.requestedIp,
          userAgent: auditLogs.userAgent,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .leftJoin(users, eq(users.id, auditLogs.actorUserId))
        .where(where)
        .orderBy(desc(auditLogs.createdAt))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      this.database.select({ total: count() }).from(auditLogs).where(where),
    ]);
    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }
}
