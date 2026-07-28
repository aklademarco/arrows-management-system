import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { LoginRepository } from './login.repository';

export type AuthenticatedPrincipal = {
  id: string;
  churchId: string;
  email: string;
  roles: string[];
};

export type AuthenticatedRequest = Request & {
  user: AuthenticatedPrincipal;
};

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly accounts: LoginRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : undefined;
    const secret = this.config.get<string>('JWT_ACCESS_SECRET');
    if (!token || !secret) {
      throw new UnauthorizedException();
    }

    let payload: { sub: string; email: string };
    try {
      payload = await this.jwt.verifyAsync(token, { secret });
    } catch {
      throw new UnauthorizedException();
    }
    const account = await this.accounts.findByEmail(payload.email);
    if (
      !account ||
      account.id !== payload.sub ||
      account.accountStatus !== 'ACTIVE'
    ) {
      throw new UnauthorizedException();
    }
    request.user = {
      id: account.id,
      churchId: account.churchId,
      email: account.email,
      roles: account.roles,
    };
    return true;
  }
}
