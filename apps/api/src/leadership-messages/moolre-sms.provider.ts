import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';

type MoolreEnvelope = {
  status?: number;
  code?: string;
  message?: string | null;
  data?: Array<{ ref?: string; status?: number }> | null;
};

export function isMoolreConfigured() {
  return (
    process.env.SMS_ENABLED === 'true' &&
    Boolean(process.env.MOOLRE_SMS_VAS_KEY && process.env.MOOLRE_SENDER_ID)
  );
}

@Injectable()
export class MoolreSmsProvider {
  isConfigured() {
    return isMoolreConfigured();
  }

  async send(phone: string, message: string) {
    const vasKey = process.env.MOOLRE_SMS_VAS_KEY;
    const sender = process.env.MOOLRE_SENDER_ID;
    if (!this.isConfigured() || !vasKey || !sender)
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

    // Moolre returns no message id on send; delivery polling correlates on the
    // client-supplied ref, so generate one here and store it as the provider id.
    const ref = randomUUID();
    try {
      const response = await fetch(`${this.baseUrl()}/open/sms/send`, {
        method: 'POST',
        headers: {
          'X-API-VASKEY': vasKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 1,
          senderid: sender,
          messages: [{ recipient, message, ref }],
        }),
        signal: AbortSignal.timeout(15_000),
      });
      const body = (await response
        .json()
        .catch(() => null)) as MoolreEnvelope | null;
      if (response.ok && body?.status === 1)
        return { success: true as const, providerId: ref };
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
    const vasKey = process.env.MOOLRE_SMS_VAS_KEY;
    if (!vasKey) return null;
    try {
      const response = await fetch(`${this.baseUrl()}/open/sms/status`, {
        method: 'POST',
        headers: {
          'X-API-VASKEY': vasKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 5, ref: [providerId] }),
        signal: AbortSignal.timeout(10_000),
      });
      const body = (await response
        .json()
        .catch(() => null)) as MoolreEnvelope | null;
      if (!response.ok || body?.status !== 1) return null;
      const reported = body.data?.find((item) => item.ref === providerId);
      if (!reported) return null;

      // Moolre's docs do not publish the integer legend for delivery reports
      // (their examples show bare numbers). Only treat the configured value as
      // DELIVERED and keep everything else polling so no state flips falsely.
      const deliveredStatus = Number(process.env.MOOLRE_DELIVERED_STATUS ?? 2);
      return reported.status === deliveredStatus ? 'DELIVERED' : null;
    } catch {
      return null;
    }
  }

  private baseUrl() {
    return process.env.MOOLRE_BASE_URL ?? 'https://api.moolre.com';
  }
}
