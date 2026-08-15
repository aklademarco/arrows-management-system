import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LeadershipMessagesController } from './leadership-messages.controller';
import { LeadershipMessagesRepository } from './leadership-messages.repository';
import { LeadershipMessagesService } from './leadership-messages.service';
import { ArkeselSmsProvider } from './arkesel-sms.provider';
import { SmsDispatchService } from './sms-dispatch.service';

@Module({
  imports: [AuthModule],
  controllers: [LeadershipMessagesController],
  providers: [
    LeadershipMessagesRepository,
    LeadershipMessagesService,
    ArkeselSmsProvider,
    SmsDispatchService,
  ],
})
export class LeadershipMessagesModule {}
