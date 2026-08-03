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
import { CreateEventDto } from './dto/create-event.dto';
import { CancelEventDto } from './dto/cancel-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

@Controller('events')
@UseGuards(AdminGuard)
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Get()
  async list(@AdminUser() admin: AdminPrincipal) {
    return {
      success: true,
      message: 'Events retrieved.',
      data: await this.service.list(admin),
    };
  }

  @Post()
  async create(
    @Body() body: CreateEventDto,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Event scheduled successfully.',
      data: await this.service.create(body, admin),
    };
  }

  @Get(':eventId')
  async findById(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Event retrieved.',
      data: await this.service.findById(eventId, admin),
    };
  }

  @Patch(':eventId')
  async update(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() body: UpdateEventDto,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Event updated successfully.',
      data: await this.service.update(eventId, body, admin),
    };
  }

  @Post(':eventId/cancel')
  async cancel(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() body: CancelEventDto,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Event cancelled successfully.',
      data: await this.service.cancel(eventId, body, admin),
    };
  }
}
