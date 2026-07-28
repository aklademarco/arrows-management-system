import { Injectable } from '@nestjs/common';
import { AdminRegistrationRepository } from './admin-registration.repository';
import { ListRegistrationsDto } from './dto/list-registrations.dto';

@Injectable()
export class AdminRegistrationService {
  constructor(private readonly repository: AdminRegistrationRepository) {}

  listPending(query: ListRegistrationsDto, churchId: string) {
    return this.repository.listPending(query, churchId);
  }

  listDepartmentOptions(churchId: string) {
    return this.repository.listDepartmentOptions(churchId);
  }

  findRegistration(userId: string, churchId: string) {
    return this.repository.findRegistration(userId, churchId);
  }

  approve(input: {
    userId: string;
    reviewerId: string;
    reviewerChurchId: string;
    primaryDepartmentId: string;
    additionalDepartmentIds?: string[];
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
    reviewerChurchId: string;
    reason: string;
    requestedIp?: string;
    userAgent?: string;
  }) {
    return this.repository.review({ ...input, approve: false });
  }
}
