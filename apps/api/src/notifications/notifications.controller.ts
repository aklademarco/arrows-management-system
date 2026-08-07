import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/authenticated-user.decorator';
import {
  AuthenticatedGuard,
  type AuthenticatedPrincipal,
} from '../auth/authenticated.guard';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthenticatedGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}
  @Get() async list(
    @Query() query: ListNotificationsDto,
    @AuthenticatedUser() user: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Notifications retrieved.',
      data: await this.service.list(query, user),
    };
  }
  @Get('unread-count') async unreadCount(
    @AuthenticatedUser() user: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Unread notification count retrieved.',
      data: await this.service.unreadCount(user),
    };
  }
  @Patch('read-all') async markAllRead(
    @AuthenticatedUser() user: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Notifications marked as read.',
      data: await this.service.markAllRead(user),
    };
  }
  @Patch(':notificationId/read') async markRead(
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
    @AuthenticatedUser() user: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Notification marked as read.',
      data: await this.service.markRead(notificationId, user),
    };
  }
}
