import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createSign } from 'node:crypto';

export type PushResult =
  | { success: true }
  | {
      success: false;
      code: string;
      retryable: boolean;
      invalidToken?: boolean;
      retryAfterMs?: number;
    };

@Injectable()
export class FcmProvider {
  private access?: { token: string; expiresAt: number };
  constructor(private readonly config: ConfigService) {}

  isConfigured() {
    return (
      this.config.get('PUSH_ENABLED') === 'true' &&
      Boolean(
        this.config.get('FCM_PROJECT_ID') &&
        this.config.get('FCM_CLIENT_EMAIL') &&
        this.config.get('FCM_PRIVATE_KEY'),
      )
    );
  }

  private async accessToken(): Promise<string> {
    if (this.access && this.access.expiresAt > Date.now() + 60000)
      return this.access.token;
    const now = Math.floor(Date.now() / 1000);
    const encode = (value: unknown) =>
      Buffer.from(JSON.stringify(value)).toString('base64url');
    const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
      iss: this.config.get<string>('FCM_CLIENT_EMAIL'),
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })}`;
    const key = this.config
      .getOrThrow<string>('FCM_PRIVATE_KEY')
      .replace(/\\n/g, '\n');
    const signature = createSign('RSA-SHA256')
      .update(unsigned)
      .sign(key, 'base64url');
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: `${unsigned}.${signature}`,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const body = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!response.ok || typeof body.access_token !== 'string')
      throw new Error('FCM_AUTH_FAILED');
    this.access = {
      token: body.access_token,
      expiresAt: Date.now() + Math.min(body.expires_in ?? 3600, 3600) * 1000,
    };
    return body.access_token;
  }

  async send(input: {
    token: string;
    notificationId: string;
    title: string;
    link: string;
    ttlSeconds: number;
  }): Promise<PushResult> {
    if (!this.isConfigured())
      return { success: false, code: 'DISABLED', retryable: true };
    try {
      const bearer = await this.accessToken();
      const project = encodeURIComponent(
        this.config.getOrThrow<string>('FCM_PROJECT_ID'),
      );
      // Data-only messages have one display path in our worker, using a stable tag on retries.
      // Keep private message/assignment content off shared-device lock screens.
      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${project}/messages:send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${bearer}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              token: input.token,
              data: {
                title: input.title,
                body: 'Open ACMS to view the details.',
                link: input.link,
                notificationId: input.notificationId,
              },
              webpush: {
                headers: {
                  TTL: String(Math.max(0, Math.min(input.ttlSeconds, 86400))),
                  Urgency: 'normal',
                },
              },
            },
          }),
          signal: AbortSignal.timeout(10000),
        },
      );
      if (response.ok) return { success: true };
      const body = (await response.json().catch(() => null)) as {
        error?: { details?: Array<{ '@type'?: string; errorCode?: string }> };
      } | null;
      const fcmCode = body?.error?.details?.find(
        (detail) =>
          detail['@type'] ===
          'type.googleapis.com/google.firebase.fcm.v1.FcmError',
      )?.errorCode;
      const invalidToken = fcmCode === 'UNREGISTERED';
      if (response.status === 401) this.access = undefined;
      const retryAfter = response.headers.get('retry-after');
      const retryAfterMs = retryAfter
        ? /^\d+$/.test(retryAfter)
          ? Number(retryAfter) * 1000
          : Math.max(0, Date.parse(retryAfter) - Date.now())
        : undefined;
      return {
        success: false,
        code: invalidToken ? 'UNREGISTERED' : `FCM_HTTP_${response.status}`,
        invalidToken,
        retryable:
          !invalidToken &&
          (response.status === 401 ||
            response.status === 429 ||
            response.status >= 500),
        retryAfterMs: Number.isFinite(retryAfterMs) ? retryAfterMs : undefined,
      };
    } catch {
      // No raw provider exceptions: they can contain credentials or recipient tokens.
      return { success: false, code: 'FCM_UNAVAILABLE', retryable: true };
    }
  }
}
