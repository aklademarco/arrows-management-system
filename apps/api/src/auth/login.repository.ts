import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import { roles, userRoles, users } from '../database/schema';

export type LoginAccount = {
  id: string;
  churchId: string;
  email: string;
  passwordHash: string;
  emailVerifiedAt: Date | null;
  accountStatus:
    'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED' | 'ARCHIVED';
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  roles: string[];
};

@Injectable()
export class LoginRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async findByEmail(email: string): Promise<LoginAccount | null> {
    const [account] = await this.database
      .select({
        id: users.id,
        churchId: users.churchId,
        email: users.email,
        passwordHash: users.passwordHash,
        emailVerifiedAt: users.emailVerifiedAt,
        accountStatus: users.accountStatus,
        failedLoginAttempts: users.failedLoginAttempts,
        lockedUntil: users.lockedUntil,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!account) {
      return null;
    }

    const assignedRoles = await this.database
      .select({ name: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(eq(userRoles.userId, account.id));

    return { ...account, roles: assignedRoles.map((role) => role.name) };
  }

  async recordFailure(
    userId: string,
    failedLoginAttempts: number,
    lockedUntil: Date | null,
  ): Promise<void> {
    await this.database
      .update(users)
      .set({ failedLoginAttempts, lockedUntil, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async recordSuccess(userId: string, now: Date): Promise<void> {
    await this.database
      .update(users)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, userId));
  }
}
