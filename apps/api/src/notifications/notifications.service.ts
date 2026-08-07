import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/authenticated.guard';
import type { ListNotificationsDto } from './dto/list-notifications.dto';
import { NotificationsRepository } from './notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}
  list(query: ListNotificationsDto, user: AuthenticatedPrincipal) {
    return this.repository.list(user.id, user.churchId, query);
  }
  async unreadCount(user: AuthenticatedPrincipal) {
    return { count: await this.repository.unreadCount(user.id, user.churchId) };
  }
  async markRead(notificationId: string, user: AuthenticatedPrincipal) {
    const result = await this.repository.markRead(
      notificationId,
      user.id,
      user.churchId,
    );
    if (!result) throw new NotFoundException('Notification not found.');
    return result;
  }
  async markAllRead(user: AuthenticatedPrincipal) {
    return {
      updated: await this.repository.markAllRead(user.id, user.churchId),
    };
  }
}
