import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/authenticated-user.decorator';
import {
  AuthenticatedGuard,
  type AuthenticatedPrincipal,
} from '../auth/authenticated.guard';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';

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
