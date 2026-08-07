import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
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

  @Get('attendance.csv')
  async attendanceCsv(
    @Query() query: AttendanceReportQueryDto,
    @AdminUser() admin: AdminPrincipal,
    @Res() response: Response,
  ) {
    const file = await this.service.attendanceCsv(query, admin);
    response.type('text/csv').attachment(file.filename).send(file.content);
  }
}
