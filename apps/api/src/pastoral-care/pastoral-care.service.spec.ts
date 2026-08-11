import { NotFoundException } from '@nestjs/common';
import { PastoralCareService } from './pastoral-care.service';

describe('PastoralCareService', () => {
  const user = {
    id: 'actor-id',
    churchId: 'church-id',
    email: 'pastor@example.com',
    roles: ['ADMIN'],
  };

  it('includes only members with at least two recent unexcused absences', async () => {
    const repository = {
      absentRecords: jest.fn().mockResolvedValue([
        {
          memberId: 'member-1',
          firstName: 'Ama',
          lastName: 'Serwaa',
          email: 'ama@example.com',
          phone: null,
          profilePhotoUrl: null,
          eventId: 'event-2',
          eventName: 'Sunday Service',
          eventStartsAt: new Date('2026-08-09T09:00:00Z'),
        },
        {
          memberId: 'member-1',
          firstName: 'Ama',
          lastName: 'Serwaa',
          email: 'ama@example.com',
          phone: null,
          profilePhotoUrl: null,
          eventId: 'event-1',
          eventName: 'Sunday Service',
          eventStartsAt: new Date('2026-08-02T09:00:00Z'),
        },
        {
          memberId: 'member-2',
          firstName: 'Kojo',
          lastName: 'Mensah',
          email: 'kojo@example.com',
          phone: null,
          profilePhotoUrl: null,
          eventId: 'event-2',
          eventName: 'Sunday Service',
          eventStartsAt: new Date('2026-08-09T09:00:00Z'),
        },
      ]),
      recentFollowUps: jest.fn().mockResolvedValue([]),
    };
    const service = new PastoralCareService(repository as never);

    const result = await service.queue(user);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      memberId: 'member-1',
      absenceCount: 2,
      careStatus: 'NEEDS_CONTACT',
    });
    expect(repository.recentFollowUps).toHaveBeenCalledWith('church-id', [
      'member-1',
    ]);
  });

  it('classifies completed care from the latest follow-up', async () => {
    const absence = {
      memberId: 'member-1',
      firstName: 'Ama',
      lastName: 'Serwaa',
      email: 'ama@example.com',
      phone: null,
      profilePhotoUrl: null,
      eventId: 'event-1',
      eventName: 'Sunday Service',
      eventStartsAt: new Date('2026-08-09T09:00:00Z'),
    };
    const repository = {
      absentRecords: jest
        .fn()
        .mockResolvedValue([absence, { ...absence, eventId: 'event-2' }]),
      recentFollowUps: jest.fn().mockResolvedValue([
        {
          id: 'follow-up-1',
          memberId: 'member-1',
          method: 'CALL',
          outcome: 'CARE_COMPLETED',
          notes: null,
          contactedAt: new Date(),
          nextFollowUpOn: null,
          contactedByEmail: 'pastor@example.com',
        },
      ]),
    };
    const service = new PastoralCareService(repository as never);

    const result = await service.queue(user);

    expect(result[0].careStatus).toBe('CARE_COMPLETED');
  });

  it('does not record care notes for a member outside the church', async () => {
    const repository = {
      memberInChurch: jest.fn().mockResolvedValue(null),
      createFollowUp: jest.fn(),
    };
    const service = new PastoralCareService(repository as never);

    await expect(
      service.record('member-id', { method: 'CALL', outcome: 'REACHED' }, user),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.createFollowUp).not.toHaveBeenCalled();
  });
});
