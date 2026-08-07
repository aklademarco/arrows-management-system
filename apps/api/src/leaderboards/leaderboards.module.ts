import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LeaderboardsController } from './leaderboards.controller';
import { LeaderboardsRepository } from './leaderboards.repository';
import { LeaderboardsService } from './leaderboards.service';

@Module({
  imports: [AuthModule],
  controllers: [LeaderboardsController],
  providers: [LeaderboardsRepository, LeaderboardsService],
})
export class LeaderboardsModule {}
