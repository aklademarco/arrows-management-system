import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  asc,
  count,
  eq,
  gt,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import {
  auditLogs,
  departmentLeaders,
  departmentMembers,
  departments,
  memberProfiles,
  primaryDepartmentAssignments,
  users,
} from '../database/schema';
import { ListMembersDto } from './dto/list-members.dto';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  /**
   * Department IDs the given user currently leads within their church. A term
   * counts when it is not revoked and today falls inside its half-open range.
   */
  async findLedDepartmentIds(
    userId: string,
    churchId: string,
  ): Promise<string[]> {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await this.database
      .selectDistinct({ departmentId: departmentLeaders.departmentId })
      .from(departmentLeaders)
      .innerJoin(
        memberProfiles,
        eq(memberProfiles.id, departmentLeaders.memberId),
      )
      .innerJoin(
        departments,
        eq(departments.id, departmentLeaders.departmentId),
      )
      .where(
        and(
          eq(memberProfiles.userId, userId),
          eq(departments.churchId, churchId),
          isNull(departmentLeaders.revokedAt),
          lte(departmentLeaders.startsAt, today),
          or(
            isNull(departmentLeaders.endsAt),
            sql`${departmentLeaders.endsAt} >= ${today}`,
          ),
        ),
      );
    return rows.map((row) => row.departmentId);
  }

  async findOwnProfile(userId: string, churchId: string) {
    const [member] = await this.database
      .select({
        id: memberProfiles.id,
        firstName: memberProfiles.firstName,
        lastName: memberProfiles.lastName,
        otherNames: memberProfiles.otherNames,
        membershipStatus: memberProfiles.membershipStatus,
        email: users.email,
        phone: users.phone,
      })
      .from(memberProfiles)
      .innerJoin(users, eq(users.id, memberProfiles.userId))
      .where(and(eq(users.id, userId), eq(users.churchId, churchId)))
      .limit(1);
    if (!member) {
      throw new NotFoundException('Member profile not found.');
    }
    return member;
  }

  async list(
    query: ListMembersDto,
    churchId: string,
    restrictToDepartmentIds?: string[],
  ) {
    const filters = [eq(users.churchId, churchId)];
    if (restrictToDepartmentIds) {
      const scopedMemberIds = this.database
        .select({ id: departmentMembers.memberId })
        .from(departmentMembers)
        .where(
          and(
            inArray(departmentMembers.departmentId, restrictToDepartmentIds),
            isNull(departmentMembers.leftAt),
          ),
        );
      filters.push(inArray(memberProfiles.id, scopedMemberIds));
    }
    if (query.accountStatus) {
      filters.push(eq(users.accountStatus, query.accountStatus));
    } else {
      filters.push(
        or(
          eq(users.accountStatus, 'ACTIVE'),
          eq(users.accountStatus, 'SUSPENDED'),
        )!,
      );
    }
    if (query.membershipStatus) {
      filters.push(eq(memberProfiles.membershipStatus, query.membershipStatus));
    }
    const search = query.search?.trim();
    if (search) {
      const pattern = `%${search}%`;
      filters.push(
        or(
          ilike(users.email, pattern),
          ilike(users.phone, pattern),
          ilike(memberProfiles.firstName, pattern),
          ilike(memberProfiles.lastName, pattern),
          ilike(memberProfiles.otherNames, pattern),
        )!,
      );
    }
    if (query.departmentId) {
      const memberIds = this.database
        .select({ id: departmentMembers.memberId })
        .from(departmentMembers)
        .where(
          and(
            eq(departmentMembers.departmentId, query.departmentId),
            isNull(departmentMembers.leftAt),
          ),
        );
      filters.push(inArray(memberProfiles.id, memberIds));
    }

    const where = and(...filters);
    const [items, [{ total }]] = await Promise.all([
      this.database
        .select({
          id: memberProfiles.id,
          userId: users.id,
          firstName: memberProfiles.firstName,
          lastName: memberProfiles.lastName,
          otherNames: memberProfiles.otherNames,
          email: users.email,
          phone: users.phone,
          accountStatus: users.accountStatus,
          membershipStatus: memberProfiles.membershipStatus,
          createdAt: memberProfiles.createdAt,
        })
        .from(memberProfiles)
        .innerJoin(users, eq(users.id, memberProfiles.userId))
        .where(where)
        .orderBy(asc(memberProfiles.lastName), asc(memberProfiles.firstName))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      this.database
        .select({ total: count() })
        .from(memberProfiles)
        .innerJoin(users, eq(users.id, memberProfiles.userId))
        .where(where),
    ]);

    const ids = items.map((member) => member.id);
    const memberships =
      ids.length === 0
        ? []
        : await this.database
            .select({
              memberId: departmentMembers.memberId,
              departmentId: departments.id,
              departmentName: departments.name,
              primaryAssignmentId: primaryDepartmentAssignments.id,
            })
            .from(departmentMembers)
            .innerJoin(
              departments,
              eq(departments.id, departmentMembers.departmentId),
            )
            .leftJoin(
              primaryDepartmentAssignments,
              and(
                eq(
                  primaryDepartmentAssignments.departmentMembershipId,
                  departmentMembers.id,
                ),
                isNull(primaryDepartmentAssignments.endsAt),
              ),
            )
            .where(
              and(
                inArray(departmentMembers.memberId, ids),
                isNull(departmentMembers.leftAt),
              ),
            );

    return {
      items: items.map((member) => ({
        ...member,
        departments: memberships
          .filter((membership) => membership.memberId === member.id)
          .map((membership) => ({
            id: membership.departmentId,
            name: membership.departmentName,
            isPrimary: membership.primaryAssignmentId !== null,
          })),
      })),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async findById(
    memberId: string,
    churchId: string,
    restrictToDepartmentIds?: string[],
  ) {
    const scopeFilter =
      restrictToDepartmentIds &&
      inArray(
        memberProfiles.id,
        this.database
          .select({ id: departmentMembers.memberId })
          .from(departmentMembers)
          .where(
            and(
              inArray(departmentMembers.departmentId, restrictToDepartmentIds),
              isNull(departmentMembers.leftAt),
            ),
          ),
      );
    const [member] = await this.database
      .select({
        id: memberProfiles.id,
        userId: users.id,
        firstName: memberProfiles.firstName,
        lastName: memberProfiles.lastName,
        otherNames: memberProfiles.otherNames,
        email: users.email,
        phone: users.phone,
        accountStatus: users.accountStatus,
        membershipStatus: memberProfiles.membershipStatus,
        emailVerifiedAt: users.emailVerifiedAt,
        createdAt: memberProfiles.createdAt,
        updatedAt: memberProfiles.updatedAt,
      })
      .from(memberProfiles)
      .innerJoin(users, eq(users.id, memberProfiles.userId))
      .where(
        and(
          eq(memberProfiles.id, memberId),
          eq(users.churchId, churchId),
          ...(scopeFilter ? [scopeFilter] : []),
        ),
      )
      .limit(1);
    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    const memberships = await this.database
      .select({
        id: departmentMembers.id,
        departmentId: departments.id,
        departmentName: departments.name,
        joinedAt: departmentMembers.joinedAt,
        leftAt: departmentMembers.leftAt,
        primaryAssignmentId: primaryDepartmentAssignments.id,
        primaryStartsAt: primaryDepartmentAssignments.startsAt,
        primaryEndsAt: primaryDepartmentAssignments.endsAt,
      })
      .from(departmentMembers)
      .innerJoin(
        departments,
        eq(departments.id, departmentMembers.departmentId),
      )
      .leftJoin(
        primaryDepartmentAssignments,
        eq(
          primaryDepartmentAssignments.departmentMembershipId,
          departmentMembers.id,
        ),
      )
      .where(eq(departmentMembers.memberId, member.id))
      .orderBy(asc(departmentMembers.joinedAt));

    return {
      ...member,
      departmentMemberships: memberships.map((membership) => ({
        ...membership,
        isActive: membership.leftAt === null,
        isPrimary:
          membership.primaryAssignmentId !== null &&
          membership.primaryEndsAt === null,
      })),
    };
  }

  async updateOwnProfile(input: {
    userId: string;
    churchId: string;
    updates: UpdateOwnProfileDto;
  }) {
    try {
      return await this.database.transaction(async (transaction) => {
        const [member] = await transaction
          .select({
            id: memberProfiles.id,
            firstName: memberProfiles.firstName,
            lastName: memberProfiles.lastName,
            otherNames: memberProfiles.otherNames,
            phone: users.phone,
          })
          .from(memberProfiles)
          .innerJoin(users, eq(users.id, memberProfiles.userId))
          .where(
            and(eq(users.id, input.userId), eq(users.churchId, input.churchId)),
          )
          .limit(1)
          .for('update');
        if (!member) {
          throw new NotFoundException('Member profile not found.');
        }

        const now = new Date();
        const profileUpdates = {
          ...(input.updates.firstName !== undefined
            ? { firstName: input.updates.firstName }
            : {}),
          ...(input.updates.lastName !== undefined
            ? { lastName: input.updates.lastName }
            : {}),
          ...(input.updates.otherNames !== undefined
            ? { otherNames: input.updates.otherNames }
            : {}),
          updatedAt: now,
        };
        await transaction
          .update(memberProfiles)
          .set(profileUpdates)
          .where(eq(memberProfiles.id, member.id));
        if (input.updates.phone !== undefined) {
          await transaction
            .update(users)
            .set({ phone: input.updates.phone, updatedAt: now })
            .where(eq(users.id, input.userId));
        }
        await transaction.insert(auditLogs).values({
          churchId: input.churchId,
          actorUserId: input.userId,
          action: 'MEMBER_PROFILE_UPDATED',
          entityType: 'MEMBER_PROFILE',
          entityId: member.id,
          previousData: {
            firstName: member.firstName,
            lastName: member.lastName,
            otherNames: member.otherNames,
            phone: member.phone,
          },
          newData: input.updates,
        });
        const [updated] = await transaction
          .select({
            id: memberProfiles.id,
            firstName: memberProfiles.firstName,
            lastName: memberProfiles.lastName,
            otherNames: memberProfiles.otherNames,
            phone: users.phone,
          })
          .from(memberProfiles)
          .innerJoin(users, eq(users.id, memberProfiles.userId))
          .where(eq(memberProfiles.id, member.id));
        return updated;
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          'This phone number is already used by another account.',
        );
      }
      throw error;
    }
  }

  async updateMember(input: {
    memberId: string;
    actorUserId: string;
    churchId: string;
    updates: UpdateMemberDto;
  }) {
    try {
      return await this.database.transaction(async (transaction) => {
        const [member] = await transaction
          .select({
            id: memberProfiles.id,
            userId: users.id,
            firstName: memberProfiles.firstName,
            lastName: memberProfiles.lastName,
            otherNames: memberProfiles.otherNames,
            phone: users.phone,
            membershipStatus: memberProfiles.membershipStatus,
          })
          .from(memberProfiles)
          .innerJoin(users, eq(users.id, memberProfiles.userId))
          .where(
            and(
              eq(memberProfiles.id, input.memberId),
              eq(users.churchId, input.churchId),
            ),
          )
          .limit(1)
          .for('update');
        if (!member) {
          throw new NotFoundException('Member not found.');
        }

        const now = new Date();
        await transaction
          .update(memberProfiles)
          .set({
            ...(input.updates.firstName !== undefined
              ? { firstName: input.updates.firstName }
              : {}),
            ...(input.updates.lastName !== undefined
              ? { lastName: input.updates.lastName }
              : {}),
            ...(input.updates.otherNames !== undefined
              ? { otherNames: input.updates.otherNames }
              : {}),
            ...(input.updates.membershipStatus !== undefined
              ? { membershipStatus: input.updates.membershipStatus }
              : {}),
            updatedAt: now,
          })
          .where(eq(memberProfiles.id, member.id));
        if (input.updates.phone !== undefined) {
          await transaction
            .update(users)
            .set({ phone: input.updates.phone, updatedAt: now })
            .where(eq(users.id, member.userId));
        }
        await transaction.insert(auditLogs).values({
          churchId: input.churchId,
          actorUserId: input.actorUserId,
          action: 'MEMBER_PROFILE_ADMIN_UPDATED',
          entityType: 'MEMBER_PROFILE',
          entityId: member.id,
          previousData: member,
          newData: input.updates,
        });
        return { id: member.id };
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          'This phone number is already used by another account.',
        );
      }
      throw error;
    }
  }

  async archiveMember(input: {
    memberId: string;
    actorUserId: string;
    churchId: string;
  }): Promise<void> {
    await this.database.transaction(async (transaction) => {
      const [member] = await transaction
        .select({
          id: memberProfiles.id,
          userId: users.id,
          accountStatus: users.accountStatus,
          membershipStatus: memberProfiles.membershipStatus,
        })
        .from(memberProfiles)
        .innerJoin(users, eq(users.id, memberProfiles.userId))
        .where(
          and(
            eq(memberProfiles.id, input.memberId),
            eq(users.churchId, input.churchId),
          ),
        )
        .limit(1)
        .for('update');
      if (!member) {
        throw new NotFoundException('Member not found.');
      }
      if (member.userId === input.actorUserId) {
        throw new ConflictException(
          'Administrators cannot archive their own membership.',
        );
      }
      if (member.accountStatus === 'ARCHIVED') {
        throw new ConflictException('This member is already archived.');
      }
      if (
        member.accountStatus !== 'ACTIVE' &&
        member.accountStatus !== 'SUSPENDED'
      ) {
        throw new ConflictException(
          'Only active or suspended members can be archived.',
        );
      }

      const now = new Date();
      const archiveDate = now.toISOString().slice(0, 10);
      const activePrimaryAssignments = await transaction
        .select({
          id: primaryDepartmentAssignments.id,
          departmentMembershipId:
            primaryDepartmentAssignments.departmentMembershipId,
          startsAt: primaryDepartmentAssignments.startsAt,
        })
        .from(primaryDepartmentAssignments)
        .where(
          and(
            eq(primaryDepartmentAssignments.memberId, member.id),
            isNull(primaryDepartmentAssignments.endsAt),
          ),
        )
        .for('update');
      const activeMemberships = await transaction
        .select({
          id: departmentMembers.id,
          joinedAt: departmentMembers.joinedAt,
        })
        .from(departmentMembers)
        .where(
          and(
            eq(departmentMembers.memberId, member.id),
            isNull(departmentMembers.leftAt),
          ),
        )
        .for('update');
      for (const membership of activeMemberships) {
        const dayAfterJoining = new Date(
          new Date(`${membership.joinedAt}T00:00:00.000Z`).getTime() +
            86_400_000,
        )
          .toISOString()
          .slice(0, 10);
        const primaryStartsAt = activePrimaryAssignments.find(
          (assignment) => assignment.departmentMembershipId === membership.id,
        )?.startsAt;
        const leftAt = [archiveDate, dayAfterJoining, primaryStartsAt ?? '']
          .sort()
          .at(-1)!;
        await transaction
          .update(departmentMembers)
          .set({
            leftAt,
            endedBy: input.actorUserId,
            endReason: 'Member archived.',
            updatedAt: now,
          })
          .where(eq(departmentMembers.id, membership.id));
      }
      for (const assignment of activePrimaryAssignments) {
        await transaction
          .update(primaryDepartmentAssignments)
          .set({
            endsAt:
              assignment.startsAt > archiveDate
                ? assignment.startsAt
                : archiveDate,
            endedBy: input.actorUserId,
            endReason: 'Member archived.',
            updatedAt: now,
          })
          .where(eq(primaryDepartmentAssignments.id, assignment.id));
      }
      await transaction
        .update(memberProfiles)
        .set({ membershipStatus: 'ARCHIVED', updatedAt: now })
        .where(eq(memberProfiles.id, member.id));
      await transaction
        .update(users)
        .set({ accountStatus: 'ARCHIVED', updatedAt: now })
        .where(eq(users.id, member.userId));
      await transaction.insert(auditLogs).values({
        churchId: input.churchId,
        actorUserId: input.actorUserId,
        action: 'MEMBER_ARCHIVED',
        entityType: 'MEMBER_PROFILE',
        entityId: member.id,
        previousData: {
          accountStatus: member.accountStatus,
          membershipStatus: member.membershipStatus,
        },
        newData: {
          accountStatus: 'ARCHIVED',
          membershipStatus: 'ARCHIVED',
          archivedAt: now.toISOString(),
        },
      });
    });
  }

  async setPrimaryDepartment(input: {
    memberId: string;
    churchId: string;
    actorUserId: string;
    departmentMembershipId: string | null;
    effectiveOn?: string;
    reason: string;
  }) {
    return this.database.transaction(async (transaction) => {
      const today = new Date().toISOString().slice(0, 10);
      const effectiveOn = input.effectiveOn ?? today;
      if (effectiveOn < today) {
        throw new BadRequestException(
          'The primary department effective date cannot be in the past.',
        );
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

      let targetMembership:
        { id: string; joinedAt: string; leftAt: string | null } | undefined;
      if (input.departmentMembershipId) {
        [targetMembership] = await transaction
          .select({
            id: departmentMembers.id,
            joinedAt: departmentMembers.joinedAt,
            leftAt: departmentMembers.leftAt,
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
              eq(departmentMembers.id, input.departmentMembershipId),
              eq(departmentMembers.memberId, member.id),
              lte(departmentMembers.joinedAt, effectiveOn),
              or(
                isNull(departmentMembers.leftAt),
                gt(departmentMembers.leftAt, effectiveOn),
              ),
            ),
          )
          .limit(1)
          .for('update');
        if (!targetMembership) {
          throw new BadRequestException(
            'The selected membership is not active on the effective date.',
          );
        }
      }

      const relevantAssignments = await transaction
        .select({
          id: primaryDepartmentAssignments.id,
          departmentMembershipId:
            primaryDepartmentAssignments.departmentMembershipId,
          startsAt: primaryDepartmentAssignments.startsAt,
          endsAt: primaryDepartmentAssignments.endsAt,
        })
        .from(primaryDepartmentAssignments)
        .where(
          and(
            eq(primaryDepartmentAssignments.memberId, member.id),
            or(
              isNull(primaryDepartmentAssignments.endsAt),
              gt(primaryDepartmentAssignments.endsAt, effectiveOn),
            ),
          ),
        )
        .for('update');
      const current = relevantAssignments.find(
        (assignment) =>
          assignment.startsAt <= effectiveOn &&
          (assignment.endsAt === null || assignment.endsAt > effectiveOn),
      );
      const future = relevantAssignments.find(
        (assignment) => assignment.startsAt > effectiveOn,
      );
      if (future) {
        throw new ConflictException(
          'A future primary assignment must be resolved before this change.',
        );
      }
      if (
        current?.departmentMembershipId ===
          (targetMembership?.id ?? undefined) ||
        (!current && !targetMembership)
      ) {
        return {
          departmentMembershipId: targetMembership?.id ?? null,
          effectiveOn,
        };
      }

      const now = new Date();
      if (current) {
        await transaction
          .update(primaryDepartmentAssignments)
          .set({
            endsAt: effectiveOn,
            endedBy: input.actorUserId,
            endReason: input.reason,
            updatedAt: now,
          })
          .where(eq(primaryDepartmentAssignments.id, current.id));
      }
      if (targetMembership) {
        await transaction.insert(primaryDepartmentAssignments).values({
          memberId: member.id,
          departmentMembershipId: targetMembership.id,
          startsAt: effectiveOn,
          assignedBy: input.actorUserId,
        });
      }
      await transaction.insert(auditLogs).values({
        churchId: input.churchId,
        actorUserId: input.actorUserId,
        action: 'PRIMARY_DEPARTMENT_CHANGED',
        entityType: 'MEMBER_PROFILE',
        entityId: member.id,
        previousData: {
          departmentMembershipId: current?.departmentMembershipId ?? null,
        },
        newData: {
          departmentMembershipId: targetMembership?.id ?? null,
          effectiveOn,
          reason: input.reason,
        },
      });
      return {
        departmentMembershipId: targetMembership?.id ?? null,
        effectiveOn,
      };
    });
  }
}
