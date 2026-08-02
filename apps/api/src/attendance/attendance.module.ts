import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AttendanceController } from './attendance.controller';
import { AttendanceRepository } from './attendance.repository';
import { AttendanceService } from './attendance.service';

@Module({
  imports: [AuthModule],
  controllers: [AttendanceController],
  providers: [AttendanceRepository, AttendanceService],
})
export class AttendanceModule {}
