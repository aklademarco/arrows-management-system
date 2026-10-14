import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { and, eq, isNull, ne, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import { auditLogs, pushDevices, users } from '../database/schema';
import type { AuthenticatedPrincipal } from '../auth/authenticated.guard';

const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');

@Injectable()
export class PushDevicesRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async update(
    token: string,
    enabled: boolean,
    user: AuthenticatedPrincipal,
    approvalOnly = false,
    previousSecret?: string,
  ) {
    const tokenHash = hash(token);
    let revocationSecret = enabled
      ? randomBytes(32).toString('hex')
      : undefined;
    await this.database.transaction(async (tx) => {
      const now = new Date();
      if (enabled) {
        const [account] = await tx
          .select({
            status: users.accountStatus,
            verified: users.emailVerifiedAt,
          })
          .from(users)
          .where(and(eq(users.id, user.id), eq(users.churchId, user.churchId)))
          .for('update');
        if (
          !account ||
          (account.status !== 'ACTIVE' &&
            !(
              approvalOnly &&
              account.status === 'PENDING_APPROVAL' &&
              account.verified
            ))
        ) {
          throw new ForbiddenException(
            'This account cannot register push notifications.',
          );
        }
        if (previousSecret) {
          const [previous] = await tx
            .select({ id: pushDevices.id })
            .from(pushDevices)
            .where(
              and(
                eq(pushDevices.revocationHash, hash(previousSecret)),
                eq(pushDevices.userId, user.id),
                eq(pushDevices.churchId, user.churchId),
                isNull(pushDevices.revokedAt),
              ),
            )
            .for('update');
          // Preserve a verified browser capability on refresh. A lost response must
          // not invalidate the cookie the browser still holds.
          if (previous) revocationSecret = previousSecret;
          await tx
            .update(pushDevices)
            .set({ revokedAt: now, updatedAt: now, revocationHash: null })
            .where(
              and(
                eq(pushDevices.revocationHash, hash(previousSecret)),
                eq(pushDevices.userId, user.id),
                eq(pushDevices.churchId, user.churchId),
                ne(pushDevices.tokenHash, tokenHash),
              ),
            );
        }
        const sameOwner = sql`${pushDevices.userId} = ${user.id} AND ${pushDevices.churchId} = ${user.churchId}
          AND ${pushDevices.revokedAt} IS NULL AND ${pushDevices.expiresAt} > ${now}`;
        await tx
          .insert(pushDevices)
          .values({
            token,
            tokenHash,
            userId: user.id,
            churchId: user.churchId,
            approvalOnly,
            revocationHash: hash(revocationSecret!),
          })
          .onConflictDoUpdate({
            target: pushDevices.tokenHash,
            set: {
              token,
              userId: user.id,
              churchId: user.churchId,
              revokedAt: null,
              updatedAt: now,
              approvalOnly,
              revocationHash: hash(revocationSecret!),
              expiresAt: new Date(now.getTime() + 30 * 86400000),
              generation: sql`CASE WHEN ${sameOwner} THEN ${pushDevices.generation} ELSE ${randomUUID()}::uuid END`,
              subscribedAt: sql`CASE WHEN ${sameOwner} THEN ${pushDevices.subscribedAt} ELSE ${now}::timestamptz END`,
            },
          });
      } else {
        await tx
          .update(pushDevices)
          .set({ revokedAt: now, updatedAt: now })
          .where(
            and(
              eq(pushDevices.tokenHash, tokenHash),
              eq(pushDevices.userId, user.id),
              eq(pushDevices.churchId, user.churchId),
              isNull(pushDevices.revokedAt),
            ),
          );
      }
      await tx.insert(auditLogs).values({
        churchId: user.churchId,
        actorUserId: user.id,
        action: enabled ? 'PUSH_DEVICE_REGISTERED' : 'PUSH_DEVICE_REVOKED',
        entityType: 'push_device',
      });
    });
    return revocationSecret;
  }

  /** A device-scoped capability permits logout cleanup even after its access JWT expires. */
  async revokeBySecret(secret: string) {
    await this.database.transaction(async (tx) => {
      const devices = await tx
        .update(pushDevices)
        .set({ revokedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(pushDevices.revocationHash, hash(secret)),
            isNull(pushDevices.revokedAt),
          ),
        )
        .returning({
          id: pushDevices.id,
          churchId: pushDevices.churchId,
          userId: pushDevices.userId,
        });
      for (const device of devices)
        await tx.insert(auditLogs).values({
          churchId: device.churchId,
          actorUserId: device.userId,
          action: 'PUSH_DEVICE_REVOKED',
          entityType: 'push_device',
          entityId: device.id,
          metadata: { source: 'DEVICE_CAPABILITY' },
        });
    });
  }
}
