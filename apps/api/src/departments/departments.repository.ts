import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { and, asc, count, eq, gt, isNull, lte, or, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import {
  auditLogs,
  departmentMembers,
  departments,
  memberProfiles,
  primaryDepartmentAssignments,
  users,
} from '../database/schema';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  list(churchId: string) {
    return this.database
      .select({
        id: departments.id,
        name: departments.name,
        slug: departments.slug,
        description: departments.description,
        isActive: departments.isActive,
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

  async create(input: {
    churchId: string;
    actorUserId: string;
    name: string;
    description?: string;
  }) {
    return this.database.transaction(async (transaction) => {
      const [duplicate] = await transaction
        .select({ id: departments.id })
        .from(departments)
        .where(
          and(
            eq(departments.churchId, input.churchId),
            sql`lower(${departments.name}) = lower(${input.name})`,
          ),
        )
        .limit(1);
      if (duplicate) {
        throw new ConflictException(
          'A department with this name already exists.',
        );
      }
      const baseSlug =
        input.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 100) || 'department';
      const [department] = await transaction
        .insert(departments)
        .values({
          churchId: input.churchId,
          name: input.name,
          slug: `${baseSlug}-${randomUUID().slice(0, 8)}`,
          description: input.description,
        })
        .returning({
          id: departments.id,
          name: departments.name,
          slug: departments.slug,
          description: departments.description,
          isActive: departments.isActive,
          createdAt: departments.createdAt,
        });
      await transaction.insert(auditLogs).values({
        churchId: input.churchId,
        actorUserId: input.actorUserId,
        action: 'DEPARTMENT_CREATED',
        entityType: 'DEPARTMENT',
        entityId: department.id,
        newData: department,
      });
      return department;
    });
  }

  async update(input: {
    departmentId: string;
    churchId: string;
    actorUserId: string;
    updates: UpdateDepartmentDto;
  }) {
    return this.database.transaction(async (transaction) => {
      const [department] = await transaction
        .select({
          id: departments.id,
          name: departments.name,
          description: departments.description,
          isActive: departments.isActive,
        })
        .from(departments)
        .where(
          and(
            eq(departments.id, input.departmentId),
            eq(departments.churchId, input.churchId),
          ),
        )
        .limit(1)
        .for('update');
      if (!department) {
        throw new NotFoundException('Department not found.');
      }
      if (
        input.updates.name !== undefined &&
        input.updates.name.toLowerCase() !== department.name.toLowerCase()
      ) {
        const [duplicate] = await transaction
          .select({ id: departments.id })
          .from(departments)
          .where(
            and(
              eq(departments.churchId, input.churchId),
              sql`lower(${departments.name}) = lower(${input.updates.name})`,
            ),
          )
          .limit(1);
        if (duplicate) {
          throw new ConflictException(
            'A department with this name already exists.',
          );
        }
      }
      const [updated] = await transaction
        .update(departments)
        .set({
          ...(input.updates.name !== undefined
            ? { name: input.updates.name }
            : {}),
          ...(input.updates.description !== undefined
            ? { description: input.updates.description }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(departments.id, department.id))
        .returning({
          id: departments.id,
          name: departments.name,
          slug: departments.slug,
          description: departments.description,
          isActive: departments.isActive,
          updatedAt: departments.updatedAt,
        });
      await transaction.insert(auditLogs).values({
        churchId: input.churchId,
        actorUserId: input.actorUserId,
        action: 'DEPARTMENT_UPDATED',
        entityType: 'DEPARTMENT',
        entityId: department.id,
        previousData: department,
        newData: updated,
      });
      return updated;
    });
  }

  async deactivate(input: {
    departmentId: string;
    churchId: string;
    actorUserId: string;
  }): Promise<void> {
    await this.database.transaction(async (transaction) => {
      const [department] = await transaction
        .select({
          id: departments.id,
          name: departments.name,
          isActive: departments.isActive,
        })
        .from(departments)
        .where(
          and(
            eq(departments.id, input.departmentId),
            eq(departments.churchId, input.churchId),
          ),
        )
        .limit(1)
        .for('update');
      if (!department) {
        throw new NotFoundException('Department not found.');
      }
      if (!department.isActive) {
        throw new ConflictException('This department is already inactive.');
      }
      const now = new Date();
      await transaction
        .update(departments)
        .set({ isActive: false, updatedAt: now })
        .where(eq(departments.id, department.id));
      await transaction.insert(auditLogs).values({
        churchId: input.churchId,
        actorUserId: input.actorUserId,
        action: 'DEPARTMENT_DEACTIVATED',
        entityType: 'DEPARTMENT',
        entityId: department.id,
        previousData: { isActive: true },
        newData: { isActive: false },
      });
    });
  }

  async addMember(input: {
    departmentId: string;
    churchId: string;
    actorUserId: string;
    memberId: string;
    makePrimary: boolean;
    joinedAt?: string;
  }) {
    return this.database.transaction(async (transaction) => {
      const [department] = await transaction
        .select({ id: departments.id })
        .from(departments)
        .where(
          and(
            eq(departments.id, input.departmentId),
            eq(departments.churchId, input.churchId),
            eq(departments.isActive, true),
          ),
        )
        .limit(1);
      if (!department) {
        throw new NotFoundException('Active department not found.');
      }
      const [member] = await transaction
        .select({ id: memberProfiles.id })
        .from(memberProfiles)
        .innerJoin(users, eq(users.id, memberProfiles.userId))
        .where(
          and(
            eq(memberProfiles.id, input.memberId),
            eq(users.churchId, input.churchId),
            sql`${memberProfiles.membershipStatus} <> 'ARCHIVED'`,
          ),
        )
        .limit(1);
      if (!member) {
        throw new NotFoundException('Member not found.');
      }
      const joinedAt = input.joinedAt ?? new Date().toISOString().slice(0, 10);
      const [overlap] = await transaction
        .select({ id: departmentMembers.id })
        .from(departmentMembers)
        .where(
          and(
            eq(departmentMembers.departmentId, department.id),
            eq(departmentMembers.memberId, member.id),
            or(
              isNull(departmentMembers.leftAt),
              gt(departmentMembers.leftAt, joinedAt),
            ),
          ),
        )
        .limit(1)
        .for('update');
      if (overlap) {
        throw new ConflictException(
          'This membership overlaps an existing department membership.',
        );
      }
      const [membership] = await transaction
        .insert(departmentMembers)
        .values({
          departmentId: department.id,
          memberId: member.id,
          joinedAt,
          assignedBy: input.actorUserId,
        })
        .returning({ id: departmentMembers.id });

      if (input.makePrimary) {
        const [currentPrimary] = await transaction
          .select({
            id: primaryDepartmentAssignments.id,
            startsAt: primaryDepartmentAssignments.startsAt,
          })
          .from(primaryDepartmentAssignments)
          .where(
            and(
              eq(primaryDepartmentAssignments.memberId, member.id),
              isNull(primaryDepartmentAssignments.endsAt),
            ),
          )
          .limit(1)
          .for('update');
        if (currentPrimary) {
          if (currentPrimary.startsAt > joinedAt) {
            throw new ConflictException(
              'The new primary date precedes an existing primary assignment.',
            );
          }
          await transaction
            .update(primaryDepartmentAssignments)
            .set({
              endsAt: joinedAt,
              endedBy: input.actorUserId,
              endReason: 'Primary department changed.',
              updatedAt: new Date(),
            })
            .where(eq(primaryDepartmentAssignments.id, currentPrimary.id));
        }
        await transaction.insert(primaryDepartmentAssignments).values({
          memberId: member.id,
          departmentMembershipId: membership.id,
          startsAt: joinedAt,
          assignedBy: input.actorUserId,
        });
      }
      await transaction.insert(auditLogs).values({
        churchId: input.churchId,
        actorUserId: input.actorUserId,
        action: 'DEPARTMENT_MEMBER_ADDED',
        entityType: 'DEPARTMENT_MEMBERSHIP',
        entityId: membership.id,
        newData: {
          departmentId: department.id,
          memberId: member.id,
          joinedAt,
          makePrimary: input.makePrimary,
        },
      });
      return { id: membership.id, joinedAt, isPrimary: input.makePrimary };
    });
  }

  async endMembership(input: {
    departmentId: string;
    membershipId: string;
    churchId: string;
    actorUserId: string;
    leftAt?: string;
    reason: string;
    replacementPrimaryMembershipId?: string | null;
  }) {
    return this.database.transaction(async (transaction) => {
      const [membership] = await transaction
        .select({
          id: departmentMembers.id,
          memberId: departmentMembers.memberId,
          joinedAt: departmentMembers.joinedAt,
          leftAt: departmentMembers.leftAt,
          endReason: departmentMembers.endReason,
        })
        .from(departmentMembers)
        .innerJoin(
          departments,
          and(
            eq(departments.id, departmentMembers.departmentId),
            eq(departments.churchId, input.churchId),
          ),
        )
        .where(
          and(
            eq(departmentMembers.id, input.membershipId),
            eq(departmentMembers.departmentId, input.departmentId),
          ),
        )
        .limit(1)
        .for('update');
      if (!membership) {
        throw new NotFoundException('Department membership not found.');
      }
      const leftAt = input.leftAt ?? new Date().toISOString().slice(0, 10);
      if (membership.leftAt) {
        if (
          membership.leftAt === leftAt &&
          membership.endReason === input.reason
        ) {
          return { id: membership.id, leftAt: membership.leftAt };
        }
        throw new ConflictException(
          'This department membership has already ended.',
        );
      }
      if (leftAt <= membership.joinedAt) {
        throw new BadRequestException(
          'The membership end date must be later than its joined date.',
        );
      }

      const dependentAssignments = await transaction
        .select({
          id: primaryDepartmentAssignments.id,
          startsAt: primaryDepartmentAssignments.startsAt,
          endsAt: primaryDepartmentAssignments.endsAt,
        })
        .from(primaryDepartmentAssignments)
        .where(
          and(
            eq(
              primaryDepartmentAssignments.departmentMembershipId,
              membership.id,
            ),
            or(
              isNull(primaryDepartmentAssignments.endsAt),
              gt(primaryDepartmentAssignments.endsAt, leftAt),
            ),
          ),
        )
        .for('update');
      if (
        dependentAssignments.some((assignment) => assignment.startsAt > leftAt)
      ) {
        throw new ConflictException(
          'A future primary assignment must be changed before ending this membership.',
        );
      }
      let replacement:
        | {
            id: string;
            memberId: string;
            joinedAt: string;
            leftAt: string | null;
          }
        | undefined;
      if (input.replacementPrimaryMembershipId) {
        [replacement] = await transaction
          .select({
            id: departmentMembers.id,
            memberId: departmentMembers.memberId,
            joinedAt: departmentMembers.joinedAt,
            leftAt: departmentMembers.leftAt,
          })
          .from(departmentMembers)
          .where(
            and(
              eq(departmentMembers.id, input.replacementPrimaryMembershipId),
              eq(departmentMembers.memberId, membership.memberId),
              lte(departmentMembers.joinedAt, leftAt),
              or(
                isNull(departmentMembers.leftAt),
                gt(departmentMembers.leftAt, leftAt),
              ),
            ),
          )
          .limit(1)
          .for('update');
        if (!replacement || replacement.id === membership.id) {
          throw new BadRequestException(
            'The replacement primary membership is not valid.',
          );
        }
      }
      const now = new Date();
      await transaction
        .update(departmentMembers)
        .set({
          leftAt,
          endedBy: input.actorUserId,
          endReason: input.reason,
          updatedAt: now,
        })
        .where(eq(departmentMembers.id, membership.id));
      for (const assignment of dependentAssignments) {
        await transaction
          .update(primaryDepartmentAssignments)
          .set({
            endsAt: leftAt,
            endedBy: input.actorUserId,
            endReason: input.reason,
            updatedAt: now,
          })
          .where(eq(primaryDepartmentAssignments.id, assignment.id));
      }
      if (replacement) {
        await transaction.insert(primaryDepartmentAssignments).values({
          memberId: membership.memberId,
          departmentMembershipId: replacement.id,
          startsAt: leftAt,
          assignedBy: input.actorUserId,
        });
      }
      await transaction.insert(auditLogs).values({
        churchId: input.churchId,
        actorUserId: input.actorUserId,
        action: 'DEPARTMENT_MEMBERSHIP_ENDED',
        entityType: 'DEPARTMENT_MEMBERSHIP',
        entityId: membership.id,
        previousData: { leftAt: null },
        newData: {
          leftAt,
          reason: input.reason,
          replacementPrimaryMembershipId:
            input.replacementPrimaryMembershipId ?? null,
        },
      });
      return { id: membership.id, leftAt };
    });
  }
}
