import { ConfigService } from '@nestjs/config';
import { verify } from 'argon2';
import type { EmailDelivery } from '../mail/email-delivery';
import { AuthService } from './auth.service';
import { EmailVerificationRepository } from './email-verification.repository';
import {
  NewRegistration,
  RegistrationRepository,
} from './registration.repository';

describe('AuthService', () => {
  it('creates a pending registration with hashed secrets', async () => {
    let saved: NewRegistration | undefined;
    const repository = {
      create: jest.fn((input: NewRegistration) => {
        saved = input;
        return Promise.resolve('a65d7e4f-9dd6-40b5-8c83-431bd84f9f57');
      }),
    } as unknown as RegistrationRepository;
    const config = {
      get: jest.fn(() => '00000000-0000-4000-8000-000000000001'),
    } as unknown as ConfigService;
    const emailVerificationRepository =
      {} as unknown as EmailVerificationRepository;
    const emailDelivery = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    } satisfies EmailDelivery;
    const service = new AuthService(
      repository,
      emailVerificationRepository,
      config,
      emailDelivery,
    );

    const result = await service.register(
      {
        firstName: 'Bismark',
        lastName: 'Marco',
        email: 'bismark@example.com',
        password: 'StrongPassword123!',
      },
      '127.0.0.1',
    );

    expect(result).toEqual({
      userId: 'a65d7e4f-9dd6-40b5-8c83-431bd84f9f57',
      accountStatus: 'PENDING_APPROVAL',
      emailVerificationRequired: true,
      verificationEmailSent: true,
    });
    expect(saved).toBeDefined();
    expect(saved?.passwordHash).not.toContain('StrongPassword123!');
    await expect(
      verify(saved?.passwordHash ?? '', 'StrongPassword123!'),
    ).resolves.toBe(true);
    expect(saved?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(saved?.tokenExpiresAt.getTime()).toBeGreaterThan(
      Date.now() + 23 * 60 * 60 * 1000,
    );
    expect(emailDelivery.sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: 'bismark@example.com',
        firstName: 'Bismark',
        token: expect.any(String) as string,
      }),
    );
  });

  it('replaces and sends an email-verification token', async () => {
    const replaceToken = jest.fn().mockResolvedValue(undefined);
    const emailVerificationRepository = {
      findCandidate: jest.fn().mockResolvedValue({
        id: 'a65d7e4f-9dd6-40b5-8c83-431bd84f9f57',
        email: 'bismark@example.com',
        firstName: 'Bismark',
        emailVerifiedAt: null,
      }),
      mayIssueToken: jest.fn().mockResolvedValue(true),
      replaceToken,
    } as unknown as EmailVerificationRepository;
    const emailDelivery = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    } satisfies EmailDelivery;
    const service = new AuthService(
      {} as RegistrationRepository,
      emailVerificationRepository,
      {} as ConfigService,
      emailDelivery,
    );

    await service.requestEmailVerification('bismark@example.com', '127.0.0.1');

    expect(replaceToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'a65d7e4f-9dd6-40b5-8c83-431bd84f9f57',
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/) as string,
        requestedIp: '127.0.0.1',
      }),
    );
    expect(emailDelivery.sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: 'bismark@example.com',
        token: expect.any(String) as string,
      }),
    );
  });

  it('hashes and consumes a submitted verification token', async () => {
    const consumeToken = jest.fn().mockResolvedValue(undefined);
    const emailVerificationRepository = {
      consumeToken,
    } as unknown as EmailVerificationRepository;
    const service = new AuthService(
      {} as RegistrationRepository,
      emailVerificationRepository,
      {} as ConfigService,
      {
        sendVerificationEmail: jest.fn(),
        sendPasswordResetEmail: jest.fn(),
      },
    );

    await service.confirmEmailVerification(
      'valid-verification-token-with-more-than-32-characters',
    );

    expect(consumeToken).toHaveBeenCalledWith(
      expect.stringMatching(/^[a-f0-9]{64}$/),
      expect.any(Date),
    );
  });
});
