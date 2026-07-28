import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'argon2';
import { LoginDto } from './dto/login.dto';
import { LoginRepository } from './login.repository';

@Injectable()
export class LoginService {
  constructor(
    private readonly repository: LoginRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
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

    const secret = this.config.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new InternalServerErrorException(
        'Access-token signing is not configured.',
      );
    }
    await this.repository.recordSuccess(account.id, now);
    const expiresIn = Number(
      this.config.get<string>('ACCESS_TOKEN_TTL_SECONDS') ?? 900,
    );
    const accessToken = await this.jwt.signAsync(
      { sub: account.id, email: account.email },
      { secret, expiresIn },
    );

    return {
      accessToken,
      user: {
        id: account.id,
        email: account.email,
        accountStatus: account.accountStatus,
        roles: account.roles,
      },
    };
  }
}
