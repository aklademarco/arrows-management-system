import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, isNotNull } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import {
  accountReviews,
  auditLogs,
  memberProfiles,
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
        emailVerifiedAt: users.emailVerifiedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(memberProfiles, eq(memberProfiles.userId, users.id))
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
        })
        .from(users)
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
        await transaction
          .insert(userRoles)
          .select(
            transaction
              .select({
                userId: users.id,
                roleId: roles.id,
              })
              .from(users)
              .innerJoin(roles, eq(roles.name, 'MEMBER'))
              .where(eq(users.id, account.id)),
          )
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
        newData: { accountStatus: nextStatus },
        metadata: input.reason ? { reason: input.reason } : undefined,
        requestedIp: input.requestedIp,
        userAgent: input.userAgent,
      });
    });
  }
}
