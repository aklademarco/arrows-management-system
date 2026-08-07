import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthenticatedUser } from '../auth/authenticated-user.decorator';
import {
  AuthenticatedGuard,
  type AuthenticatedPrincipal,
} from '../auth/authenticated.guard';
import { AttendanceReportQueryDto } from './dto/attendance-report-query.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(AuthenticatedGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('attendance-summary')
  async attendanceSummary(
    @Query() query: AttendanceReportQueryDto,
    @AuthenticatedUser() user: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Attendance report retrieved.',
      data: await this.service.attendanceSummary(query, user),
    };
  }

  @Get('attendance.csv')
  async attendanceCsv(
    @Query() query: AttendanceReportQueryDto,
    @AuthenticatedUser() user: AuthenticatedPrincipal,
    @Res() response: Response,
  ) {
    const file = await this.service.attendanceCsv(query, user);
    response.type('text/csv').attachment(file.filename).send(file.content);
  }
}
