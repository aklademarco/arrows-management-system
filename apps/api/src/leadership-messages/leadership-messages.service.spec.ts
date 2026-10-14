import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { LeadershipMessageAudience } from './dto/create-leadership-message.dto';
import { LeadershipMessagesService } from './leadership-messages.service';

describe('LeadershipMessagesService', () => {
  const leader = {
    id: 'leader',
    churchId: 'church',
    email: 'leader@test.com',
    roles: ['DEPARTMENT_LEADER'],
  };
  const pastor = { ...leader, roles: ['PASTOR'] };

  it('rejects a member without a leadership role', async () => {
    const repository = {
      activeLedDepartments: jest
        .fn()
        .mockResolvedValue([
          { id: '11111111-1111-4111-8111-111111111111', name: 'Choir' },
        ]),
    };
    const service = new LeadershipMessagesService(repository as never);

    await expect(
      service.composeContext({ ...leader, roles: ['MEMBER'] }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.activeLedDepartments).not.toHaveBeenCalled();
  });

  it('does not grant department scope to a pastor without the department leader role', async () => {
    const repository = {
      activeLedDepartments: jest
        .fn()
        .mockResolvedValue([
          { id: '11111111-1111-4111-8111-111111111111', name: 'Choir' },
        ]),
    };
    const service = new LeadershipMessagesService(repository as never);

    await expect(service.composeContext(pastor)).resolves.toMatchObject({
      canMessageChurch: true,
      departments: [],
    });
    expect(repository.activeLedDepartments).not.toHaveBeenCalled();
  });

  it('opens the message workspace for a leader awaiting a department assignment', async () => {
    const repository = {
      activeLedDepartments: jest.fn().mockResolvedValue([]),
      sent: jest.fn().mockResolvedValue([]),
    };
    const service = new LeadershipMessagesService(repository as never);

    await expect(service.composeContext(leader)).resolves.toMatchObject({
      canMessageChurch: false,
      departments: [],
    });
    await expect(service.sent(leader)).resolves.toEqual([]);
  });

  it('prevents an unassigned leader from sending a message', async () => {
    const repository = {
      activeLedDepartments: jest.fn().mockResolvedValue([]),
    };
    const service = new LeadershipMessagesService(repository as never);

    await expect(
      service.create(
        {
          audience: LeadershipMessageAudience.DEPARTMENT,
          title: 'Notice',
          body: 'Message',
        },
        leader,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('prevents a department leader from messaging the whole church', async () => {
    const repository = {
      activeLedDepartments: jest
        .fn()
        .mockResolvedValue([
          { id: '11111111-1111-4111-8111-111111111111', name: 'Choir' },
        ]),
    };
    const service = new LeadershipMessagesService(repository as never);
    await expect(
      service.create(
        {
          audience: LeadershipMessageAudience.CHURCH,
          title: 'Notice',
          body: 'Message',
        },
        leader,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('prevents a leader from selecting a department they do not lead', async () => {
    const repository = {
      activeLedDepartments: jest
        .fn()
        .mockResolvedValue([
          { id: '11111111-1111-4111-8111-111111111111', name: 'Choir' },
        ]),
    };
    const service = new LeadershipMessagesService(repository as never);
    await expect(
      service.create(
        {
          audience: LeadershipMessageAudience.DEPARTMENT,
          title: 'Notice',
          body: 'Message',
          departmentIds: ['22222222-2222-4222-8222-222222222222'],
        },
        leader,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires at least one department for a team message', async () => {
    const repository = {
      activeLedDepartments: jest
        .fn()
        .mockResolvedValue([
          { id: '11111111-1111-4111-8111-111111111111', name: 'Choir' },
        ]),
    };
    const service = new LeadershipMessagesService(repository as never);
    await expect(
      service.create(
        {
          audience: LeadershipMessageAudience.DEPARTMENT,
          title: 'Notice',
          body: 'Message',
        },
        leader,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows a pastor to message the whole church', async () => {
    const repository = {
      activeLedDepartments: jest.fn().mockResolvedValue([]),
      create: jest
        .fn()
        .mockResolvedValue({ id: 'message', recipientCount: 10 }),
    };
    const service = new LeadershipMessagesService(repository as never);
    await expect(
      service.create(
        {
          audience: LeadershipMessageAudience.CHURCH,
          title: 'Church notice',
          body: 'Please take note.',
        },
        pastor,
      ),
    ).resolves.toEqual({ id: 'message', recipientCount: 10 });
  });
  it('accepts a private member recipient without a department broadcast', async () => {
    const repository = {
      activeLedDepartments: jest
        .fn()
        .mockResolvedValue([{ id: 'department', name: 'Choir' }]),
      create: jest.fn().mockResolvedValue({ recipientCount: 1 }),
    };
    const service = new LeadershipMessagesService(repository as never);
    await service.create(
      {
        audience: LeadershipMessageAudience.MEMBER,
        title: 'Hello',
        body: 'Private',
        recipientMemberId: 'member',
      },
      leader,
    );
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        audience: 'MEMBER',
        recipientMemberId: 'member',
        departmentIds: [],
        smsRequested: false,
      }),
    );
  });

  it.each([
    { audience: LeadershipMessageAudience.MEMBER },
    {
      audience: LeadershipMessageAudience.MEMBER,
      recipientMemberId: 'member',
      departmentIds: ['department'],
    },
    {
      audience: LeadershipMessageAudience.MEMBER,
      recipientMemberId: 'member',
      smsRequested: true,
    },
    {
      audience: LeadershipMessageAudience.DEPARTMENT,
      recipientMemberId: 'member',
      departmentIds: ['department'],
    },
  ])(
    'rejects ambiguous or non-private recipient selections: %j',
    async (selection) => {
      const repository = {
        activeLedDepartments: jest
          .fn()
          .mockResolvedValue([{ id: 'department', name: 'Choir' }]),
        create: jest.fn(),
      };
      const service = new LeadershipMessagesService(repository as never);
      await expect(
        service.create(
          { title: 'Hello', body: 'Message', ...selection },
          leader,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    },
  );

  it('does not expose the team list to ordinary members', async () => {
    const repository = { team: jest.fn() };
    const service = new LeadershipMessagesService(repository as never);
    await expect(
      service.team({ page: 1, limit: 24 }, { ...leader, roles: ['MEMBER'] }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.team).not.toHaveBeenCalled();
  });
});
