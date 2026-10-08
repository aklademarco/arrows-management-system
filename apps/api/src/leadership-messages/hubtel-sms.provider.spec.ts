import { HubtelSmsProvider } from './hubtel-sms.provider';

const configuredEnvironment = {
  ...process.env,
  SMS_ENABLED: 'true',
  HUBTEL_CLIENT_ID: 'client-id',
  HUBTEL_CLIENT_SECRET: 'client-secret',
  HUBTEL_SENDER_ID: 'ARROWS',
  HUBTEL_BASE_URL: 'https://sms.example.test/v1/',
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('HubtelSmsProvider', () => {
  let provider: HubtelSmsProvider;
  let fetchMock: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    provider = new HubtelSmsProvider();
    jest.replaceProperty(process, 'env', { ...configuredEnvironment });
    fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('Unexpected request'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends an E.164 number using Hubtel Basic authentication', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          message: 'Message accepted.',
          responseCode: '0000',
          data: { messageId: 'hubtel-message-1', status: 'Sent' },
        },
        201,
      ),
    );

    await expect(
      provider.send('+233241234567', 'Sunday service starts at 8:40 am.'),
    ).resolves.toEqual({
      success: true,
      providerId: 'hubtel-message-1',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://sms.example.test/v1/messages/send',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from('client-id:client-secret').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'ARROWS',
          to: '+233241234567',
          content: 'Sunday service starts at 8:40 am.',
        }),
      }),
    );
  });

  it('rejects an invalid recipient before calling Hubtel', async () => {
    await expect(provider.send('0241234567', 'Notice')).resolves.toEqual({
      success: false,
      retryable: false,
      error: 'Recipient phone number is invalid.',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts the PascalCase response returned by Hubtel gateways', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          Message: 'Message accepted.',
          ResponseCode: '0000',
          Data: { MessageId: 'hubtel-message-2', Status: 'Sent' },
        },
        201,
      ),
    );

    await expect(provider.send('+233241234567', 'Notice')).resolves.toEqual({
      success: true,
      providerId: 'hubtel-message-2',
    });
  });

  it('reports an actionable error when a successful response has no message ID', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ ResponseCode: '0000', Data: { Status: 'Sent' } }, 201),
    );

    await expect(provider.send('+233241234567', 'Notice')).resolves.toEqual({
      success: false,
      retryable: false,
      error: 'Hubtel accepted the request but returned no message ID (201).',
    });
  });

  it('marks rate-limited requests as retryable', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ message: 'Too many requests.' }, 429),
    );

    await expect(provider.send('+233241234567', 'Notice')).resolves.toEqual({
      success: false,
      retryable: true,
      error: 'Too many requests.',
    });
  });

  it('queries Hubtel and recognizes a delivered message', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          responseCode: '0000',
          data: { messageId: 'message/id', status: 'Delivered' },
        },
        200,
      ),
    );

    await expect(provider.deliveryStatus('message/id')).resolves.toBe(
      'DELIVERED',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://sms.example.test/v1/messages/message%2Fid',
      expect.objectContaining({
        headers: {
          Authorization: `Basic ${Buffer.from('client-id:client-secret').toString('base64')}`,
        },
      }),
    );
  });

  it('recognizes delivery status in a PascalCase response', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          ResponseCode: '0000',
          Data: { MessageId: 'message-2', Status: 'Delivered' },
        },
        200,
      ),
    );

    await expect(provider.deliveryStatus('message-2')).resolves.toBe(
      'DELIVERED',
    );
  });

  it('stays disabled unless SMS and every Hubtel credential are configured', () => {
    process.env.HUBTEL_CLIENT_SECRET = '';
    expect(provider.isConfigured()).toBe(false);
  });
});
