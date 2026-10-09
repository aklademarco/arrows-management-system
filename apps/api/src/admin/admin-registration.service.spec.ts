import type { EmailDelivery } from '../mail/email-delivery';
import { AuthService } from '../auth/auth.service';
import { AdminRegistrationRepository } from './admin-registration.repository';
import { AdminRegistrationService } from './admin-registration.service';

const emailDelivery = {
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendAccountApprovedEmail: jest.fn().mockResolvedValue(undefined),
  sendAttendanceReportEmail: jest.fn(),
} satisfies EmailDelivery;

const authService = {
  requestEmailVerification: jest.fn(),
} as unknown as AuthService;

describe('AdminRegistrationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads a registration within the administrator church', async () => {
    const findRegistration = jest.fn().mockResolvedValue({
      id: 'user-id',
    });

    const repository = {
      findRegistration,
    } as unknown as AdminRegistrationRepository;

    const service = new AdminRegistrationService(
      repository,
      authService,
      emailDelivery,
    );

    await service.findRegistration('user-id', 'church-id');

    expect(findRegistration).toHaveBeenCalledWith('user-id', 'church-id');
  });

  it('passes the confirmed primary department into the approval transaction and sends the approval email', async () => {
    const findRegistration = jest.fn().mockResolvedValue({
      id: 'a65d7e4f-9dd6-40b5-8c83-431bd84f9f57',
      email: 'bismark@example.com',
      firstName: 'Bismark',
    });

    const review = jest.fn().mockResolvedValue(undefined);

    const repository = {
      findRegistration,
      review,
    } as unknown as AdminRegistrationRepository;

    const service = new AdminRegistrationService(
      repository,
      authService,
      emailDelivery,
    );

    await service.approve({
      userId: 'a65d7e4f-9dd6-40b5-8c83-431bd84f9f57',
      reviewerId: 'b76e8f50-aee7-40f7-9662-cb29a39ea168',
      reviewerChurchId: 'e091b273-d11a-40ca-8995-fe5cd621d49b',
      primaryDepartmentId: 'c87f9051-bff8-40a8-a773-dc3ab40fb279',
      additionalDepartmentIds: ['d980a162-c009-40b9-b884-ed4bc510c38a'],
      note: 'Membership confirmed.',
    });

    expect(findRegistration).toHaveBeenCalledWith(
      'a65d7e4f-9dd6-40b5-8c83-431bd84f9f57',
      'e091b273-d11a-40ca-8995-fe5cd621d49b',
    );

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

    expect(emailDelivery.sendAccountApprovedEmail).toHaveBeenCalledWith({
      recipient: 'bismark@example.com',
      firstName: 'Bismark',
    });
  });

  it('keeps the account approved when the approval email fails', async () => {
    const findRegistration = jest.fn().mockResolvedValue({
      id: 'a65d7e4f-9dd6-40b5-8c83-431bd84f9f57',
      email: 'bismark@example.com',
      firstName: 'Bismark',
    });

    const review = jest.fn().mockResolvedValue(undefined);

    const repository = {
      findRegistration,
      review,
    } as unknown as AdminRegistrationRepository;

    emailDelivery.sendAccountApprovedEmail.mockRejectedValueOnce(
      new Error('Resend unavailable'),
    );

    const service = new AdminRegistrationService(
      repository,
      authService,
      emailDelivery,
    );

    await expect(
      service.approve({
        userId: 'a65d7e4f-9dd6-40b5-8c83-431bd84f9f57',
        reviewerId: 'b76e8f50-aee7-40f7-9662-cb29a39ea168',
        reviewerChurchId: 'e091b273-d11a-40ca-8995-fe5cd621d49b',
        primaryDepartmentId: 'c87f9051-bff8-40a8-a773-dc3ab40fb279',
        note: 'Membership confirmed.',
      }),
    ).resolves.toBeUndefined();

    expect(review).toHaveBeenCalled();

    expect(emailDelivery.sendAccountApprovedEmail).toHaveBeenCalledWith({
      recipient: 'bismark@example.com',
      firstName: 'Bismark',
    });
  });

  it('sends and audits a verification reminder for an unverified pending registration', async () => {
    const findRegistration = jest.fn().mockResolvedValue({
      id: 'a65d7e4f-9dd6-40b5-8c83-431bd84f9f57',
      email: 'bismark@example.com',
      accountStatus: 'PENDING_APPROVAL',
      emailVerifiedAt: null,
    });
    const recordVerificationReminderRequest = jest
      .fn()
      .mockResolvedValue(undefined);
    const repository = {
      findRegistration,
      recordVerificationReminderRequest,
    } as unknown as AdminRegistrationRepository;
    const requestEmailVerification = jest.fn().mockResolvedValue('SENT');
    const reminderAuthService = {
      requestEmailVerification,
    } as unknown as AuthService;
    const service = new AdminRegistrationService(
      repository,
      reminderAuthService,
      emailDelivery,
    );
    const input = {
      userId: 'a65d7e4f-9dd6-40b5-8c83-431bd84f9f57',
      reviewerId: 'b76e8f50-aee7-40f7-9662-cb29a39ea168',
      reviewerChurchId: 'e091b273-d11a-40ca-8995-fe5cd621d49b',
      requestedIp: '127.0.0.1',
      userAgent: 'Jest',
    };

    await expect(
      service.sendVerificationReminder(input),
    ).resolves.toBeUndefined();

    expect(findRegistration).toHaveBeenCalledWith(
      input.userId,
      input.reviewerChurchId,
    );
    expect(recordVerificationReminderRequest).toHaveBeenCalledWith(input);
    expect(requestEmailVerification).toHaveBeenCalledWith(
      'bismark@example.com',
      '127.0.0.1',
    );
  });

  it('does not send a reminder after the email has been verified', async () => {
    const repository = {
      findRegistration: jest.fn().mockResolvedValue({
        email: 'bismark@example.com',
        accountStatus: 'PENDING_APPROVAL',
        emailVerifiedAt: new Date(),
      }),
      recordVerificationReminderRequest: jest.fn(),
    } as unknown as AdminRegistrationRepository;
    const requestEmailVerification = jest.fn();
    const service = new AdminRegistrationService(
      repository,
      { requestEmailVerification } as unknown as AuthService,
      emailDelivery,
    );

    await expect(
      service.sendVerificationReminder({
        userId: 'a65d7e4f-9dd6-40b5-8c83-431bd84f9f57',
        reviewerId: 'b76e8f50-aee7-40f7-9662-cb29a39ea168',
        reviewerChurchId: 'e091b273-d11a-40ca-8995-fe5cd621d49b',
      }),
    ).rejects.toThrow('already verified');
    expect(requestEmailVerification).not.toHaveBeenCalled();
  });

  it('reports the verification-email cooldown to the administrator', async () => {
    const repository = {
      findRegistration: jest.fn().mockResolvedValue({
        email: 'bismark@example.com',
        accountStatus: 'PENDING_APPROVAL',
        emailVerifiedAt: null,
      }),
      recordVerificationReminderRequest: jest.fn().mockResolvedValue(undefined),
    } as unknown as AdminRegistrationRepository;
    const service = new AdminRegistrationService(
      repository,
      {
        requestEmailVerification: jest.fn().mockResolvedValue('RATE_LIMITED'),
      } as unknown as AuthService,
      emailDelivery,
    );

    await expect(
      service.sendVerificationReminder({
        userId: 'a65d7e4f-9dd6-40b5-8c83-431bd84f9f57',
        reviewerId: 'b76e8f50-aee7-40f7-9662-cb29a39ea168',
        reviewerChurchId: 'e091b273-d11a-40ca-8995-fe5cd621d49b',
      }),
    ).rejects.toMatchObject({ status: 429 });
  });

  it('reports a provider failure to the administrator', async () => {
    const repository = {
      findRegistration: jest.fn().mockResolvedValue({
        email: 'bismark@example.com',
        accountStatus: 'PENDING_APPROVAL',
        emailVerifiedAt: null,
      }),
      recordVerificationReminderRequest: jest.fn().mockResolvedValue(undefined),
    } as unknown as AdminRegistrationRepository;
    const service = new AdminRegistrationService(
      repository,
      {
        requestEmailVerification: jest
          .fn()
          .mockResolvedValue('DELIVERY_FAILED'),
      } as unknown as AuthService,
      emailDelivery,
    );

    await expect(
      service.sendVerificationReminder({
        userId: 'a65d7e4f-9dd6-40b5-8c83-431bd84f9f57',
        reviewerId: 'b76e8f50-aee7-40f7-9662-cb29a39ea168',
        reviewerChurchId: 'e091b273-d11a-40ca-8995-fe5cd621d49b',
      }),
    ).rejects.toMatchObject({ status: 503 });
  });
});
