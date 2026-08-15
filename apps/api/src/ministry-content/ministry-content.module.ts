import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MinistryContentController } from './ministry-content.controller';
import { MinistryContentRepository } from './ministry-content.repository';
import { MinistryContentService } from './ministry-content.service';
import { AdminMinistryContentController } from './admin-ministry-content.controller';

@Module({
  imports: [AuthModule],
  controllers: [MinistryContentController, AdminMinistryContentController],
  providers: [MinistryContentRepository, MinistryContentService],
})
export class MinistryContentModule {}
