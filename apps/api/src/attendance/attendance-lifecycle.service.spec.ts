import { AttendanceLifecycleService } from './attendance-lifecycle.service';
import type { AttendanceRepository } from './attendance.repository';

describe('AttendanceLifecycleService', () => {
  it('generates recurring events and finalizes every due event', async () => {
    const now = new Date('2026-09-13T12:01:00.000Z');
    const materializeRecurringEvents = jest.fn().mockResolvedValue(1);
    const dueEventsForFinalization = jest.fn().mockResolvedValue([
      {
        id: 'event-1',
        churchId: 'church-1',
        createdBy: 'admin-1',
      },
    ]);
    const finalizeEvent = jest
      .fn()
      .mockResolvedValue({ alreadyFinalized: false });
    const repository = {
      materializeRecurringEvents,
      dueEventsForFinalization,
      finalizeEvent,
    } as unknown as AttendanceRepository;
    const service = new AttendanceLifecycleService(repository);

    await service.process(now);

    expect(materializeRecurringEvents).toHaveBeenCalledWith(now);
    expect(dueEventsForFinalization).toHaveBeenCalledWith(now);
    expect(finalizeEvent).toHaveBeenCalledWith(
      'event-1',
      expect.objectContaining({ id: 'admin-1', churchId: 'church-1' }),
      now,
    );
  });

  it('does not overlap lifecycle cycles', async () => {
    let finishMaterialization: (() => void) | undefined;
    const materializeRecurringEvents = jest.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishMaterialization = resolve;
        }),
    );
    const repository = {
      materializeRecurringEvents,
      dueEventsForFinalization: jest.fn().mockResolvedValue([]),
    } as unknown as AttendanceRepository;
    const service = new AttendanceLifecycleService(repository);

    const first = service.process();
    await service.process();
    finishMaterialization?.();
    await first;

    expect(materializeRecurringEvents).toHaveBeenCalledTimes(1);
  });
});
