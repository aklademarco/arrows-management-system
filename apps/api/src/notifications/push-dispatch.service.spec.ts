import { PushDispatchService } from './push-dispatch.service';
import { PushDeliveryRepository } from './push-delivery.repository';
import { FcmProvider, type PushResult } from './fcm.provider';

type Delivery = NonNullable<
  Awaited<ReturnType<PushDeliveryRepository['load']>>
>;
function setup(result: PushResult, attempts = 1) {
  const row = {
    delivery: { attempts, deviceGeneration: 'generation' },
    notice: {
      id: 'notice',
      churchId: 'church',
      recipientUserId: 'user',
      type: 'LEADERSHIP_MESSAGE',
      createdAt: new Date(),
      expiresAt: null,
      eventId: null,
    },
    device: {
      id: 'device',
      token: 'token',
      generation: 'generation',
      churchId: 'church',
      userId: 'user',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 86400000),
      approvalOnly: false,
    },
    accountStatus: 'ACTIVE',
    accountChurchId: 'church',
    eventStatus: null,
    currentEventStart: null,
  } as Delivery;
  const repository = {
    enqueue: jest.fn().mockResolvedValue(1),
    claimNext: jest
      .fn()
      .mockResolvedValueOnce({ id: 'job', leaseId: 'lease' })
      .mockResolvedValue(null),
    load: jest.fn().mockResolvedValue(row),
    finish: jest.fn().mockResolvedValue(undefined),
  };
  const provider = {
    isConfigured: () => true,
    send: jest.fn().mockResolvedValue(result),
  };
  return {
    row,
    repository,
    provider,
    service: new PushDispatchService(
      repository as unknown as PushDeliveryRepository,
      provider as unknown as FcmProvider,
    ),
  };
}
it('retries transient failures without claiming delivery success', async () => {
  const test = setup({
    success: false,
    code: 'FCM_HTTP_429',
    retryable: true,
    retryAfterMs: 120000,
  });
  const now = Date.now();
  await test.service.process();
  const call = test.repository.finish.mock.calls[0] as unknown[];
  expect(call.slice(0, 4)).toEqual(['job', 'lease', 'QUEUED', 'FCM_HTTP_429']);
  expect((call[4] as Date).getTime()).toBeGreaterThanOrEqual(now + 120000);
});
it('stops retrying after five attempts and revokes invalid tokens with a generation fence', async () => {
  const failed = setup(
    { success: false, code: 'FCM_HTTP_503', retryable: true },
    5,
  );
  await failed.service.process();
  expect(failed.repository.finish).toHaveBeenCalledWith(
    'job',
    'lease',
    'FAILED',
    'FCM_HTTP_503',
    undefined,
    undefined,
  );
  const invalid = setup({
    success: false,
    code: 'UNREGISTERED',
    retryable: false,
    invalidToken: true,
  });
  await invalid.service.process();
  expect(invalid.repository.finish).toHaveBeenCalledWith(
    'job',
    'lease',
    'FAILED',
    'UNREGISTERED',
    undefined,
    { id: 'device', generation: 'generation' },
  );
});
it('rechecks device ownership and does not send after revocation', async () => {
  const test = setup({ success: true });
  test.row.device.revokedAt = new Date();
  await test.service.process();
  expect(test.provider.send).not.toHaveBeenCalled();
  expect(test.repository.finish).toHaveBeenCalledWith(
    'job',
    'lease',
    'SKIPPED',
    'RECIPIENT_UNAVAILABLE',
  );
});
it('processes one cycle at a time and records successful delivery', async () => {
  const test = setup({ success: true });
  await Promise.all([test.service.process(), test.service.process()]);
  expect(test.repository.enqueue).toHaveBeenCalledTimes(1);
  expect(test.provider.send).toHaveBeenCalledTimes(1);
  expect(test.repository.finish).toHaveBeenCalledWith('job', 'lease', 'SENT');
});
