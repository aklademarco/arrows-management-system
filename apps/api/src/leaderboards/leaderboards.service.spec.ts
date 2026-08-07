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
});
