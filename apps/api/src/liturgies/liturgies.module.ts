import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LiturgiesController } from './liturgies.controller';
import { LiturgiesRepository } from './liturgies.repository';
import { LiturgiesService } from './liturgies.service';
import { LiveLiturgiesController } from './live-liturgies.controller';

@Module({
  imports: [AuthModule],
  controllers: [LiturgiesController, LiveLiturgiesController],
  providers: [LiturgiesRepository, LiturgiesService],
})
export class LiturgiesModule {}
