import { ConfigService } from '@nestjs/config';
import { verify } from 'argon2';
import { AuthService } from './auth.service';
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
    const service = new AuthService(repository, config);

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
  });
});
