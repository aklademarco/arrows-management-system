import { Injectable } from '@nestjs/common';

type SendResponse = {
  status?: string;
  data?: Array<
    { recipient?: string; id?: string } | { 'invalid numbers'?: string[] }
  >;
  message?: string;
};

@Injectable()
export class ArkeselSmsProvider {
  isConfigured() {
    return (
      process.env.SMS_ENABLED === 'true' &&
      Boolean(process.env.ARKESEL_API_KEY && process.env.ARKESEL_SENDER_ID)
    );
  }

  async send(phone: string, message: string) {
    const apiKey = process.env.ARKESEL_API_KEY;
    const sender = process.env.ARKESEL_SENDER_ID;
    if (!this.isConfigured() || !apiKey || !sender)
      return {
        success: false as const,
        retryable: false,
        error: 'SMS provider is not configured.',
      };
    const recipient = phone.replace(/^\+/, '').replace(/\s+/g, '');
    if (!/^\d{10,15}$/.test(recipient))
      return {
        success: false as const,
        retryable: false,
        error: 'Recipient phone number is invalid.',
      };
    try {
      const response = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
        method: 'POST',
        headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender, message, recipients: [recipient] }),
        signal: AbortSignal.timeout(15_000),
      });
      const body = (await response
        .json()
        .catch(() => null)) as SendResponse | null;
      const providerId = body?.data?.find(
        (item): item is { recipient?: string; id: string } =>
          'id' in item && typeof item.id === 'string',
      )?.id;
      if (response.ok && body?.status === 'success' && providerId)
        return { success: true as const, providerId };
      return {
        success: false as const,
        retryable: response.status >= 500 || response.status === 429,
        error:
          body?.message ??
          `SMS provider rejected the request (${response.status}).`,
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
    const apiKey = process.env.ARKESEL_API_KEY;
    if (!apiKey) return null;
    try {
      const response = await fetch(
        `https://sms.arkesel.com/api/v2/sms/${encodeURIComponent(providerId)}`,
        {
          headers: { 'api-key': apiKey, Accept: 'application/json' },
          signal: AbortSignal.timeout(10_000),
        },
      );
      const body = (await response.json().catch(() => null)) as {
        data?: { status?: string };
      } | null;
      return response.ok ? (body?.data?.status?.toUpperCase() ?? null) : null;
    } catch {
      return null;
    }
  }
}
