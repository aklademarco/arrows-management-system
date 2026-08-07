import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'argon2';
import { AccessTokenService } from './access-token.service';
import { LoginDto } from './dto/login.dto';
import { LoginRepository } from './login.repository';
import {
  RefreshTokenRepository,
  type RefreshTokenContext,
} from './refresh-token.repository';

export type LoginResult = {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
  user: {
    id: string;
    email: string;
    accountStatus: string;
    roles: string[];
  };
};

@Injectable()
export class LoginService {
  constructor(
    private readonly repository: LoginRepository,
    private readonly accessTokens: AccessTokenService,
    private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async login(
    dto: LoginDto,
    context: RefreshTokenContext = {},
  ): Promise<LoginResult> {
    const account = await this.repository.findByEmail(dto.email);
    const now = new Date();
    if (!account) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    if (account.lockedUntil && account.lockedUntil > now) {
      throw new UnauthorizedException(
        'Account temporarily locked. Try again later.',
      );
    }

    const passwordValid = await verify(account.passwordHash, dto.password);
    if (!passwordValid) {
      const attempts = account.failedLoginAttempts + 1;
      const lockedUntil =
        attempts >= 5 ? new Date(now.getTime() + 15 * 60 * 1000) : null;
      await this.repository.recordFailure(account.id, attempts, lockedUntil);
      throw new UnauthorizedException('Invalid email or password.');
    }
    if (account.accountStatus !== 'ACTIVE') {
      throw new ForbiddenException(
        `This account is ${account.accountStatus.toLowerCase().replaceAll('_', ' ')}.`,
      );
    }

    await this.repository.recordSuccess(account.id, now);
    const accessToken = await this.accessTokens.sign({
      id: account.id,
      email: account.email,
    });
    const issued = await this.refreshTokens.issue(
      account.id,
      this.accessTokens.refreshTtlSeconds(),
      context,
      now,
    );

    return {
      accessToken,
      refreshToken: issued.token,
      refreshExpiresAt: issued.expiresAt,
      user: {
        id: account.id,
        email: account.email,
        accountStatus: account.accountStatus,
        roles: account.roles,
      },
    };
  }
}
