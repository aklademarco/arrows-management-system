import { Controller, Get, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
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
  let app: NestExpressApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [RateLimitTestModule],
    }).compile();

    app = module.createNestApplication<NestExpressApplication>();

    app.set('trust proxy', 1);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('keeps forwarded client IPs in separate anonymous buckets', async () => {
    await request(app.getHttpServer())
      .get('/limited')
      .set('X-Forwarded-For', '203.0.113.10')
      .expect(200);

    await request(app.getHttpServer())
      .get('/limited')
      .set('X-Forwarded-For', '203.0.113.10')
      .expect(200);

    await request(app.getHttpServer())
      .get('/limited')
      .set('X-Forwarded-For', '203.0.113.10')
      .expect(429);

    await request(app.getHttpServer())
      .get('/limited')
      .set('X-Forwarded-For', '203.0.113.11')
      .expect(200);
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
