import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import { refreshTokens } from '../database/schema';

export type RefreshTokenContext = {
  ipAddress?: string;
  userAgent?: string;
  deviceName?: string;
};

export type IssuedRefreshToken = {
  token: string;
  expiresAt: Date;
};

export type RotationResult =
  | { outcome: 'ROTATED'; userId: string; issued: IssuedRefreshToken }
  | { outcome: 'INVALID' }
  | { outcome: 'REUSE_DETECTED'; userId: string };

type DatabaseTransaction = Parameters<
  Parameters<Database['transaction']>[0]
>[0];

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

@Injectable()
export class RefreshTokenRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  /** Generates a high-entropy token, persists only its hash, returns the raw value once. */
  private async insertToken(
    executor: Database | DatabaseTransaction,
    userId: string,
    ttlSeconds: number,
    context: RefreshTokenContext,
    now: Date,
  ): Promise<IssuedRefreshToken> {
    const tokenBytes = randomBytes(32);
    const rawToken = tokenBytes.toString('base64url');
    tokenBytes.fill(0);
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
    await executor.insert(refreshTokens).values({
      userId,
      tokenHash: hashToken(rawToken),
      deviceName: context.deviceName,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      expiresAt,
    });
    return { token: rawToken, expiresAt };
  }

  async issue(
    userId: string,
    ttlSeconds: number,
    context: RefreshTokenContext,
    now = new Date(),
  ): Promise<IssuedRefreshToken> {
    return this.insertToken(this.database, userId, ttlSeconds, context, now);
  }

  /**
   * Atomically rotates a refresh token: the presented token is revoked and a
   * replacement is issued in the same transaction. Presenting a token that is
   * already revoked but not yet expired signals reuse of a stolen or superseded
   * token; every active session for that user is revoked in response.
   */
  async rotate(
    rawToken: string,
    ttlSeconds: number,
    context: RefreshTokenContext,
    now = new Date(),
  ): Promise<RotationResult> {
    const tokenHash = hashToken(rawToken);
    return this.database.transaction(async (transaction) => {
      const [existing] = await transaction
        .select({
          id: refreshTokens.id,
          userId: refreshTokens.userId,
          expiresAt: refreshTokens.expiresAt,
          revokedAt: refreshTokens.revokedAt,
        })
        .from(refreshTokens)
        .where(eq(refreshTokens.tokenHash, tokenHash))
        .limit(1)
        .for('update');

      if (!existing || existing.expiresAt <= now) {
        return { outcome: 'INVALID' };
      }
      if (existing.revokedAt) {
        await transaction
          .update(refreshTokens)
          .set({ revokedAt: now })
          .where(
            and(
              eq(refreshTokens.userId, existing.userId),
              isNull(refreshTokens.revokedAt),
            ),
          );
        return { outcome: 'REUSE_DETECTED', userId: existing.userId };
      }

      await transaction
        .update(refreshTokens)
        .set({ revokedAt: now })
        .where(eq(refreshTokens.id, existing.id));
      const issued = await this.insertToken(
        transaction,
        existing.userId,
        ttlSeconds,
        context,
        now,
      );
      return { outcome: 'ROTATED', userId: existing.userId, issued };
    });
  }

  /** Revokes a single session by its raw token. Silent when the token is unknown. */
  async revoke(rawToken: string, now = new Date()): Promise<void> {
    await this.database
      .update(refreshTokens)
      .set({ revokedAt: now })
      .where(
        and(
          eq(refreshTokens.tokenHash, hashToken(rawToken)),
          isNull(refreshTokens.revokedAt),
        ),
      );
  }

  /** Revokes every active session for a user. Accepts a transaction for atomic flows. */
  async revokeAllForUser(
    userId: string,
    executor: Database | DatabaseTransaction = this.database,
    now = new Date(),
  ): Promise<void> {
    await executor
      .update(refreshTokens)
      .set({ revokedAt: now })
      .where(
        and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)),
      );
  }
}
