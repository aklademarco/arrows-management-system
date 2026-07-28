import { AdminRegistrationRepository } from './admin-registration.repository';
import { AdminRegistrationService } from './admin-registration.service';

describe('AdminRegistrationService', () => {
  it('loads a registration within the administrator church', async () => {
    const findRegistration = jest.fn().mockResolvedValue({ id: 'user-id' });
    const repository = {
      findRegistration,
    } as unknown as AdminRegistrationRepository;
    const service = new AdminRegistrationService(repository);

    await service.findRegistration('user-id', 'church-id');

    expect(findRegistration).toHaveBeenCalledWith('user-id', 'church-id');
  });

  it('passes the confirmed primary department into the approval transaction', async () => {
    const review = jest.fn().mockResolvedValue(undefined);
    const repository = { review } as unknown as AdminRegistrationRepository;
    const service = new AdminRegistrationService(repository);

    await service.approve({
      userId: 'a65d7e4f-9dd6-40b5-8c83-431bd84f9f57',
      reviewerId: 'b76e8f50-aee7-40f7-9662-cb29a39ea168',
      reviewerChurchId: 'e091b273-d11a-40ca-8995-fe5cd621d49b',
      primaryDepartmentId: 'c87f9051-bff8-40a8-a773-dc3ab40fb279',
      additionalDepartmentIds: ['d980a162-c009-40b9-b884-ed4bc510c38a'],
      note: 'Membership confirmed.',
    });

    expect(review).toHaveBeenCalledWith({
      userId: 'a65d7e4f-9dd6-40b5-8c83-431bd84f9f57',
      reviewerId: 'b76e8f50-aee7-40f7-9662-cb29a39ea168',
      reviewerChurchId: 'e091b273-d11a-40ca-8995-fe5cd621d49b',
      primaryDepartmentId: 'c87f9051-bff8-40a8-a773-dc3ab40fb279',
      additionalDepartmentIds: ['d980a162-c009-40b9-b884-ed4bc510c38a'],
      note: 'Membership confirmed.',
      approve: true,
      reason: 'Membership confirmed.',
    });
  });
});
