import { ConfigService } from '@nestjs/config';
import { generateKeyPairSync } from 'node:crypto';
import { FcmProvider } from './fcm.provider';

const privateKey = generateKeyPairSync('rsa', { modulusLength: 2048 })
  .privateKey.export({ type: 'pkcs8', format: 'pem' })
  .toString();
const input = {
  token: 'private-device-token',
  notificationId: 'notice-id',
  title: 'New church message',
  link: '/notifications',
  ttlSeconds: 3600,
};
const json = (body: unknown, status = 200, headers?: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers });
let fetchMock: jest.SpiedFunction<typeof fetch>;
let provider: FcmProvider;
beforeEach(() => {
  provider = new FcmProvider(
    new ConfigService({
      PUSH_ENABLED: 'true',
      FCM_PROJECT_ID: 'test-project',
      FCM_CLIENT_EMAIL: 'test@example.test',
      FCM_PRIVATE_KEY: privateKey,
    }),
  );
  fetchMock = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(
      json({ access_token: 'oauth-access', expires_in: 3600 }),
    );
});
afterEach(() => jest.restoreAllMocks());
it('uses OAuth and data-only payloads with a stable notification ID and TTL', async () => {
  fetchMock.mockResolvedValue(json({ name: 'message-id' }));
  expect(await provider.send(input)).toEqual({ success: true });
  const oauth = fetchMock.mock.calls[0];
  expect(oauth[0]).toBe('https://oauth2.googleapis.com/token');
  const params = oauth[1]?.body as URLSearchParams;
  const payload = JSON.parse(
    Buffer.from(params.get('assertion')!.split('.')[1], 'base64url').toString(),
  ) as { scope: string; aud: string };
  expect(payload.scope).toBe(
    'https://www.googleapis.com/auth/firebase.messaging',
  );
  expect(payload.aud).toBe('https://oauth2.googleapis.com/token');
  const send = fetchMock.mock.calls[1];
  expect(send[0]).toBe(
    'https://fcm.googleapis.com/v1/projects/test-project/messages:send',
  );
  expect(send[1]?.headers).toEqual({
    Authorization: 'Bearer oauth-access',
    'Content-Type': 'application/json',
  });
  const body = JSON.parse(send[1]?.body as string) as {
    message: {
      notification?: unknown;
      data: { notificationId: string };
      webpush: { headers: { TTL: string } };
    };
  };
  expect(body.message.notification).toBeUndefined();
  expect(body.message.data.notificationId).toBe('notice-id');
  expect(body.message.webpush.headers.TTL).toBe('3600');
  await provider.send(input);
  expect(fetchMock).toHaveBeenCalledTimes(3); // Cached OAuth token.
});
it('revokes only explicit unregistered-device failures', async () => {
  fetchMock.mockResolvedValue(
    json(
      {
        error: {
          details: [
            {
              '@type': 'type.googleapis.com/google.firebase.fcm.v1.FcmError',
              errorCode: 'UNREGISTERED',
            },
          ],
        },
      },
      404,
    ),
  );
  expect(await provider.send(input)).toMatchObject({
    success: false,
    code: 'UNREGISTERED',
    invalidToken: true,
    retryable: false,
  });
  fetchMock.mockResolvedValue(
    json({ error: { details: [{ errorCode: 'UNREGISTERED' }] } }, 400),
  );
  expect(await provider.send(input)).toMatchObject({
    success: false,
    invalidToken: false,
    retryable: false,
  });
});
it('honors Retry-After and marks transient failures retryable', async () => {
  fetchMock.mockResolvedValue(json({}, 429, { 'Retry-After': '120' }));
  expect(await provider.send(input)).toMatchObject({
    retryable: true,
    retryAfterMs: 120000,
  });
  fetchMock.mockResolvedValue(json({}, 503));
  expect(await provider.send(input)).toMatchObject({ retryable: true });
});
it('never leaks raw network errors or contacts Firebase when disabled', async () => {
  fetchMock.mockRejectedValue(new Error('contains private-device-token'));
  expect(await provider.send(input)).toEqual({
    success: false,
    code: 'FCM_UNAVAILABLE',
    retryable: true,
  });
  fetchMock.mockClear();
  await new FcmProvider(new ConfigService({})).send(input);
  expect(fetchMock).not.toHaveBeenCalled();
});
