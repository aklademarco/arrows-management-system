import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { hash } from 'argon2';
import { EMAIL_DELIVERY, type EmailDelivery } from '../mail/email-delivery';
import { PasswordResetRepository } from './password-reset.repository';

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly repository: PasswordResetRepository,
    @Inject(EMAIL_DELIVERY) private readonly emailDelivery: EmailDelivery,
  ) {}

  /**
   * Issues a single-use reset token. Always resolves the same way regardless of
   * whether the address exists, is verified, or is rate-limited, so the response
   * never reveals which accounts are registered.
   */
  async requestReset(email: string, requestedIp?: string): Promise<void> {
    const candidate = await this.repository.findCandidate(email);
    if (
      !candidate ||
      candidate.accountStatus === 'ARCHIVED' ||
      candidate.accountStatus === 'REJECTED'
    ) {
      return;
    }

    const now = new Date();
    if (!(await this.repository.mayIssueToken(candidate.id, now))) {
      return;
    }

    const tokenBytes = randomBytes(32);
    const rawToken = tokenBytes.toString('base64url');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    try {
      await this.repository.replaceToken({
        userId: candidate.id,
        tokenHash,
        expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MS),
        requestedIp,
        now,
      });
      await this.emailDelivery.sendPasswordResetEmail({
        recipient: candidate.email,
        firstName: candidate.firstName,
        token: rawToken,
      });
    } catch {
      // A uniform response prevents account enumeration and conceals provider
      // availability, mirroring the email-verification request flow.
    } finally {
      tokenBytes.fill(0);
    }
  }

  /**
   * Consumes a reset token and applies the new password. The repository performs
   * the password swap, lockout clear, token consumption, session revocation, and
   * audit write atomically; here we only hash the raw token and password.
   */
  async confirmReset(token: string, newPassword: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const passwordHash = await hash(newPassword, {
      type: 2,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });
    await this.repository.consumeToken(tokenHash, passwordHash, new Date());
  }
}
