import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  type ThrottlerModuleOptions,
  type ThrottlerStorage,
} from '@nestjs/throttler';
import type { Request } from 'express';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions()
    options: ThrottlerModuleOptions,

    @InjectThrottlerStorage()
    storageService: ThrottlerStorage,

    reflector: Reflector,

    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    super(options, storageService, reflector);
  }

  protected override async getTracker(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req: Record<string, any>,
  ): Promise<string> {
    const request = req as unknown as Request;
    const authorization = request.headers.authorization;

    const secret = this.config.get<string>('JWT_ACCESS_SECRET');

    if (
      secret &&
      typeof authorization === 'string' &&
      authorization.startsWith('Bearer ')
    ) {
      try {
        const payload = await this.jwt.verifyAsync<{
          sub?: string;
        }>(authorization.slice(7), { secret });

        if (payload.sub) {
          return `user:${payload.sub}`;
        }
      } catch {
        // Invalid/missing auth falls back to IP-based throttling.
      }
    }

    const ip = await super.getTracker(req);

    return `ip:${ip}`;
  }
}
