import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import { auditLogs, pushDevices } from '../database/schema';
import type { AuthenticatedPrincipal } from '../auth/authenticated.guard';

@Injectable()
export class PushDevicesRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async update(token: string, enabled: boolean, user: AuthenticatedPrincipal) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await this.database.transaction(async (tx) => {
      const now = new Date();
      if (enabled) {
        // One browser token has one owner, including after account switching.
        await tx
          .insert(pushDevices)
          .values({
            token,
            tokenHash,
            userId: user.id,
            churchId: user.churchId,
          })
          .onConflictDoUpdate({
            target: pushDevices.tokenHash,
            set: {
              token,
              userId: user.id,
              churchId: user.churchId,
              revokedAt: null,
              updatedAt: now,
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
  }
}
