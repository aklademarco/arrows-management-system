import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import type {
  EmailDelivery,
  PasswordResetEmail,
  VerificationEmail,
} from './email-delivery';
import {
  passwordResetEmailBody,
  verificationEmailBody,
} from './email-templates';

@Injectable()
export class SmtpEmailDelivery implements EmailDelivery {
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly webUrl: string;

  constructor(config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST') ?? '127.0.0.1',
      port: Number(config.get<string>('SMTP_PORT') ?? 1025),
      secure: false,
    });
    this.from =
      config.get<string>('SMTP_FROM') ??
      'Love Community Chapel Youth Ministry-Arrows <no-reply@arrows.local>';
    this.webUrl = config.get<string>('WEB_URL') ?? 'http://localhost:3000';
  }

  async sendVerificationEmail(message: VerificationEmail): Promise<void> {
    const body = verificationEmailBody(message, this.webUrl);
    await this.transporter.sendMail({
      from: this.from,
      to: message.recipient,
      subject: body.subject,
      text: body.text,
      html: body.html,
    });
  }

  async sendPasswordResetEmail(message: PasswordResetEmail): Promise<void> {
    const body = passwordResetEmailBody(message, this.webUrl);
    await this.transporter.sendMail({
      from: this.from,
      to: message.recipient,
      subject: body.subject,
      text: body.text,
      html: body.html,
    });
  }
}
