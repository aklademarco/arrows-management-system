import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { Server } from 'node:http';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushDevicesService } from './push-devices.service';
import { PushDevicesRepository } from './push-devices.repository';

const user = {
  id: 'member',
  churchId: 'church',
  email: 'member@example.com',
  roles: ['MEMBER'],
};
describe('Push device API', () => {
  let app: INestApplication;
  const update = jest.fn().mockResolvedValue(undefined);
  let authenticated = true;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: {} },
        PushDevicesService,
        { provide: PushDevicesRepository, useValue: { update } },
      ],
    })
      .overrideGuard(AuthenticatedGuard)
      .useValue({
        canActivate(context: {
          switchToHttp(): { getRequest(): { user?: typeof user } };
        }) {
          context.switchToHttp().getRequest().user = user;
          return authenticated;
        },
      })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });
  beforeEach(() => {
    authenticated = true;
    update.mockClear();
  });
  afterAll(async () => {
    await app.close();
  });

  it('passes authenticated identity to registration and revocation', async () => {
    await request(app.getHttpServer() as Server)
      .put('/notifications/push-device')
      .send({ token: 'device:token' })
      .expect(200);
    expect(update).toHaveBeenLastCalledWith(
      'device:token',
      true,
      user,
      false,
      undefined,
    );
    await request(app.getHttpServer() as Server)
      .delete('/notifications/push-device')
      .send({ token: 'device:token' })
      .expect(200);
    expect(update).toHaveBeenLastCalledWith(
      'device:token',
      false,
      user,
      false,
      undefined,
    );
  });
  it('rejects forged ownership and malformed tokens', async () => {
    for (const body of [
      { token: 'device:token', userId: 'another-user' },
      { token: '' },
      { token: 123 },
      { token: 'a'.repeat(4097) },
    ]) {
      await request(app.getHttpServer() as Server)
        .put('/notifications/push-device')
        .send(body)
        .expect(400);
    }
    expect(update).not.toHaveBeenCalled();
  });
  it('requires authentication for both mutations', async () => {
    authenticated = false;
    await request(app.getHttpServer() as Server)
      .put('/notifications/push-device')
      .send({ token: 'device:token' })
      .expect(403);
    await request(app.getHttpServer() as Server)
      .delete('/notifications/push-device')
      .send({ token: 'device:token' })
      .expect(403);
    expect(update).not.toHaveBeenCalled();
  });
});
