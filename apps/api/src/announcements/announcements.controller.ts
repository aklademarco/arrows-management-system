import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthenticatedUser } from '../auth/authenticated-user.decorator';
import {
  AuthenticatedGuard,
  type AuthenticatedPrincipal,
} from '../auth/authenticated.guard';
import { RATE_LIMITS } from '../common/security/rate-limits';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { ListAnnouncementsDto } from './dto/list-announcements.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { CancelEventDto } from './dto/cancel-event.dto';

@Controller('announcements')
@UseGuards(AuthenticatedGuard)
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Get()
  async list(
    @Query() query: ListAnnouncementsDto,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Announcements retrieved.',
      data: await this.service.list(query, viewer),
    };
  }

  @Get(':announcementId')
  async findById(
    @Param('announcementId', ParseUUIDPipe) id: string,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Announcement retrieved.',
      data: await this.service.findById(id, viewer),
    };
  }

  /** A downloadable calendar copy of one event (Apple, Outlook, etc.). */
  @Get(':announcementId/calendar.ics')
  @Throttle({ default: RATE_LIMITS.calendarExport })
  async calendar(
    @Param('announcementId', ParseUUIDPipe) id: string,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
    @Res() response: Response,
  ) {
    const file = await this.service.eventCalendarFile(id, viewer);
    response
      .type('text/calendar; charset=utf-8')
      .attachment(file.filename)
      .setHeader('Cache-Control', 'no-store')
      .send(file.content);
  }

  @Post()
  @Throttle({ default: RATE_LIMITS.announcementWrite })
  async create(
    @Body() body: CreateAnnouncementDto,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Announcement published.',
      data: await this.service.create(body, viewer),
    };
  }

  @Patch(':announcementId')
  @Throttle({ default: RATE_LIMITS.announcementWrite })
  async update(
    @Param('announcementId', ParseUUIDPipe) id: string,
    @Body() body: UpdateAnnouncementDto,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Announcement updated.',
      data: await this.service.update(id, body, viewer),
    };
  }

  @Post(':announcementId/cancel')
  @Throttle({ default: RATE_LIMITS.announcementWrite })
  async cancel(
    @Param('announcementId', ParseUUIDPipe) id: string,
    @Body() body: CancelEventDto,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Event cancelled.',
      data: await this.service.cancelEvent(id, body, viewer),
    };
  }

  @Post(':announcementId/archive')
  @Throttle({ default: RATE_LIMITS.announcementWrite })
  async archive(
    @Param('announcementId', ParseUUIDPipe) id: string,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    await this.service.archive(id, viewer);
    return { success: true, message: 'Announcement archived.', data: null };
  }
}
