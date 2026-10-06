import { BadRequestException } from '@nestjs/common';
import { hash } from 'argon2';

import type { EmailDelivery } from '../mail/email-delivery';
import { PasswordResetRepository } from './password-reset.repository';
import { PasswordResetService } from './password-reset.service';

jest.mock('argon2', () => ({
  hash: jest.fn(),
}));

const mockedHash = jest.mocked(hash);

const emailDelivery = {
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendAccountApprovedEmail: jest.fn(),
  sendAttendanceReportEmail: jest.fn(),
} satisfies EmailDelivery;

describe('PasswordResetService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects an invalid reset token before hashing the new password', async () => {
    const consumeToken = jest.fn();

    const repository = {
      isTokenUsable: jest.fn().mockResolvedValue(false),
      consumeToken,
    } as unknown as PasswordResetRepository;

    const service = new PasswordResetService(repository, emailDelivery);

    await expect(
      service.confirmReset('invalid-reset-token', 'new-password'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(mockedHash).not.toHaveBeenCalled();
    expect(consumeToken).not.toHaveBeenCalled();
  });

  it('hashes the password only after the reset token passes validation', async () => {
    const consumeToken = jest.fn().mockResolvedValue(undefined);

    const repository = {
      isTokenUsable: jest.fn().mockResolvedValue(true),
      consumeToken,
    } as unknown as PasswordResetRepository;

    mockedHash.mockResolvedValue('hashed-password');

    const service = new PasswordResetService(repository, emailDelivery);

    await service.confirmReset('valid-reset-token', 'new-password');

    expect(mockedHash).toHaveBeenCalledTimes(1);

    expect(consumeToken).toHaveBeenCalledWith(
      expect.stringMatching(/^[a-f0-9]{64}$/),
      'hashed-password',
      expect.any(Date),
    );
  });
});
