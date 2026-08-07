import { BadRequestException } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const admin = {
    id: 'admin',
    churchId: 'church',
    email: 'admin@example.com',
    roles: ['ADMIN'],
  };

  it('summarizes attendance and excludes excused records from the rate', async () => {
    const repository = {
      attendance: jest.fn().mockResolvedValue([
        {
          eventId: 'one',
          eventName: 'Service',
          eventStartsAt: new Date('2026-08-02T09:00:00Z'),
          attendanceId: 'a',
          firstName: 'Ama',
          lastName: 'Mensah',
          memberId: 'm1',
          status: 'ON_TIME',
          method: 'GEOLOCATION',
          punctualityStatus: 'ON_TIME',
        },
        {
          eventId: 'one',
          eventName: 'Service',
          eventStartsAt: new Date('2026-08-02T09:00:00Z'),
          attendanceId: 'b',
          firstName: 'Kojo',
          lastName: 'Asare',
          memberId: 'm2',
          status: 'LATE',
          method: 'MANUAL',
          punctualityStatus: 'LATE',
        },
        {
          eventId: 'one',
          eventName: 'Service',
          eventStartsAt: new Date('2026-08-02T09:00:00Z'),
          attendanceId: 'c',
          firstName: 'Esi',
          lastName: 'Owusu',
          memberId: 'm3',
          status: 'ABSENT',
          method: 'SYSTEM',
          punctualityStatus: null,
        },
        {
          eventId: 'one',
          eventName: 'Service',
          eventStartsAt: new Date('2026-08-02T09:00:00Z'),
          attendanceId: 'd',
          firstName: 'Yaw',
          lastName: 'Osei',
          memberId: 'm4',
          status: 'EXCUSED',
          method: 'SYSTEM',
          punctualityStatus: null,
        },
      ]),
    } as unknown as ReportsRepository;
    const result = await new ReportsService(repository).attendanceSummary(
      { from: '2026-08-01', to: '2026-08-31' },
      admin,
    );

    expect(result.totals).toEqual({
      events: 1,
      records: 4,
      attended: 2,
      absent: 1,
      excused: 1,
      manual: 1,
      attendanceRate: 66.67,
      punctualityRate: 50,
    });
    expect(result.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          memberId: 'm1',
          displayName: 'Ama Mensah',
          attendanceRate: 100,
          punctualityRate: 100,
        }),
        expect.objectContaining({
          memberId: 'm3',
          displayName: 'Esi Owusu',
          attendanceRate: 0,
          absent: 1,
        }),
      ]),
    );
  });

  it('rejects report ranges longer than one year', async () => {
    const repository = {
      attendance: jest.fn(),
    } as unknown as ReportsRepository;
    await expect(
      new ReportsService(repository).attendanceSummary(
        { from: '2025-01-01', to: '2026-08-01' },
        admin,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
