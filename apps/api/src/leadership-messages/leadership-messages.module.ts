import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LeadershipMessagesController } from './leadership-messages.controller';
import { LeadershipMessagesRepository } from './leadership-messages.repository';
import { LeadershipMessagesService } from './leadership-messages.service';

@Module({
  imports: [AuthModule],
  controllers: [LeadershipMessagesController],
  providers: [LeadershipMessagesRepository, LeadershipMessagesService],
})
export class LeadershipMessagesModule {}
