import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PastoralCareController } from './pastoral-care.controller';
import { PastoralCareRepository } from './pastoral-care.repository';
import { PastoralCareService } from './pastoral-care.service';

@Module({
  imports: [AuthModule],
  controllers: [PastoralCareController],
  providers: [PastoralCareRepository, PastoralCareService],
})
export class PastoralCareModule {}
