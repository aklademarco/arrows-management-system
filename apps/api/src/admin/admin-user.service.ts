import { Injectable } from '@nestjs/common';
import { AdminUserRepository } from './admin-user.repository';

type LifecycleContext = {
  userId: string;
  actorUserId: string;
  churchId: string;
  requestedIp?: string;
  userAgent?: string;
};

@Injectable()
export class AdminUserService {
  constructor(private readonly repository: AdminUserRepository) {}

  suspend(input: LifecycleContext & { reason: string }) {
    return this.repository.changeAccountStatus({
      ...input,
      fromStatus: 'ACTIVE',
      toStatus: 'SUSPENDED',
    });
  }

  reactivate(input: LifecycleContext) {
    return this.repository.changeAccountStatus({
      ...input,
      fromStatus: 'SUSPENDED',
      toStatus: 'ACTIVE',
    });
  }
}
