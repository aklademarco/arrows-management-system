import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminUser } from '../auth/admin-user.decorator';
import { AdminGuard, type AdminPrincipal } from '../auth/admin.guard';
import { AttendanceReportQueryDto } from './dto/attendance-report-query.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(AdminGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('attendance-summary')
  async attendanceSummary(
    @Query() query: AttendanceReportQueryDto,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Attendance report retrieved.',
      data: await this.service.attendanceSummary(query, admin),
    };
  }
}
