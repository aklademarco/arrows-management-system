import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { hash } from 'argon2';
import { EMAIL_DELIVERY, type EmailDelivery } from '../mail/email-delivery';
import { RegisterDto } from './dto/register.dto';
import { EmailVerificationRepository } from './email-verification.repository';
import { RegistrationRepository } from './registration.repository';

export type RegistrationResult = {
  userId: string;
  accountStatus: 'PENDING_APPROVAL';
  emailVerificationRequired: true;
  verificationEmailSent: boolean;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: RegistrationRepository,
    private readonly emailVerificationRepository: EmailVerificationRepository,
    private readonly config: ConfigService,
    @Inject(EMAIL_DELIVERY) private readonly emailDelivery: EmailDelivery,
  ) {}

  async register(
    dto: RegisterDto,
    requestedIp?: string,
  ): Promise<RegistrationResult> {
    const churchId = this.config.get<string>('DEFAULT_CHURCH_ID');
    if (!churchId) {
      throw new InternalServerErrorException(
        'Registration is not configured for a church.',
      );
    }

    const tokenBytes = randomBytes(32);
    const rawVerificationToken = tokenBytes.toString('base64url');
    const tokenHash = createHash('sha256')
      .update(rawVerificationToken)
      .digest('hex');
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const userId = await this.repository.create({
      churchId,
      email: dto.email,
      phone: dto.phone,
      passwordHash: await hash(dto.password, {
        type: 2,
        memoryCost: 19_456,
        timeCost: 2,
        parallelism: 1,
      }),
      firstName: dto.firstName,
      lastName: dto.lastName,
      otherNames: dto.otherNames,
      requestedDepartmentId: dto.requestedDepartmentId,
      tokenHash,
      tokenExpiresAt,
      requestedIp,
    });

    let verificationEmailSent = false;
    try {
      await this.emailDelivery.sendVerificationEmail({
        recipient: dto.email,
        firstName: dto.firstName,
        token: rawVerificationToken,
      });
      verificationEmailSent = true;
    } catch {
      // Registration remains valid. The generic resend endpoint can issue a
      // replacement token after transient delivery failures.
    } finally {
      tokenBytes.fill(0);
    }

    return {
      userId,
      accountStatus: 'PENDING_APPROVAL',
      emailVerificationRequired: true,
      verificationEmailSent,
    };
  }

  async requestEmailVerification(
    email: string,
    requestedIp?: string,
  ): Promise<void> {
    const candidate =
      await this.emailVerificationRepository.findCandidate(email);
    if (!candidate || candidate.emailVerifiedAt) {
      return;
    }

    const now = new Date();
    if (
      !(await this.emailVerificationRepository.mayIssueToken(candidate.id, now))
    ) {
      return;
    }

    const tokenBytes = randomBytes(32);
    const rawToken = tokenBytes.toString('base64url');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    try {
      await this.emailVerificationRepository.replaceToken({
        userId: candidate.id,
        tokenHash,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        requestedIp,
        now,
      });
      await this.emailDelivery.sendVerificationEmail({
        recipient: candidate.email,
        firstName: candidate.firstName,
        token: rawToken,
      });
    } catch {
      // A generic response prevents account enumeration and hides provider
      // availability. Operational logging will be added in Backend Core.
    } finally {
      tokenBytes.fill(0);
    }
  }

  async confirmEmailVerification(token: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await this.emailVerificationRepository.consumeToken(tokenHash, new Date());
  }
}
