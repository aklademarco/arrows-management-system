import { Controller, Get, INestApplication, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppThrottlerGuard } from '../src/common/security/app-throttler.guard';

const TEST_SECRET = 'test-secret-that-is-at-least-32-characters';

@Controller('limited')
class LimitedController {
  @Get()
  check() {
    return {
      success: true,
    };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      load: [
        () => ({
          JWT_ACCESS_SECRET: TEST_SECRET,
        }),
      ],
    }),

    JwtModule.register({}),

    ThrottlerModule.forRoot([
      {
        limit: 2,
        ttl: 60_000,
      },
    ]),
  ],

  controllers: [LimitedController],

  providers: [
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
class RateLimitTestModule {}

describe('Rate limiting', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [RateLimitTestModule],
    }).compile();

    app = module.createNestApplication();

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 429 when an anonymous client exceeds its limit', async () => {
    await request(app.getHttpServer()).get('/limited').expect(200);

    await request(app.getHttpServer()).get('/limited').expect(200);

    await request(app.getHttpServer()).get('/limited').expect(429);
  });

  it('uses the verified user id for authenticated rate-limit buckets', async () => {
    const jwt = app.get(JwtService);

    const userA = await jwt.signAsync(
      {
        sub: 'user-a',
      },
      {
        secret: TEST_SECRET,
        expiresIn: 60,
      },
    );

    const userB = await jwt.signAsync(
      {
        sub: 'user-b',
      },
      {
        secret: TEST_SECRET,
        expiresIn: 60,
      },
    );

    await request(app.getHttpServer())
      .get('/limited')
      .set('Authorization', `Bearer ${userA}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/limited')
      .set('Authorization', `Bearer ${userA}`)
      .expect(200);

    // Same IP, different authenticated user.
    await request(app.getHttpServer())
      .get('/limited')
      .set('Authorization', `Bearer ${userB}`)
      .expect(200);

    // User A has exhausted only user A's quota.
    await request(app.getHttpServer())
      .get('/limited')
      .set('Authorization', `Bearer ${userA}`)
      .expect(429);
  });
});
