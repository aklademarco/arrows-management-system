import { Module } from '@nestjs/common';
import { EMAIL_DELIVERY } from './email-delivery';
import { SmtpEmailDelivery } from './smtp-email-delivery';

@Module({
  providers: [
    SmtpEmailDelivery,
    {
      provide: EMAIL_DELIVERY,
      useExisting: SmtpEmailDelivery,
    },
  ],
  exports: [EMAIL_DELIVERY],
})
export class MailModule {}
