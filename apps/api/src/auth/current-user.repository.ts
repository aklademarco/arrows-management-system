import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull, lte, or, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import {
  departmentMembers,
  departments,
  memberProfiles,
  primaryDepartmentAssignments,
  roles,
  userRoles,
  users,
} from '../database/schema';

export type CurrentAccount = {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
  phone: string | null;
  accountStatus: string;
  roles: string[];
  memberProfile: {
    id: string;
    firstName: string;
    lastName: string;
    primaryDepartment: { id: string; name: string } | null;
  } | null;
};

@Injectable()
export class CurrentUserRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async findAccount(userId: string): Promise<CurrentAccount | null> {
    const [account] = await this.database
      .select({
        id: users.id,
        email: users.email,
        emailVerifiedAt: users.emailVerifiedAt,
        phone: users.phone,
        accountStatus: users.accountStatus,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!account) {
      return null;
    }

    const assignedRoles = await this.database
      .select({ name: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(eq(userRoles.userId, userId));

    const [profile] = await this.database
      .select({
        id: memberProfiles.id,
        firstName: memberProfiles.firstName,
        lastName: memberProfiles.lastName,
      })
      .from(memberProfiles)
      .where(eq(memberProfiles.userId, userId))
      .limit(1);

    let primaryDepartment: { id: string; name: string } | null = null;
    if (profile) {
      const today = new Date().toISOString().slice(0, 10);
      const [primary] = await this.database
        .select({ id: departments.id, name: departments.name })
        .from(primaryDepartmentAssignments)
        .innerJoin(
          departmentMembers,
          eq(
            departmentMembers.id,
            primaryDepartmentAssignments.departmentMembershipId,
          ),
        )
        .innerJoin(
          departments,
          eq(departments.id, departmentMembers.departmentId),
        )
        .where(
          and(
            eq(primaryDepartmentAssignments.memberId, profile.id),
            lte(primaryDepartmentAssignments.startsAt, today),
            or(
              isNull(primaryDepartmentAssignments.endsAt),
              gt(primaryDepartmentAssignments.endsAt, today),
            ),
          ),
        )
        .orderBy(sql`${primaryDepartmentAssignments.startsAt} desc`)
        .limit(1);
      primaryDepartment = primary ?? null;
    }

    return {
      ...account,
      roles: assignedRoles.map((role) => role.name),
      memberProfile: profile
        ? {
            id: profile.id,
            firstName: profile.firstName,
            lastName: profile.lastName,
            primaryDepartment,
          }
        : null,
    };
  }
}
