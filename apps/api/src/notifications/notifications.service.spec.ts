import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const user = {
    id: 'user',
    churchId: 'church',
    email: 'member@example.com',
    roles: ['MEMBER'],
  };
  it('scopes the inbox to the authenticated member and church', async () => {
    const list = jest.fn().mockResolvedValue({ items: [], total: 0 });
    await new NotificationsService({
      list,
    } as unknown as NotificationsRepository).list(
      { unreadOnly: false, page: 1, limit: 20 },
      user,
    );
    expect(list).toHaveBeenCalledWith('user', 'church', {
      unreadOnly: false,
      page: 1,
      limit: 20,
    });
  });
  it('rejects reading a notification outside the member scope', async () => {
    const service = new NotificationsService({
      markRead: jest.fn().mockResolvedValue(null),
    } as unknown as NotificationsRepository);
    await expect(service.markRead('notification', user)).rejects.toThrow(
      'Notification not found.',
    );
  });
});
