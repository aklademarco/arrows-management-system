import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

import { AuthService } from '../auth/auth.service';
import { EMAIL_DELIVERY, type EmailDelivery } from '../mail/email-delivery';
import { AdminRegistrationRepository } from './admin-registration.repository';
import { ListRegistrationsDto } from './dto/list-registrations.dto';

@Injectable()
export class AdminRegistrationService {
  private readonly logger = new Logger(AdminRegistrationService.name);

  constructor(
    private readonly repository: AdminRegistrationRepository,
    private readonly authService: AuthService,
    @Inject(EMAIL_DELIVERY)
    private readonly emailDelivery: EmailDelivery,
  ) {}

  listPending(query: ListRegistrationsDto, churchId: string) {
    return this.repository.listPending(query, churchId);
  }

  listDepartmentOptions(churchId: string) {
    return this.repository.listDepartmentOptions(churchId);
  }

  findRegistration(userId: string, churchId: string) {
    return this.repository.findRegistration(userId, churchId);
  }

  async sendVerificationReminder(input: {
    userId: string;
    reviewerId: string;
    reviewerChurchId: string;
    requestedIp?: string;
    userAgent?: string;
  }): Promise<void> {
    const registration = await this.repository.findRegistration(
      input.userId,
      input.reviewerChurchId,
    );
    if (registration.accountStatus !== 'PENDING_APPROVAL') {
      throw new ConflictException(
        'Verification reminders are only available for pending registrations.',
      );
    }
    if (registration.emailVerifiedAt) {
      throw new BadRequestException(
        'This member has already verified their email address.',
      );
    }

    await this.repository.recordVerificationReminderRequest(input);
    const result = await this.authService.requestEmailVerification(
      registration.email,
      input.requestedIp,
    );

    if (result === 'SENT') return;
    if (result === 'RATE_LIMITED') {
      throw new HttpException(
        'This account has reached the verification email limit. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (result === 'DELIVERY_FAILED') {
      throw new ServiceUnavailableException(
        'The verification email could not be sent. Try again shortly.',
      );
    }
    throw new BadRequestException(
      'This account no longer requires email verification.',
    );
  }

  async approve(input: {
    userId: string;
    reviewerId: string;
    reviewerChurchId: string;
    primaryDepartmentId: string;
    additionalDepartmentIds?: string[];
    note?: string;
    requestedIp?: string;
    userAgent?: string;
  }) {
    const registration = await this.repository.findRegistration(
      input.userId,
      input.reviewerChurchId,
    );

    await this.repository.review({
      ...input,
      approve: true,
      reason: input.note,
    });

    try {
      await this.emailDelivery.sendAccountApprovedEmail({
        recipient: registration.email,
        firstName: registration.firstName,
      });
    } catch (error) {
      this.logger.error(
        `Approval email failed for user ${input.userId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  reject(input: {
    userId: string;
    reviewerId: string;
    reviewerChurchId: string;
    reason: string;
    requestedIp?: string;
    userAgent?: string;
  }) {
    return this.repository.review({
      ...input,
      approve: false,
    });
  }
}
