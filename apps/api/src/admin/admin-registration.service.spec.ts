import { AdminRegistrationRepository } from './admin-registration.repository';
import { AdminRegistrationService } from './admin-registration.service';

describe('AdminRegistrationService', () => {
  it('passes the confirmed primary department into the approval transaction', async () => {
    const review = jest.fn().mockResolvedValue(undefined);
    const repository = { review } as unknown as AdminRegistrationRepository;
    const service = new AdminRegistrationService(repository);

    await service.approve({
      userId: 'a65d7e4f-9dd6-40b5-8c83-431bd84f9f57',
      reviewerId: 'b76e8f50-aee7-40f7-9662-cb29a39ea168',
      primaryDepartmentId: 'c87f9051-bff8-40a8-a773-dc3ab40fb279',
      note: 'Membership confirmed.',
    });

    expect(review).toHaveBeenCalledWith({
      userId: 'a65d7e4f-9dd6-40b5-8c83-431bd84f9f57',
      reviewerId: 'b76e8f50-aee7-40f7-9662-cb29a39ea168',
      primaryDepartmentId: 'c87f9051-bff8-40a8-a773-dc3ab40fb279',
      note: 'Membership confirmed.',
      approve: true,
      reason: 'Membership confirmed.',
    });
  });
});
