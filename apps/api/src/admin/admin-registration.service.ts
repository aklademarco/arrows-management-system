import { Injectable } from '@nestjs/common';
import { AdminRegistrationRepository } from './admin-registration.repository';

@Injectable()
export class AdminRegistrationService {
  constructor(private readonly repository: AdminRegistrationRepository) {}

  listPending() {
    return this.repository.listPending();
  }

  approve(input: {
    userId: string;
    reviewerId: string;
    note?: string;
    requestedIp?: string;
    userAgent?: string;
  }) {
    return this.repository.review({
      ...input,
      approve: true,
      reason: input.note,
    });
  }

  reject(input: {
    userId: string;
    reviewerId: string;
    reason: string;
    requestedIp?: string;
    userAgent?: string;
  }) {
    return this.repository.review({ ...input, approve: false });
  }
}
