import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import { auditLogs, users } from '../database/schema';

@Injectable()
export class AdminUserRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async changeAccountStatus(input: {
    userId: string;
    actorUserId: string;
    churchId: string;
    fromStatus: 'ACTIVE' | 'SUSPENDED';
    toStatus: 'ACTIVE' | 'SUSPENDED';
    reason?: string;
    requestedIp?: string;
    userAgent?: string;
  }): Promise<void> {
    if (input.userId === input.actorUserId) {
      throw new BadRequestException(
        'Administrators cannot change their own account status.',
      );
    }

    await this.database.transaction(async (transaction) => {
      const [account] = await transaction
        .select({ id: users.id, accountStatus: users.accountStatus })
        .from(users)
        .where(
          and(eq(users.id, input.userId), eq(users.churchId, input.churchId)),
        )
        .limit(1)
        .for('update');
      if (!account) {
        throw new NotFoundException('User not found.');
      }
      if (account.accountStatus !== input.fromStatus) {
        throw new ConflictException(
          `Only ${input.fromStatus.toLowerCase()} accounts can be changed to ${input.toStatus.toLowerCase()}.`,
        );
      }

      const now = new Date();
      await transaction
        .update(users)
        .set({ accountStatus: input.toStatus, updatedAt: now })
        .where(eq(users.id, account.id));
      await transaction.insert(auditLogs).values({
        churchId: input.churchId,
        actorUserId: input.actorUserId,
        action:
          input.toStatus === 'SUSPENDED'
            ? 'USER_SUSPENDED'
            : 'USER_REACTIVATED',
        entityType: 'USER',
        entityId: account.id,
        previousData: { accountStatus: input.fromStatus },
        newData: { accountStatus: input.toStatus },
        metadata: input.reason ? { reason: input.reason } : undefined,
        requestedIp: input.requestedIp,
        userAgent: input.userAgent,
      });
    });
  }
}
