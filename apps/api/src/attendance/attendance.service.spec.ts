import { HttpException, NotFoundException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import type { AttendanceRepository } from './attendance.repository';
import type { Database } from '../database/database.module';
import type { AuthenticatedPrincipal } from '../auth/authenticated.guard';

const user: AuthenticatedPrincipal = {
  id: 'user-1',
  email: 'member@example.com',
  churchId: 'church-1',
  roles: ['MEMBER'],
};

// Attendance window spanning "now" so the service's internal new Date() always
// falls inside it, keeping these tests deterministic regardless of wall clock.
function buildEventRow() {
  const now = Date.now();
  return {
    id: 'event-1',
    churchId: 'church-1',
    status: 'ACTIVE',
    attendanceOpensAt: new Date(now - 60 * 60 * 1000),
    attendanceClosesAt: new Date(now + 60 * 60 * 1000),
    earlyUntil: new Date(now - 30 * 60 * 1000),
    lateAfter: new Date(now + 30 * 60 * 1000),
    maximumAccuracyMeters: 50,
    geofenceRadiusMeters: 100,
    latitude: '5.603700',
    longitude: '-0.187000',
  };
}

function buildDatabase(): Database {
  const eventRow = buildEventRow();
  const chain = {
    from: () => chain,
    where: () => chain,
    limit: () => Promise.resolve([eventRow]),
  };
  return { select: () => chain } as unknown as Database;
}

function buildService(overrides: Partial<AttendanceRepository> = {}) {
  const repository = {
    findActiveMemberId: jest.fn().mockResolvedValue('member-1'),
    isMemberEligibleForEvent: jest.fn().mockResolvedValue(true),
    checkIn: jest.fn().mockResolvedValue({ id: 'attendance-1' }),
    ...overrides,
  } as unknown as AttendanceRepository;
  const service = new AttendanceService(repository, buildDatabase());
  return { service, repository };
}

describe('AttendanceService.checkIn eligibility', () => {
  const validLocation = {
    eventId: 'event-1',
    latitude: 5.6037,
    longitude: -0.187,
    accuracyMeters: 10,
  };

  it('rejects a member without an active profile before touching the event', async () => {
    const { service, repository } = buildService({
      findActiveMemberId: jest.fn().mockResolvedValue(null),
    });
    await expect(service.checkIn(user, validLocation)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.isMemberEligibleForEvent).not.toHaveBeenCalled();
  });

  it('rejects an ineligible member with EVENT_NOT_ELIGIBLE before location checks', async () => {
    const { service, repository } = buildService({
      isMemberEligibleForEvent: jest.fn().mockResolvedValue(false),
    });
    // Accuracy is deliberately terrible; eligibility must fail first.
    const error = await service
      .checkIn(user, { ...validLocation, accuracyMeters: 999 })
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getResponse()).toMatchObject({
      code: 'EVENT_NOT_ELIGIBLE',
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.checkIn).not.toHaveBeenCalled();
  });

  it('checks eligibility with the resolved member profile id', async () => {
    const { service, repository } = buildService();
    await service.checkIn(user, validLocation);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.isMemberEligibleForEvent).toHaveBeenCalledWith(
      'member-1',
      'event-1',
      'church-1',
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.checkIn).toHaveBeenCalledWith(
      expect.objectContaining({ memberId: 'member-1', eventId: 'event-1' }),
    );
  });

  it('still enforces location accuracy for eligible members', async () => {
    const { service } = buildService();
    const error = await service
      .checkIn(user, { ...validLocation, accuracyMeters: 999 })
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getResponse()).toMatchObject({
      code: 'POOR_LOCATION_ACCURACY',
    });
  });
});
