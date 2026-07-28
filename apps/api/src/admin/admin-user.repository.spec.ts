import { BadRequestException } from '@nestjs/common';
import type { Database } from '../database/database.module';
import { AdminUserRepository } from './admin-user.repository';

describe('AdminUserRepository', () => {
  it('rejects self-suspension before opening a transaction', async () => {
    const transaction = jest.fn();
    const repository = new AdminUserRepository({
      transaction,
    } as unknown as Database);

    await expect(
      repository.changeAccountStatus({
        userId: 'same-user',
        actorUserId: 'same-user',
        churchId: 'church-id',
        fromStatus: 'ACTIVE',
        toStatus: 'SUSPENDED',
        reason: 'Administrative review required.',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction).not.toHaveBeenCalled();
  });
});
