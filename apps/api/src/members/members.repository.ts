import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, eq, ilike, inArray, isNull, or } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import {
  auditLogs,
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

  async list(query: ListMembersDto, churchId: string) {
    const filters = [eq(users.churchId, churchId)];
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

  async findById(memberId: string, churchId: string) {
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
      .where(and(eq(memberProfiles.id, memberId), eq(users.churchId, churchId)))
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
}
