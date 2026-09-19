import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AttendanceController } from './attendance.controller';
import { AttendanceRepository } from './attendance.repository';
import { AttendanceService } from './attendance.service';
import { AttendanceLifecycleService } from './attendance-lifecycle.service';
import { AttendanceReportDeliveryRepository } from './attendance-report-delivery.repository';
import { AttendanceReportDeliveryService } from './attendance-report-delivery.service';
import { AttendanceReportPdfService } from './attendance-report-pdf.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [AuthModule, MailModule],
  controllers: [AttendanceController],
  providers: [
    AttendanceRepository,
    AttendanceService,
    AttendanceLifecycleService,
    AttendanceReportDeliveryRepository,
    AttendanceReportDeliveryService,
    AttendanceReportPdfService,
  ],
})
export class AttendanceModule {}
