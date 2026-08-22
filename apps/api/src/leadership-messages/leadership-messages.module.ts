import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LeadershipMessagesController } from './leadership-messages.controller';
import { LeadershipMessagesRepository } from './leadership-messages.repository';
import { LeadershipMessagesService } from './leadership-messages.service';
import { MoolreSmsProvider } from './moolre-sms.provider';
import { SmsDispatchService } from './sms-dispatch.service';

@Module({
  imports: [AuthModule],
  controllers: [LeadershipMessagesController],
  providers: [
    LeadershipMessagesRepository,
    LeadershipMessagesService,
    MoolreSmsProvider,
    SmsDispatchService,
  ],
})
export class LeadershipMessagesModule {}
