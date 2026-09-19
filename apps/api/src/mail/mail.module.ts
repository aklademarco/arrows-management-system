import { Module } from '@nestjs/common';
import { EMAIL_DELIVERY } from './email-delivery';
import { ResendEmailDelivery } from './resend-email-delivery';

@Module({
  providers: [
    ResendEmailDelivery,
    {
      provide: EMAIL_DELIVERY,
      useExisting: ResendEmailDelivery,
    },
  ],
  exports: [EMAIL_DELIVERY],
})
export class MailModule {}
