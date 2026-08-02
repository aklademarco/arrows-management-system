import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, count, eq, gte, isNull, ne } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import { accountActionTokens, memberProfiles, users } from '../database/schema';

type VerificationCandidate = {
  id: string;
  email: string;
  firstName: string;
  emailVerifiedAt: Date | null;
};

@Injectable()
export class EmailVerificationRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async findCandidate(email: string): Promise<VerificationCandidate | null> {
    const [candidate] = await this.database
      .select({
        id: users.id,
        email: users.email,
        firstName: memberProfiles.firstName,
        emailVerifiedAt: users.emailVerifiedAt,
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
          eq(accountActionTokens.type, 'EMAIL_VERIFICATION'),
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
            eq(accountActionTokens.type, 'EMAIL_VERIFICATION'),
            isNull(accountActionTokens.usedAt),
            isNull(accountActionTokens.revokedAt),
          ),
        );

      await transaction.insert(accountActionTokens).values({
        userId: input.userId,
        type: 'EMAIL_VERIFICATION',
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        requestedIp: input.requestedIp,
      });
    });
  }

  async consumeToken(tokenHash: string, now: Date): Promise<void> {
    await this.database.transaction(async (transaction) => {
      const [match] = await transaction
        .select({
          tokenId: accountActionTokens.id,
          userId: accountActionTokens.userId,
          expiresAt: accountActionTokens.expiresAt,
          usedAt: accountActionTokens.usedAt,
          revokedAt: accountActionTokens.revokedAt,
          emailVerifiedAt: users.emailVerifiedAt,
        })
        .from(accountActionTokens)
        .innerJoin(users, eq(users.id, accountActionTokens.userId))
        .where(
          and(
            eq(accountActionTokens.tokenHash, tokenHash),
            eq(accountActionTokens.type, 'EMAIL_VERIFICATION'),
          ),
        )
        .limit(1)
        .for('update');

      if (!match || match.revokedAt || match.expiresAt <= now) {
        throw new BadRequestException(
          'This verification link is invalid or has expired.',
        );
      }
      if (match.usedAt && match.emailVerifiedAt) {
        return;
      }
      if (match.usedAt || match.emailVerifiedAt) {
        throw new BadRequestException(
          'This verification link is invalid or has expired.',
        );
      }

      await transaction
        .update(users)
        .set({ emailVerifiedAt: now, updatedAt: now })
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
            eq(accountActionTokens.type, 'EMAIL_VERIFICATION'),
            ne(accountActionTokens.id, match.tokenId),
            isNull(accountActionTokens.usedAt),
            isNull(accountActionTokens.revokedAt),
          ),
        );
    });
  }
}
