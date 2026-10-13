import { AssignDutyDto } from './dto/assign-duty.dto';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminUser } from '../auth/admin-user.decorator';
import { AdminGuard, type AdminPrincipal } from '../auth/admin.guard';
import { LiturgiesService } from './liturgies.service';
import { GenerateEventLiturgyDto } from './dto/generate-event-liturgy.dto';

@Controller('liturgies')
@UseGuards(AdminGuard)
export class LiturgiesController {
  constructor(private readonly service: LiturgiesService) {}

  @Get('events/:eventId/assignees')
  async assignees(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      data: await this.service.assignableMembers(eventId, admin),
    };
  }

  @Put('items/:itemId/assignment')
  async assignDuty(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() body: AssignDutyDto,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      data: await this.service.assignDuty(itemId, body.memberId, admin),
    };
  }

  @Get('templates')
  async templates(@AdminUser() admin: AdminPrincipal) {
    return {
      success: true,
      message: 'Liturgy templates retrieved.',
      data: await this.service.templates(admin),
    };
  }

  @Get('events/:eventId')
  async eventLiturgy(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Event liturgy retrieved.',
      data: await this.service.eventLiturgy(eventId, admin),
    };
  }

  @Post('events/:eventId/generate')
  async generate(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() body: GenerateEventLiturgyDto,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Event liturgy generated.',
      data: await this.service.generate(eventId, body, admin),
    };
  }
}
