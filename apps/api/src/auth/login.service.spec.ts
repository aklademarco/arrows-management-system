import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'argon2';
import { LoginRepository } from './login.repository';
import { LoginService } from './login.service';

describe('LoginService', () => {
  it('returns a signed access token for a valid active account', async () => {
    const recordSuccess = jest.fn().mockResolvedValue(undefined);
    const repository = {
      findByEmail: jest.fn().mockResolvedValue({
        id: 'a65d7e4f-9dd6-40b5-8c83-431bd84f9f57',
        churchId: 'e091b273-d11a-40ca-8995-fe5cd621d49b',
        email: 'admin@example.com',
        passwordHash: await hash('StrongPassword123!'),
        accountStatus: 'ACTIVE',
        failedLoginAttempts: 0,
        lockedUntil: null,
        roles: ['SUPER_ADMIN'],
      }),
      recordSuccess,
    } as unknown as LoginRepository;
    const jwt = {
      signAsync: jest.fn().mockResolvedValue('signed-access-token'),
    } as unknown as JwtService;
    const config = {
      get: jest.fn((key: string) =>
        key === 'JWT_ACCESS_SECRET' ? 'test-secret' : '900',
      ),
    } as unknown as ConfigService;
    const service = new LoginService(repository, jwt, config);

    const result = await service.login({
      email: 'admin@example.com',
      password: 'StrongPassword123!',
    });

    expect(result.accessToken).toBe('signed-access-token');
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
        accountStatus: 'ACTIVE',
        failedLoginAttempts: 0,
        lockedUntil: null,
        roles: ['SUPER_ADMIN'],
      }),
      recordFailure,
    } as unknown as LoginRepository;
    const service = new LoginService(
      repository,
      {} as JwtService,
      {} as ConfigService,
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
});
