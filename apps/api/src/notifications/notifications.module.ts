import { PushDevicesRepository } from './push-devices.repository';
import { PushDevicesService } from './push-devices.service';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsRepository,
    NotificationsService,
    PushDevicesRepository,
    PushDevicesService,
  ],
})
export class NotificationsModule {}
