import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, eq, isNull } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import { departmentMembers, departments } from '../database/schema';

@Injectable()
export class DepartmentsRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  list(churchId: string) {
    return this.database
      .select({
        id: departments.id,
        name: departments.name,
        activeMemberCount: count(departmentMembers.id),
      })
      .from(departments)
      .leftJoin(
        departmentMembers,
        and(
          eq(departmentMembers.departmentId, departments.id),
          isNull(departmentMembers.leftAt),
        ),
      )
      .where(eq(departments.churchId, churchId))
      .groupBy(departments.id, departments.name)
      .orderBy(asc(departments.name));
  }
}
