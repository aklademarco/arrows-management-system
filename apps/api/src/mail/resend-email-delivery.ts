import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  EmailDelivery,
  PasswordResetEmail,
  VerificationEmail,
} from './email-delivery';
import {
  passwordResetEmailBody,
  verificationEmailBody,
} from './email-templates';

type SendResponse = { id?: string; message?: string };

@Injectable()
export class ResendEmailDelivery implements EmailDelivery {
  private readonly apiKey: string;
  private readonly from: string;
  private readonly webUrl: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('RESEND_API_KEY') ?? '';
    this.from =
      config.get<string>('SMTP_FROM') ??
      'Love Community Chapel Youth Ministry-Arrows <no-reply@arrows.local>';
    this.webUrl = config.get<string>('WEB_URL') ?? 'http://localhost:3000';
  }

  async sendVerificationEmail(message: VerificationEmail): Promise<void> {
    const body = verificationEmailBody(message, this.webUrl);
    await this.send(message.recipient, body);
  }

  async sendPasswordResetEmail(message: PasswordResetEmail): Promise<void> {
    const body = passwordResetEmailBody(message, this.webUrl);
    await this.send(message.recipient, body);
  }

  private async send(
    recipient: string,
    body: { subject: string; text: string; html: string },
  ): Promise<void> {
    if (!this.apiKey)
      throw new Error('RESEND_API_KEY is required to send email.');
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.from,
          to: [recipient],
          subject: body.subject,
          text: body.text,
          html: body.html,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (response.ok) return;
      const payload = (await response
        .json()
        .catch(() => null)) as SendResponse | null;
      throw new Error(
        payload?.message ?? `Resend rejected the message (${response.status}).`,
      );
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('Resend request failed.');
    }
  }
}
