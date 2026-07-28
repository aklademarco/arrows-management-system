import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, isNotNull } from 'drizzle-orm';
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

@Injectable()
export class AdminRegistrationRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async listPending() {
    return this.database
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
      )
      .where(
        and(
          eq(users.accountStatus, 'PENDING_APPROVAL'),
          isNotNull(users.emailVerifiedAt),
        ),
      )
      .orderBy(asc(users.createdAt));
  }

  async review(input: {
    userId: string;
    reviewerId: string;
    approve: boolean;
    primaryDepartmentId?: string;
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
        .where(eq(users.id, input.userId))
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
        const [department] = await transaction
          .select({ id: departments.id })
          .from(departments)
          .where(
            and(
              eq(departments.id, input.primaryDepartmentId),
              eq(departments.churchId, account.churchId),
            ),
          )
          .limit(1);
        if (!department) {
          throw new BadRequestException(
            'The selected primary department does not exist.',
          );
        }
        const effectiveDate = now.toISOString().slice(0, 10);
        const [membership] = await transaction
          .insert(departmentMembers)
          .values({
            departmentId: department.id,
            memberId: account.memberId,
            joinedAt: effectiveDate,
            assignedBy: input.reviewerId,
          })
          .returning({ id: departmentMembers.id });
        await transaction.insert(primaryDepartmentAssignments).values({
          memberId: account.memberId,
          departmentMembershipId: membership.id,
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
            ? { primaryDepartmentId: input.primaryDepartmentId }
            : {}),
        },
        metadata: input.reason ? { reason: input.reason } : undefined,
        requestedIp: input.requestedIp,
        userAgent: input.userAgent,
      });
    });
  }
}
