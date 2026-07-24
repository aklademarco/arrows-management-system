import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { hash } from 'argon2';
import { RegisterDto } from './dto/register.dto';
import { RegistrationRepository } from './registration.repository';

export type RegistrationResult = {
  userId: string;
  accountStatus: 'PENDING_APPROVAL';
  emailVerificationRequired: true;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: RegistrationRepository,
    private readonly config: ConfigService,
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

    const rawVerificationToken = randomBytes(32);
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

    // The raw token deliberately leaves no persistent or logged copy.
    // Transactional email delivery is the next authentication slice.
    rawVerificationToken.fill(0);

    return {
      userId,
      accountStatus: 'PENDING_APPROVAL',
      emailVerificationRequired: true,
    };
  }
}
