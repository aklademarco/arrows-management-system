import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 900;
const DEFAULT_REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

@Injectable()
export class AccessTokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async sign(user: { id: string; email: string }): Promise<string> {
    const secret = this.config.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new InternalServerErrorException(
        'Access-token signing is not configured.',
      );
    }
    return this.jwt.signAsync(
      { sub: user.id, email: user.email },
      { secret, expiresIn: this.accessTtlSeconds() },
    );
  }

  accessTtlSeconds(): number {
    return Number(
      this.config.get<string>('ACCESS_TOKEN_TTL_SECONDS') ??
        DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
    );
  }

  refreshTtlSeconds(): number {
    return Number(
      this.config.get<string>('REFRESH_TOKEN_TTL_SECONDS') ??
        DEFAULT_REFRESH_TOKEN_TTL_SECONDS,
    );
  }
}
