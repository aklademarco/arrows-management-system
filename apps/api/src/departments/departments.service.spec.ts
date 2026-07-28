import { DepartmentsRepository } from './departments.repository';
import { DepartmentsService } from './departments.service';

describe('DepartmentsService', () => {
  it('assigns a department leader through the repository transaction', async () => {
    const assignLeader = jest.fn().mockResolvedValue({ id: 'assignment-id' });
    const service = new DepartmentsService({
      assignLeader,
    } as unknown as DepartmentsRepository);
    const input = {
      departmentId: 'department-id',
      churchId: 'church-id',
      actorUserId: 'admin-id',
      memberId: 'member-id',
      startsAt: '2026-07-28',
      title: 'Media Head',
    };

    await service.assignLeader(input);

    expect(assignLeader).toHaveBeenCalledWith(input);
  });

  it('rejects a leadership term whose end precedes its start', () => {
    const service = new DepartmentsService({} as DepartmentsRepository);

    expect(() =>
      service.assignLeader({
        departmentId: 'department-id',
        churchId: 'church-id',
        actorUserId: 'admin-id',
        memberId: 'member-id',
        startsAt: '2026-07-28',
        endsAt: '2026-07-27',
      }),
    ).toThrow('The leadership end date cannot precede its start date.');
  });

  it('revokes a department leader through the repository transaction', async () => {
    const revokeLeader = jest.fn().mockResolvedValue({ id: 'assignment-id' });
    const service = new DepartmentsService({
      revokeLeader,
    } as unknown as DepartmentsRepository);
    const input = {
      departmentId: 'department-id',
      assignmentId: 'assignment-id',
      churchId: 'church-id',
      actorUserId: 'admin-id',
      reason: 'Leadership responsibility reassigned.',
    };

    await service.revokeLeader(input);

    expect(revokeLeader).toHaveBeenCalledWith(input);
  });

  it('ends a dated membership without deleting it', async () => {
    const endMembership = jest.fn().mockResolvedValue({
      id: 'membership-id',
      leftAt: '2026-08-01',
    });
    const service = new DepartmentsService({
      endMembership,
    } as unknown as DepartmentsRepository);
    const input = {
      departmentId: 'department-id',
      membershipId: 'membership-id',
      churchId: 'church-id',
      actorUserId: 'admin-id',
      leftAt: '2026-08-01',
      reason: 'Member transferred.',
    };

    await service.endMembership(input);

    expect(endMembership).toHaveBeenCalledWith(input);
  });

  it('adds a member through the dated membership transaction', async () => {
    const addMember = jest.fn().mockResolvedValue({ id: 'membership-id' });
    const service = new DepartmentsService({
      addMember,
    } as unknown as DepartmentsRepository);
    const input = {
      departmentId: 'department-id',
      churchId: 'church-id',
      actorUserId: 'admin-id',
      memberId: 'member-id',
      makePrimary: true,
      joinedAt: '2026-07-22',
    };

    await service.addMember(input);

    expect(addMember).toHaveBeenCalledWith(input);
  });

  it('deactivates a department with church and actor scope', async () => {
    const deactivate = jest.fn().mockResolvedValue(undefined);
    const service = new DepartmentsService({
      deactivate,
    } as unknown as DepartmentsRepository);
    const input = {
      departmentId: 'department-id',
      churchId: 'church-id',
      actorUserId: 'admin-id',
    };

    await service.deactivate(input);

    expect(deactivate).toHaveBeenCalledWith(input);
  });

  it('updates a department with church and actor scope', async () => {
    const update = jest.fn().mockResolvedValue({ id: 'department-id' });
    const service = new DepartmentsService({
      update,
    } as unknown as DepartmentsRepository);
    const input = {
      departmentId: 'department-id',
      churchId: 'church-id',
      actorUserId: 'admin-id',
      updates: { name: 'Media and Communications' },
    };

    await service.update(input);

    expect(update).toHaveBeenCalledWith(input);
  });

  it('creates a department with church and actor scope', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'department-id' });
    const service = new DepartmentsService({
      create,
    } as unknown as DepartmentsRepository);
    const input = {
      churchId: 'church-id',
      actorUserId: 'admin-id',
      name: 'Media',
      description: 'Church media team.',
    };

    await service.create(input);

    expect(create).toHaveBeenCalledWith(input);
  });

  it('lists departments within the authenticated church', async () => {
    const list = jest.fn().mockResolvedValue([]);
    const service = new DepartmentsService({
      list,
    } as unknown as DepartmentsRepository);

    await service.list('church-id');

    expect(list).toHaveBeenCalledWith('church-id');
  });
});
