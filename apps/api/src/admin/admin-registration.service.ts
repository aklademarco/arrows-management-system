import { Inject, Injectable, Logger } from '@nestjs/common';

import { EMAIL_DELIVERY, type EmailDelivery } from '../mail/email-delivery';
import { AdminRegistrationRepository } from './admin-registration.repository';
import { ListRegistrationsDto } from './dto/list-registrations.dto';

@Injectable()
export class AdminRegistrationService {
  private readonly logger = new Logger(AdminRegistrationService.name);

  constructor(
    private readonly repository: AdminRegistrationRepository,
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
