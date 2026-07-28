import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  asc,
  count,
  eq,
  ilike,
  inArray,
  isNotNull,
  or,
} from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import {
  accountReviews,
  auditLogs,
  departmentMembers,
  departments,
  memberProfiles,
  primaryDepartmentAssignments,
  roles,
  userRoles,
  users,
} from '../database/schema';
import { ListRegistrationsDto } from './dto/list-registrations.dto';

@Injectable()
export class AdminRegistrationRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async listPending(query: ListRegistrationsDto, churchId: string) {
    const search = query.search?.trim();
    const filters = [
      eq(users.accountStatus, 'PENDING_APPROVAL'),
      eq(users.churchId, churchId),
      isNotNull(users.emailVerifiedAt),
    ];
    if (query.requestedDepartmentId) {
      filters.push(
        eq(memberProfiles.requestedDepartmentId, query.requestedDepartmentId),
      );
    }
    if (search) {
      const pattern = `%${search}%`;
      const searchFilter = or(
        ilike(users.email, pattern),
        ilike(users.phone, pattern),
        ilike(memberProfiles.firstName, pattern),
        ilike(memberProfiles.lastName, pattern),
        ilike(memberProfiles.otherNames, pattern),
      );
      if (searchFilter) {
        filters.push(searchFilter);
      }
    }
    const where = and(...filters);
    const offset = (query.page - 1) * query.limit;
    const baseJoin = this.database
      .select({
        id: users.id,
        email: users.email,
        phone: users.phone,
        firstName: memberProfiles.firstName,
        lastName: memberProfiles.lastName,
        otherNames: memberProfiles.otherNames,
        requestedDepartmentId: memberProfiles.requestedDepartmentId,
        requestedDepartmentName: departments.name,
        emailVerifiedAt: users.emailVerifiedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(memberProfiles, eq(memberProfiles.userId, users.id))
      .leftJoin(
        departments,
        eq(departments.id, memberProfiles.requestedDepartmentId),
      );
    const [items, [{ total }]] = await Promise.all([
      baseJoin
        .where(where)
        .orderBy(asc(users.createdAt))
        .limit(query.limit)
        .offset(offset),
      this.database
        .select({ total: count() })
        .from(users)
        .innerJoin(memberProfiles, eq(memberProfiles.userId, users.id))
        .where(where),
    ]);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async listDepartmentOptions(churchId: string) {
    return this.database
      .select({ id: departments.id, name: departments.name })
      .from(departments)
      .where(eq(departments.churchId, churchId))
      .orderBy(asc(departments.name));
  }

  async findRegistration(userId: string, churchId: string) {
    const [registration] = await this.database
      .select({
        id: users.id,
        email: users.email,
        phone: users.phone,
        accountStatus: users.accountStatus,
        emailVerifiedAt: users.emailVerifiedAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        firstName: memberProfiles.firstName,
        lastName: memberProfiles.lastName,
        otherNames: memberProfiles.otherNames,
        membershipStatus: memberProfiles.membershipStatus,
        requestedDepartmentId: memberProfiles.requestedDepartmentId,
        requestedDepartmentName: departments.name,
      })
      .from(users)
      .innerJoin(memberProfiles, eq(memberProfiles.userId, users.id))
      .leftJoin(
        departments,
        eq(departments.id, memberProfiles.requestedDepartmentId),
      )
      .where(and(eq(users.id, userId), eq(users.churchId, churchId)))
      .limit(1);

    if (!registration) {
      throw new NotFoundException('Registration not found.');
    }
    return registration;
  }

  async review(input: {
    userId: string;
    reviewerId: string;
    reviewerChurchId: string;
    approve: boolean;
    primaryDepartmentId?: string;
    additionalDepartmentIds?: string[];
    reason?: string;
    requestedIp?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.database.transaction(async (transaction) => {
      const [account] = await transaction
        .select({
          id: users.id,
          churchId: users.churchId,
          accountStatus: users.accountStatus,
          emailVerifiedAt: users.emailVerifiedAt,
          memberId: memberProfiles.id,
        })
        .from(users)
        .innerJoin(memberProfiles, eq(memberProfiles.userId, users.id))
        .where(
          and(
            eq(users.id, input.userId),
            eq(users.churchId, input.reviewerChurchId),
          ),
        )
        .limit(1)
        .for('update');
      if (!account) {
        throw new NotFoundException('Registration not found.');
      }
      if (account.accountStatus !== 'PENDING_APPROVAL') {
        throw new ConflictException(
          'This registration has already been reviewed.',
        );
      }
      if (!account.emailVerifiedAt) {
        throw new BadRequestException(
          'The email address must be verified before approval.',
        );
      }

      const nextStatus = input.approve ? 'ACTIVE' : 'REJECTED';
      const now = new Date();
      await transaction
        .update(users)
        .set({ accountStatus: nextStatus, updatedAt: now })
        .where(eq(users.id, account.id));

      if (input.approve) {
        if (!input.primaryDepartmentId) {
          throw new BadRequestException(
            'A primary department is required for approval.',
          );
        }
        const additionalDepartmentIds = [
          ...new Set(input.additionalDepartmentIds ?? []),
        ].filter((departmentId) => departmentId !== input.primaryDepartmentId);
        const selectedDepartmentIds = [
          input.primaryDepartmentId,
          ...additionalDepartmentIds,
        ];
        const selectedDepartments = await transaction
          .select({ id: departments.id })
          .from(departments)
          .where(
            and(
              inArray(departments.id, selectedDepartmentIds),
              eq(departments.churchId, account.churchId),
            ),
          );
        if (selectedDepartments.length !== selectedDepartmentIds.length) {
          throw new BadRequestException(
            'One or more selected departments do not exist.',
          );
        }
        const effectiveDate = now.toISOString().slice(0, 10);
        const memberships = await transaction
          .insert(departmentMembers)
          .values(
            selectedDepartmentIds.map((departmentId) => ({
              departmentId,
              memberId: account.memberId,
              joinedAt: effectiveDate,
              assignedBy: input.reviewerId,
            })),
          )
          .returning({
            id: departmentMembers.id,
            departmentId: departmentMembers.departmentId,
          });
        const primaryMembership = memberships.find(
          (membership) => membership.departmentId === input.primaryDepartmentId,
        );
        if (!primaryMembership) {
          throw new InternalServerErrorException(
            'The primary department membership could not be created.',
          );
        }
        await transaction.insert(primaryDepartmentAssignments).values({
          memberId: account.memberId,
          departmentMembershipId: primaryMembership.id,
          startsAt: effectiveDate,
          assignedBy: input.reviewerId,
        });

        const [memberRole] = await transaction
          .select({ id: roles.id })
          .from(roles)
          .where(eq(roles.name, 'MEMBER'))
          .limit(1);
        if (!memberRole) {
          throw new InternalServerErrorException(
            'The default member role is not configured.',
          );
        }
        await transaction
          .insert(userRoles)
          .values({ userId: account.id, roleId: memberRole.id })
          .onConflictDoNothing();
      }

      await transaction.insert(accountReviews).values({
        userId: account.id,
        reviewedBy: input.reviewerId,
        previousStatus: 'PENDING_APPROVAL',
        newStatus: nextStatus,
        decision: input.approve ? 'APPROVED' : 'REJECTED',
        reason: input.reason,
      });
      await transaction.insert(auditLogs).values({
        churchId: account.churchId,
        actorUserId: input.reviewerId,
        action: input.approve
          ? 'REGISTRATION_APPROVED'
          : 'REGISTRATION_REJECTED',
        entityType: 'USER',
        entityId: account.id,
        previousData: { accountStatus: 'PENDING_APPROVAL' },
        newData: {
          accountStatus: nextStatus,
          ...(input.approve
            ? {
                primaryDepartmentId: input.primaryDepartmentId,
                additionalDepartmentIds: input.additionalDepartmentIds ?? [],
              }
            : {}),
        },
        metadata: input.reason ? { reason: input.reason } : undefined,
        requestedIp: input.requestedIp,
        userAgent: input.userAgent,
      });
    });
  }
}
