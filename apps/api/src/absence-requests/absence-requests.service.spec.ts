import { NotFoundException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/authenticated.guard';
import { AbsenceRequestsRepository } from './absence-requests.repository';
import { AbsenceRequestsService } from './absence-requests.service';

const member: AuthenticatedPrincipal = {
  id: 'user-id',
  churchId: 'church-id',
  email: 'member@example.com',
  roles: ['MEMBER'],
};

describe('AbsenceRequestsService cancellation', () => {
  it('cancels a request through the owning member profile', async () => {
    const repository = {
      findActiveMemberId: jest.fn().mockResolvedValue('member-id'),
      cancel: jest.fn().mockResolvedValue({
        id: 'request-id',
        status: 'CANCELLED',
      }),
    } as unknown as AbsenceRequestsRepository;
    const service = new AbsenceRequestsService(repository);

    await service.cancel('request-id', member);

    // Repository methods are Jest mocks in this focused unit test.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.cancel).toHaveBeenCalledWith(
      'request-id',
      'member-id',
      member,
    );
  });

  it('does not expose cancellation without an active member profile', async () => {
    const repository = {
      findActiveMemberId: jest.fn().mockResolvedValue(null),
      cancel: jest.fn(),
    } as unknown as AbsenceRequestsRepository;
    const service = new AbsenceRequestsService(repository);

    await expect(service.cancel('request-id', member)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.cancel).not.toHaveBeenCalled();
  });
});
