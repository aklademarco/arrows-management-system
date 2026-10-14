import { Global, Module } from '@nestjs/common';
import { NotificationPublisher } from './notification-publisher.service';

@Global()
@Module({
  providers: [NotificationPublisher],
  exports: [NotificationPublisher],
})
export class NotificationPublishingModule {}
