import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminUser } from '../auth/admin-user.decorator';
import { AdminGuard, type AdminPrincipal } from '../auth/admin.guard';
import { AuthenticatedUser } from '../auth/authenticated-user.decorator';
import {
  AuthenticatedGuard,
  type AuthenticatedPrincipal,
} from '../auth/authenticated.guard';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { CorrectAttendanceDto } from './dto/correct-attendance.dto';
import { ManualAttendanceDto } from './dto/manual-attendance.dto';

@Controller()
@UseGuards(AuthenticatedGuard)
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get('events/active')
  async active(@AuthenticatedUser() user: AuthenticatedPrincipal) {
    return {
      success: true,
      message: 'Active events retrieved.',
      data: await this.service.listActiveEvents(user),
    };
  }

  @Get('events/upcoming')
  async upcoming(@AuthenticatedUser() user: AuthenticatedPrincipal) {
    return {
      success: true,
      message: 'Upcoming events retrieved.',
      data: await this.service.listUpcomingEvents(user),
    };
  }

  @Get('attendance/me')
  async ownAttendance(@AuthenticatedUser() user: AuthenticatedPrincipal) {
    return {
      success: true,
      message: 'Attendance history retrieved.',
      data: await this.service.listOwnAttendance(user),
    };
  }

  @Get('attendance/events/:eventId')
  @UseGuards(AdminGuard)
  async eventRoster(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Event attendance retrieved.',
      data: await this.service.eventRoster(eventId, admin),
    };
  }

  @Post('attendance/manual')
  @UseGuards(AdminGuard)
  async markManual(
    @Body() body: ManualAttendanceDto,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Manual attendance recorded.',
      data: await this.service.markManual(body, admin),
    };
  }

  @Patch('attendance/:attendanceId')
  @UseGuards(AdminGuard)
  async correct(
    @Param('attendanceId', ParseUUIDPipe) attendanceId: string,
    @Body() body: CorrectAttendanceDto,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Attendance corrected.',
      data: await this.service.correct(attendanceId, body, admin),
    };
  }

  @Post('attendance/events/:eventId/finalize')
  @UseGuards(AdminGuard)
  async finalizeEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Attendance finalized.',
      data: await this.service.finalizeEvent(eventId, admin),
    };
  }

  @Post('attendance/check-in')
  async checkIn(
    @AuthenticatedUser() user: AuthenticatedPrincipal,
    @Body() body: CheckInDto,
  ) {
    return {
      success: true,
      message: 'Attendance recorded successfully.',
      data: await this.service.checkIn(user, body),
    };
  }
}
