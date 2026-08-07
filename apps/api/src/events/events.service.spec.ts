import { EventsRepository } from './events.repository';
import { EventsService } from './events.service';

const admin = {
  id: 'admin-id',
  churchId: 'church-id',
  email: 'admin@example.com',
  roles: ['ADMIN'],
};

describe('EventsService event filters', () => {
  it('passes validated filters with church scope to the repository', async () => {
    const list = jest.fn().mockResolvedValue([]);
    const service = new EventsService({ list } as unknown as EventsRepository);
    const query = {
      status: 'SCHEDULED' as const,
      from: '2026-08-01',
      to: '2026-08-31',
    };

    await service.list(query, admin);

    expect(list).toHaveBeenCalledWith('church-id', query);
  });

  it('rejects an inverted date range', () => {
    const service = new EventsService({} as EventsRepository);

    expect(() =>
      service.list({ from: '2026-08-31', to: '2026-08-01' }, admin),
    ).toThrow('The event filter end date cannot precede its start date.');
  });
});
