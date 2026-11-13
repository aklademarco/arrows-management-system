import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MembersModule } from '../members/members.module';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsRepository } from './announcements.repository';
import { AnnouncementsService } from './announcements.service';
import { FeedController } from './feed.controller';
import { FeedRepository } from './feed.repository';
import { FeedService } from './feed.service';
import { PublisherAccessService } from './publisher-access.service';

@Module({
  imports: [AuthModule, MembersModule],
  controllers: [AnnouncementsController, FeedController],
  providers: [
    AnnouncementsRepository,
    AnnouncementsService,
    FeedRepository,
    FeedService,
    PublisherAccessService,
  ],
})
export class AnnouncementsModule {}
