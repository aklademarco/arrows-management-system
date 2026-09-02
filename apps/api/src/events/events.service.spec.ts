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

describe('EventsService Sunday attendance windows', () => {
  it('opens a Sunday event at midnight and closes it when church ends', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'event-id' });
    const service = new EventsService({
      create,
    } as unknown as EventsRepository);
    const dto = {
      name: 'Sunday Service',
      eventType: 'SUNDAY_SERVICE',
      startsAt: '2026-09-06T08:40:00.000Z',
      endsAt: '2026-09-06T12:00:00.000Z',
      attendanceOpensAt: '2026-09-06T08:10:00.000Z',
      attendanceClosesAt: '2026-09-06T12:30:00.000Z',
      earlyUntil: '2026-09-06T08:40:00.000Z',
      lateAfter: '2026-09-06T08:50:00.000Z',
      latitude: 5.6,
      longitude: -0.2,
      geofenceRadiusMeters: 200,
      maximumAccuracyMeters: 50,
    };

    await service.create(dto, admin);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        attendanceOpensAt: '2026-09-06T00:00:00.000Z',
        attendanceClosesAt: '2026-09-06T12:00:00.000Z',
      }),
      admin,
    );
  });

  it('keeps the configured window for a non-Sunday event', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'event-id' });
    const service = new EventsService({
      create,
    } as unknown as EventsRepository);
    const dto = {
      name: 'Prayer Meeting',
      eventType: 'MEETING',
      startsAt: '2026-09-09T18:00:00.000Z',
      endsAt: '2026-09-09T20:00:00.000Z',
      attendanceOpensAt: '2026-09-09T17:30:00.000Z',
      attendanceClosesAt: '2026-09-09T20:00:00.000Z',
      lateAfter: '2026-09-09T18:10:00.000Z',
      latitude: 5.6,
      longitude: -0.2,
      geofenceRadiusMeters: 200,
      maximumAccuracyMeters: 50,
    };

    await service.create(dto, admin);

    expect(create).toHaveBeenCalledWith(dto, admin);
  });
});
