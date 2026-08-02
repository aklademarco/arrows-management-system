import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdminUser } from '../auth/admin-user.decorator';
import { AdminGuard, type AdminPrincipal } from '../auth/admin.guard';
import { CreateEventDto } from './dto/create-event.dto';
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
}
