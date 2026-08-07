import { LeaderboardsRepository } from './leaderboards.repository';
import { LeaderboardsService } from './leaderboards.service';

describe('LeaderboardsService', () => {
  it('ranks qualified members by the official weighted score', async () => {
    const repository = {
      individual: jest.fn().mockResolvedValue({
        rows: [
          {
            memberId: 'one',
            firstName: 'Ama',
            lastName: 'Mensah',
            status: 'ON_TIME',
            punctualityStatus: 'ON_TIME',
          },
          {
            memberId: 'one',
            firstName: 'Ama',
            lastName: 'Mensah',
            status: 'ON_TIME',
            punctualityStatus: 'ON_TIME',
          },
          {
            memberId: 'one',
            firstName: 'Ama',
            lastName: 'Mensah',
            status: 'ABSENT',
            punctualityStatus: null,
          },
        ],
        points: [{ memberId: 'one', points: 20 }],
      }),
    } as unknown as LeaderboardsRepository;
    const service = new LeaderboardsService(repository);

    const result = await service.individual(
      { period: 'MONTHLY', date: '2026-08-15', limit: 50 },
      { id: 'user', churchId: 'church', email: 'a@b.com', roles: ['MEMBER'] },
    );

    expect(result.items[0]).toMatchObject({
      rank: 1,
      attendanceRate: 66.67,
      punctualityRate: 100,
      score: 76.67,
      secondaryPoints: 20,
    });
  });

  it('does not rank members below the three-event minimum', async () => {
    const repository = {
      individual: jest.fn().mockResolvedValue({
        rows: [
          {
            memberId: 'one',
            firstName: 'Kojo',
            lastName: 'Asare',
            status: 'EARLY',
            punctualityStatus: 'EARLY',
          },
        ],
        points: [],
      }),
    } as unknown as LeaderboardsRepository;
    const service = new LeaderboardsService(repository);
    const result = await service.individual(
      { period: 'WEEKLY', date: '2026-08-05', limit: 50 },
      { id: 'user', churchId: 'church', email: 'a@b.com', roles: ['MEMBER'] },
    );
    expect(result.items[0]).toMatchObject({ rank: null, qualified: false });
  });

  it('ranks departments from expected member slots and punctuality', async () => {
    const repository = {
      departments: jest.fn().mockResolvedValue([
        {
          departmentId: 'media',
          departmentName: 'Media',
          eventId: 'event-1',
          memberId: 'one',
          status: 'ON_TIME',
          punctualityStatus: 'ON_TIME',
        },
        {
          departmentId: 'media',
          departmentName: 'Media',
          eventId: 'event-2',
          memberId: 'one',
          status: 'LATE',
          punctualityStatus: 'LATE',
        },
        {
          departmentId: 'media',
          departmentName: 'Media',
          eventId: 'event-3',
          memberId: 'one',
          status: null,
          punctualityStatus: null,
        },
        {
          departmentId: 'media',
          departmentName: 'Media',
          eventId: 'event-3',
          memberId: 'two',
          status: 'EXCUSED',
          punctualityStatus: null,
        },
      ]),
    } as unknown as LeaderboardsRepository;
    const service = new LeaderboardsService(repository);

    const result = await service.departments(
      { period: 'MONTHLY', date: '2026-08-15', limit: 50 },
      { id: 'user', churchId: 'church', email: 'a@b.com', roles: ['MEMBER'] },
    );

    expect(result.items[0]).toMatchObject({
      rank: 1,
      applicableEvents: 3,
      expectedAttendanceSlots: 3,
      attendedSlots: 2,
      attendanceRate: 66.67,
      punctualityRate: 50,
      score: 61.67,
      qualified: true,
    });
  });

  it('leaves departments below the three-event minimum unranked', async () => {
    const repository = {
      departments: jest.fn().mockResolvedValue([
        {
          departmentId: 'choir',
          departmentName: 'Choir',
          eventId: 'event-1',
          memberId: 'one',
          status: 'ON_TIME',
          punctualityStatus: 'ON_TIME',
        },
      ]),
    } as unknown as LeaderboardsRepository;
    const service = new LeaderboardsService(repository);
    const result = await service.departments(
      { period: 'WEEKLY', date: '2026-08-05', limit: 50 },
      { id: 'user', churchId: 'church', email: 'a@b.com', roles: ['MEMBER'] },
    );

    expect(result.items[0]).toMatchObject({ rank: null, qualified: false });
  });

  it('records a non-zero member point adjustment', async () => {
    const createAdjustment = jest.fn().mockResolvedValue({
      id: 'entry',
      points: -5,
      reason: 'Missed service duty',
    });
    const service = new LeaderboardsService({
      createAdjustment,
    } as unknown as LeaderboardsRepository);
    const result = await service.adjustMemberPoints(
      'member',
      { points: -5, reason: 'Missed service duty' },
      {
        id: 'admin',
        churchId: 'church',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    );
    expect(result.points).toBe(-5);
    expect(createAdjustment).toHaveBeenCalledWith(
      expect.objectContaining({
        memberId: 'member',
        churchId: 'church',
        actorUserId: 'admin',
        points: -5,
      }),
    );
  });

  it('rejects a zero-point adjustment', async () => {
    await expect(
      new LeaderboardsService({} as LeaderboardsRepository).adjustMemberPoints(
        'member',
        { points: 0, reason: 'No change' },
        {
          id: 'admin',
          churchId: 'church',
          email: 'admin@example.com',
          roles: ['ADMIN'],
        },
      ),
    ).rejects.toThrow('Point adjustment cannot be zero.');
  });
});
