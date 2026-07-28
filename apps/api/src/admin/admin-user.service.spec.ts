import { AdminUserRepository } from './admin-user.repository';
import { AdminUserService } from './admin-user.service';

describe('AdminUserService', () => {
  it('suspends only an active account and preserves the reason', async () => {
    const changeAccountStatus = jest.fn().mockResolvedValue(undefined);
    const service = new AdminUserService({
      changeAccountStatus,
    } as unknown as AdminUserRepository);

    await service.suspend({
      userId: 'user-id',
      actorUserId: 'admin-id',
      churchId: 'church-id',
      reason: 'Administrative review required.',
    });

    expect(changeAccountStatus).toHaveBeenCalledWith({
      userId: 'user-id',
      actorUserId: 'admin-id',
      churchId: 'church-id',
      reason: 'Administrative review required.',
      fromStatus: 'ACTIVE',
      toStatus: 'SUSPENDED',
    });
  });

  it('reactivates only a suspended account', async () => {
    const changeAccountStatus = jest.fn().mockResolvedValue(undefined);
    const service = new AdminUserService({
      changeAccountStatus,
    } as unknown as AdminUserRepository);

    await service.reactivate({
      userId: 'user-id',
      actorUserId: 'admin-id',
      churchId: 'church-id',
    });

    expect(changeAccountStatus).toHaveBeenCalledWith({
      userId: 'user-id',
      actorUserId: 'admin-id',
      churchId: 'church-id',
      fromStatus: 'SUSPENDED',
      toStatus: 'ACTIVE',
    });
  });
});
