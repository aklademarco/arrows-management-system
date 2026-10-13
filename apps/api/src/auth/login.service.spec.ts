import { PushDevicesRepository } from '../notifications/push-devices.repository';
import { hash } from 'argon2';
import { AccessTokenService } from './access-token.service';
import { LoginRepository } from './login.repository';
import { LoginService } from './login.service';
import { RefreshTokenRepository } from './refresh-token.repository';

describe('LoginService', () => {
  it('issues an access token and a refresh session for a valid active account', async () => {
    const recordSuccess = jest.fn().mockResolvedValue(undefined);
    const repository = {
      findByEmail: jest.fn().mockResolvedValue({
        id: 'a65d7e4f-9dd6-40b5-8c83-431bd84f9f57',
        churchId: 'e091b273-d11a-40ca-8995-fe5cd621d49b',
        email: 'admin@example.com',
        passwordHash: await hash('StrongPassword123!'),
        emailVerifiedAt: new Date(),
        accountStatus: 'ACTIVE',
        failedLoginAttempts: 0,
        lockedUntil: null,
        roles: ['SUPER_ADMIN'],
      }),
      recordSuccess,
    } as unknown as LoginRepository;
    const accessTokens = {
      sign: jest.fn().mockResolvedValue('signed-access-token'),
      refreshTtlSeconds: jest.fn().mockReturnValue(2592000),
    } as unknown as AccessTokenService;
    const refreshExpiresAt = new Date('2026-09-06T00:00:00.000Z');
    const refreshTokens = {
      issue: jest.fn().mockResolvedValue({
        token: 'opaque-refresh-token',
        expiresAt: refreshExpiresAt,
      }),
    } as unknown as RefreshTokenRepository;
    const service = new LoginService(
      repository,
      accessTokens,
      refreshTokens,
      {} as PushDevicesRepository,
    );

    const result = await service.login({
      email: 'admin@example.com',
      password: 'StrongPassword123!',
    });

    expect(result.accessToken).toBe('signed-access-token');
    expect(result.refreshToken).toBe('opaque-refresh-token');
    expect(result.refreshExpiresAt).toBe(refreshExpiresAt);
    expect(result.user.roles).toEqual(['SUPER_ADMIN']);
    expect(recordSuccess).toHaveBeenCalled();
  });

  it('records a failed password attempt without revealing the account', async () => {
    const recordFailure = jest.fn().mockResolvedValue(undefined);
    const repository = {
      findByEmail: jest.fn().mockResolvedValue({
        id: 'a65d7e4f-9dd6-40b5-8c83-431bd84f9f57',
        churchId: 'e091b273-d11a-40ca-8995-fe5cd621d49b',
        email: 'admin@example.com',
        passwordHash: await hash('StrongPassword123!'),
        emailVerifiedAt: new Date(),
        accountStatus: 'ACTIVE',
        failedLoginAttempts: 0,
        lockedUntil: null,
        roles: ['SUPER_ADMIN'],
      }),
      recordFailure,
    } as unknown as LoginRepository;
    const service = new LoginService(
      repository,
      {} as AccessTokenService,
      {} as RefreshTokenRepository,
      {} as PushDevicesRepository,
    );

    await expect(
      service.login({
        email: 'admin@example.com',
        password: 'WrongPassword123!',
      }),
    ).rejects.toThrow('Invalid email or password.');
    expect(recordFailure).toHaveBeenCalledWith(
      'a65d7e4f-9dd6-40b5-8c83-431bd84f9f57',
      1,
      null,
    );
  });

  it('returns approval status only after validating the password', async () => {
    const repository = {
      findByEmail: jest.fn().mockResolvedValue({
        id: 'pending',
        churchId: 'church',
        email: 'member@example.com',
        passwordHash: await hash('StrongPassword123!'),
        emailVerifiedAt: new Date(),
        accountStatus: 'PENDING_APPROVAL',
        failedLoginAttempts: 0,
        lockedUntil: null,
        roles: ['MEMBER'],
      }),
      recordSuccess: jest.fn(),
    } as unknown as LoginRepository;
    const result = await new LoginService(
      repository,
      {} as AccessTokenService,
      {} as RefreshTokenRepository,
      {} as PushDevicesRepository,
    ).accountStatus({
      email: 'member@example.com',
      password: 'StrongPassword123!',
    });
    expect(result).toEqual({
      accountStatus: 'PENDING_APPROVAL',
      emailVerified: true,
    });
  });
});

it('registers approval push only for verified pending accounts after checking their password', async () => {
  const account = {
    id: 'applicant',
    churchId: 'church',
    email: 'member@example.test',
    passwordHash: await hash('StrongPassword123!'),
    emailVerifiedAt: new Date() as Date | null,
    accountStatus: 'PENDING_APPROVAL',
    failedLoginAttempts: 0,
    lockedUntil: null,
  };
  const repository = {
    findByEmail: jest.fn().mockResolvedValue(account),
    recordSuccess: jest.fn(),
    recordFailure: jest.fn(),
  };
  const update = jest.fn().mockResolvedValue('device-cleanup-secret');
  const service = new LoginService(
    repository as unknown as LoginRepository,
    {} as AccessTokenService,
    {} as RefreshTokenRepository,
    { update } as unknown as PushDevicesRepository,
  );
  const input = {
    email: account.email,
    password: 'StrongPassword123!',
    pushToken: 'device:token',
  };
  await expect(
    service.accountStatus({ ...input, password: 'wrong' }),
  ).rejects.toThrow('Invalid email or password');
  expect(update).not.toHaveBeenCalled();
  account.emailVerifiedAt = null;
  await service.accountStatus(input);
  expect(update).not.toHaveBeenCalled();
  account.emailVerifiedAt = new Date();
  expect(await service.accountStatus(input)).toMatchObject({
    pushRegistered: true,
  });
  expect(update).toHaveBeenCalledWith(
    'device:token',
    true,
    expect.objectContaining({ id: account.id, churchId: account.churchId }),
    true,
  );
});
