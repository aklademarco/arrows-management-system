import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AccessTokenService } from './access-token.service';
import { CurrentUserRepository } from './current-user.repository';
import {
  RefreshTokenRepository,
  type RefreshTokenContext,
} from './refresh-token.repository';

export type RefreshResult = {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
};

@Injectable()
export class SessionService {
  constructor(
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly accessTokens: AccessTokenService,
    private readonly accounts: CurrentUserRepository,
  ) {}

  async refresh(
    rawToken: string | undefined,
    context: RefreshTokenContext = {},
  ): Promise<RefreshResult> {
    if (!rawToken) {
      throw new UnauthorizedException('Refresh token missing.');
    }
    const rotation = await this.refreshTokens.rotate(
      rawToken,
      this.accessTokens.refreshTtlSeconds(),
      context,
    );
    if (rotation.outcome !== 'ROTATED') {
      throw new UnauthorizedException('Session is no longer valid.');
    }

    const account = await this.accounts.findAccount(rotation.userId);
    if (!account || account.accountStatus !== 'ACTIVE') {
      await this.refreshTokens.revokeAllForUser(rotation.userId);
      throw new UnauthorizedException('Session is no longer valid.');
    }

    const accessToken = await this.accessTokens.sign({
      id: account.id,
      email: account.email,
    });
    return {
      accessToken,
      refreshToken: rotation.issued.token,
      refreshExpiresAt: rotation.issued.expiresAt,
    };
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (rawToken) {
      await this.refreshTokens.revoke(rawToken);
    }
  }
}
