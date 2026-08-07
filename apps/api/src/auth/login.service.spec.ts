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
    const service = new LoginService(repository, accessTokens, refreshTokens);

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
