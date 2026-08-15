import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, count, eq, gte, isNull, ne } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import {
  accountActionTokens,
  auditLogs,
  memberProfiles,
  refreshTokens,
  users,
} from '../database/schema';

type ResetCandidate = {
  id: string;
  email: string;
  firstName: string;
  accountStatus: string;
};

@Injectable()
export class PasswordResetRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async findCandidate(email: string): Promise<ResetCandidate | null> {
    const [candidate] = await this.database
      .select({
        id: users.id,
        email: users.email,
        firstName: memberProfiles.firstName,
        accountStatus: users.accountStatus,
      })
      .from(users)
      .innerJoin(memberProfiles, eq(memberProfiles.userId, users.id))
      .where(eq(users.email, email))
      .limit(1);
    return candidate ?? null;
  }

  async mayIssueToken(userId: string, now: Date): Promise<boolean> {
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const [result] = await this.database
      .select({ value: count() })
      .from(accountActionTokens)
      .where(
        and(
          eq(accountActionTokens.userId, userId),
          eq(accountActionTokens.type, 'PASSWORD_RESET'),
          gte(accountActionTokens.createdAt, oneHourAgo),
        ),
      );
    return Number(result.value) < 3;
  }

  async replaceToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    requestedIp?: string;
    now: Date;
  }): Promise<void> {
    await this.database.transaction(async (transaction) => {
      await transaction
        .update(accountActionTokens)
        .set({ revokedAt: input.now })
        .where(
          and(
            eq(accountActionTokens.userId, input.userId),
            eq(accountActionTokens.type, 'PASSWORD_RESET'),
            isNull(accountActionTokens.usedAt),
            isNull(accountActionTokens.revokedAt),
          ),
        );
      await transaction.insert(accountActionTokens).values({
        userId: input.userId,
        type: 'PASSWORD_RESET',
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        requestedIp: input.requestedIp,
      });
    });
  }

  /**
   * Consumes a password-reset token and applies the new password in one
   * transaction: the token row is locked, the password hash is replaced, the
   * lockout is cleared, sibling reset tokens are revoked, every refresh session
   * is revoked, and a sensitive-value-free audit event is recorded.
   */
  async consumeToken(
    tokenHash: string,
    newPasswordHash: string,
    now: Date,
  ): Promise<void> {
    await this.database.transaction(async (transaction) => {
      const [match] = await transaction
        .select({
          tokenId: accountActionTokens.id,
          userId: accountActionTokens.userId,
          churchId: users.churchId,
          expiresAt: accountActionTokens.expiresAt,
          usedAt: accountActionTokens.usedAt,
          revokedAt: accountActionTokens.revokedAt,
        })
        .from(accountActionTokens)
        .innerJoin(users, eq(users.id, accountActionTokens.userId))
        .where(
          and(
            eq(accountActionTokens.tokenHash, tokenHash),
            eq(accountActionTokens.type, 'PASSWORD_RESET'),
          ),
        )
        .limit(1)
        .for('update');

      if (!match || match.revokedAt || match.usedAt || match.expiresAt <= now) {
        throw new BadRequestException(
          'This password-reset link is invalid or has expired.',
        );
      }

      await transaction
        .update(users)
        .set({
          passwordHash: newPasswordHash,
          failedLoginAttempts: 0,
          lockedUntil: null,
          updatedAt: now,
        })
        .where(eq(users.id, match.userId));

      await transaction
        .update(accountActionTokens)
        .set({ usedAt: now })
        .where(eq(accountActionTokens.id, match.tokenId));

      await transaction
        .update(accountActionTokens)
        .set({ revokedAt: now })
        .where(
          and(
            eq(accountActionTokens.userId, match.userId),
            eq(accountActionTokens.type, 'PASSWORD_RESET'),
            ne(accountActionTokens.id, match.tokenId),
            isNull(accountActionTokens.usedAt),
            isNull(accountActionTokens.revokedAt),
          ),
        );

      await transaction
        .update(refreshTokens)
        .set({ revokedAt: now })
        .where(
          and(
            eq(refreshTokens.userId, match.userId),
            isNull(refreshTokens.revokedAt),
          ),
        );

      await transaction.insert(auditLogs).values({
        churchId: match.churchId,
        actorUserId: match.userId,
        action: 'PASSWORD_RESET_COMPLETED',
        entityType: 'USER',
        entityId: match.userId,
      });
    });
  }
}
