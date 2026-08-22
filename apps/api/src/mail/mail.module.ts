import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EMAIL_DELIVERY } from './email-delivery';
import { ResendEmailDelivery } from './resend-email-delivery';
import { SmtpEmailDelivery } from './smtp-email-delivery';

@Module({
  providers: [
    SmtpEmailDelivery,
    ResendEmailDelivery,
    {
      provide: EMAIL_DELIVERY,
      inject: [ConfigService, SmtpEmailDelivery, ResendEmailDelivery],
      useFactory: (
        config: ConfigService,
        smtp: SmtpEmailDelivery,
        resend: ResendEmailDelivery,
      ) => (config.get<string>('RESEND_API_KEY') ? resend : smtp),
    },
  ],
  exports: [EMAIL_DELIVERY],
})
export class MailModule {}
