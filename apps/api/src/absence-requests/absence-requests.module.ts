import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AbsenceRequestsController } from './absence-requests.controller';
import { AbsenceRequestsRepository } from './absence-requests.repository';
import { AbsenceRequestsService } from './absence-requests.service';

@Module({
  imports: [AuthModule],
  controllers: [AbsenceRequestsController],
  providers: [AbsenceRequestsRepository, AbsenceRequestsService],
  exports: [AbsenceRequestsRepository],
})
export class AbsenceRequestsModule {}
