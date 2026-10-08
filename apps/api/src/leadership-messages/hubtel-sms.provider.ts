import { Injectable } from '@nestjs/common';

type HubtelMessageData = {
  messageId?: string;
  MessageId?: string;
  status?: string;
  Status?: string;
};

type HubtelEnvelope = {
  message?: string | null;
  Message?: string | null;
  responseCode?: string;
  ResponseCode?: string;
  data?: HubtelMessageData | null;
  Data?: HubtelMessageData | null;
  messageId?: string;
  MessageId?: string;
  status?: string;
  Status?: string;
};

export function isHubtelConfigured() {
  return (
    process.env.SMS_ENABLED === 'true' &&
    Boolean(
      process.env.HUBTEL_CLIENT_ID &&
      process.env.HUBTEL_CLIENT_SECRET &&
      process.env.HUBTEL_SENDER_ID,
    )
  );
}

@Injectable()
export class HubtelSmsProvider {
  isConfigured() {
    return isHubtelConfigured();
  }

  async send(phone: string, message: string) {
    const sender = process.env.HUBTEL_SENDER_ID;
    if (!this.isConfigured() || !sender)
      return {
        success: false as const,
        retryable: false,
        error: 'SMS provider is not configured.',
      };

    const recipient = phone.replace(/\s+/g, '');
    if (!/^\+\d{10,15}$/.test(recipient))
      return {
        success: false as const,
        retryable: false,
        error: 'Recipient phone number is invalid.',
      };

    try {
      const response = await fetch(`${this.baseUrl()}/messages/send`, {
        method: 'POST',
        headers: {
          Authorization: this.authorization(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: sender, to: recipient, content: message }),
        signal: AbortSignal.timeout(15_000),
      });
      const body = (await response
        .json()
        .catch(() => null)) as HubtelEnvelope | null;
      const providerId = this.messageId(body);
      if (response.ok && providerId)
        return { success: true as const, providerId };

      return {
        success: false as const,
        retryable:
          response.status === 408 ||
          response.status === 429 ||
          response.status >= 500,
        error:
          body?.message ??
          body?.Message ??
          (response.ok
            ? `Hubtel accepted the request but returned no message ID (${response.status}).`
            : `SMS provider rejected the request (${response.status}).`),
      };
    } catch (error) {
      return {
        success: false as const,
        retryable: true,
        error:
          error instanceof Error
            ? error.message
            : 'SMS provider request failed.',
      };
    }
  }

  async deliveryStatus(providerId: string) {
    if (!this.isConfigured()) return null;
    try {
      const response = await fetch(
        `${this.baseUrl()}/messages/${encodeURIComponent(providerId)}`,
        {
          headers: { Authorization: this.authorization() },
          signal: AbortSignal.timeout(10_000),
        },
      );
      const body = (await response
        .json()
        .catch(() => null)) as HubtelEnvelope | null;
      if (!response.ok) return null;
      const data = body?.data ?? body?.Data;
      const status =
        data?.status ?? data?.Status ?? body?.status ?? body?.Status;
      return status?.toLowerCase() === 'delivered' ? 'DELIVERED' : null;
    } catch {
      return null;
    }
  }

  private authorization() {
    const credentials = `${process.env.HUBTEL_CLIENT_ID ?? ''}:${process.env.HUBTEL_CLIENT_SECRET ?? ''}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  private messageId(body: HubtelEnvelope | null) {
    const data = body?.data ?? body?.Data;
    return (
      data?.messageId ?? data?.MessageId ?? body?.messageId ?? body?.MessageId
    );
  }

  private baseUrl() {
    return (
      process.env.HUBTEL_BASE_URL ?? 'https://smsc.hubtel.com/v1'
    ).replace(/\/$/, '');
  }
}
