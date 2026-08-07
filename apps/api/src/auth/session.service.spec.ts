import { UnauthorizedException } from '@nestjs/common';
import { AccessTokenService } from './access-token.service';
import { CurrentUserRepository } from './current-user.repository';
import { RefreshTokenRepository } from './refresh-token.repository';
import { SessionService } from './session.service';

const USER_ID = 'a65d7e4f-9dd6-40b5-8c83-431bd84f9f57';

function buildService(overrides: {
  refreshTokens?: Partial<RefreshTokenRepository>;
  accessTokens?: Partial<AccessTokenService>;
  accounts?: Partial<CurrentUserRepository>;
}) {
  const refreshTokens = {
    rotate: jest.fn(),
    revokeAllForUser: jest.fn().mockResolvedValue(undefined),
    revoke: jest.fn().mockResolvedValue(undefined),
    ...overrides.refreshTokens,
  } as unknown as RefreshTokenRepository;
  const accessTokens = {
    sign: jest.fn().mockResolvedValue('new-access-token'),
    refreshTtlSeconds: jest.fn().mockReturnValue(2592000),
    ...overrides.accessTokens,
  } as unknown as AccessTokenService;
  const accounts = {
    findAccount: jest.fn(),
    ...overrides.accounts,
  } as unknown as CurrentUserRepository;
  return {
    service: new SessionService(refreshTokens, accessTokens, accounts),
    refreshTokens,
    accessTokens,
    accounts,
  };
}

describe('SessionService', () => {
  it('rotates the token and signs a fresh access token for an active account', async () => {
    const issued = {
      token: 'next-refresh-token',
      expiresAt: new Date('2026-09-06T00:00:00.000Z'),
    };
    const { service } = buildService({
      refreshTokens: {
        rotate: jest
          .fn()
          .mockResolvedValue({ outcome: 'ROTATED', userId: USER_ID, issued }),
      },
      accounts: {
        findAccount: jest
          .fn()
          .mockResolvedValue({ id: USER_ID, accountStatus: 'ACTIVE' }),
      },
    });

    const result = await service.refresh('presented-token');

    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('next-refresh-token');
    expect(result.refreshExpiresAt).toBe(issued.expiresAt);
  });

  it('rejects a missing refresh token', async () => {
    const { service } = buildService({});
    await expect(service.refresh(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects when rotation does not succeed', async () => {
    const { service } = buildService({
      refreshTokens: {
        rotate: jest.fn().mockResolvedValue({ outcome: 'INVALID' }),
      },
    });
    await expect(service.refresh('stale-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('revokes all sessions when the rotated account is no longer active', async () => {
    const revokeAllForUser = jest.fn().mockResolvedValue(undefined);
    const { service } = buildService({
      refreshTokens: {
        rotate: jest.fn().mockResolvedValue({
          outcome: 'ROTATED',
          userId: USER_ID,
          issued: { token: 't', expiresAt: new Date('2026-09-06T00:00:00Z') },
        }),
        revokeAllForUser,
      },
      accounts: {
        findAccount: jest
          .fn()
          .mockResolvedValue({ id: USER_ID, accountStatus: 'SUSPENDED' }),
      },
    });

    await expect(service.refresh('presented-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(revokeAllForUser).toHaveBeenCalledWith(USER_ID);
  });
});
