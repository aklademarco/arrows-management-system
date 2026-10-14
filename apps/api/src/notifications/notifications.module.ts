import { PushDeviceCleanupController } from './push-device-cleanup.controller';
import { FcmProvider } from './fcm.provider';
import { PushDeliveryRepository } from './push-delivery.repository';
import { PushDispatchService } from './push-dispatch.service';
import { EventRemindersRepository } from './event-reminders.repository';
import { EventRemindersService } from './event-reminders.service';
import { PushDevicesRepository } from './push-devices.repository';
import { PushDevicesService } from './push-devices.service';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController, PushDeviceCleanupController],
  providers: [
    FcmProvider,
    PushDeliveryRepository,
    PushDispatchService,
    EventRemindersRepository,
    EventRemindersService,

    NotificationsRepository,
    NotificationsService,
    PushDevicesRepository,
    PushDevicesService,
  ],
})
export class NotificationsModule {}
