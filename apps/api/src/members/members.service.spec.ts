import 'reflect-metadata';
import { ListMembersDto } from './dto/list-members.dto';
import { MembersRepository } from './members.repository';
import { MembersService } from './members.service';

describe('MembersService', () => {
  it('changes the primary assignment without changing memberships', async () => {
    const setPrimaryDepartment = jest.fn().mockResolvedValue({
      departmentMembershipId: 'membership-id',
      effectiveOn: '2026-08-01',
    });
    const service = new MembersService({
      setPrimaryDepartment,
    } as unknown as MembersRepository);
    const input = {
      memberId: 'member-id',
      churchId: 'church-id',
      actorUserId: 'admin-id',
      departmentMembershipId: 'membership-id',
      effectiveOn: '2026-08-01',
      reason: 'Primary responsibility changed.',
    };

    await service.setPrimaryDepartment(input);

    expect(setPrimaryDepartment).toHaveBeenCalledWith(input);
  });

  it('archives a member within the administrator church', async () => {
    const archiveMember = jest.fn().mockResolvedValue(undefined);
    const service = new MembersService({
      archiveMember,
    } as unknown as MembersRepository);
    const input = {
      memberId: 'member-id',
      actorUserId: 'admin-id',
      churchId: 'church-id',
    };

    await service.archiveMember(input);

    expect(archiveMember).toHaveBeenCalledWith(input);
  });

  it('passes administrator member updates with church scope', async () => {
    const updateMember = jest.fn().mockResolvedValue({ id: 'member-id' });
    const service = new MembersService({
      updateMember,
    } as unknown as MembersRepository);
    const input = {
      memberId: 'member-id',
      actorUserId: 'admin-id',
      churchId: 'church-id',
      updates: { membershipStatus: 'ON_LEAVE' as const },
    };

    await service.updateMember(input);

    expect(updateMember).toHaveBeenCalledWith(input);
  });

  it('updates only the authenticated member profile', async () => {
    const updateOwnProfile = jest.fn().mockResolvedValue({ id: 'member-id' });
    const service = new MembersService({
      updateOwnProfile,
    } as unknown as MembersRepository);

    await service.updateOwnProfile(
      {
        id: 'user-id',
        churchId: 'church-id',
        email: 'member@example.com',
        roles: ['MEMBER'],
      },
      { firstName: 'Updated' },
    );

    expect(updateOwnProfile).toHaveBeenCalledWith({
      userId: 'user-id',
      churchId: 'church-id',
      updates: { firstName: 'Updated' },
    });
  });

  it('rejects an empty profile update', () => {
    const service = new MembersService({} as MembersRepository);

    expect(() =>
      service.updateOwnProfile(
        {
          id: 'user-id',
          churchId: 'church-id',
          email: 'member@example.com',
          roles: ['MEMBER'],
        },
        {},
      ),
    ).toThrow('Provide at least one profile field.');
  });

  it('loads a member within the administrator church', async () => {
    const findById = jest.fn().mockResolvedValue({ id: 'member-id' });
    const service = new MembersService({
      findById,
    } as unknown as MembersRepository);

    await service.findById('member-id', 'church-id');

    expect(findById).toHaveBeenCalledWith('member-id', 'church-id');
  });

  it('passes validated filters and church scope to the repository', async () => {
    const list = jest.fn().mockResolvedValue({ items: [], total: 0 });
    const service = new MembersService({
      list,
    } as unknown as MembersRepository);
    const query = new ListMembersDto();
    query.search = 'Marco';
    query.departmentId = 'c87f9051-bff8-40a8-a773-dc3ab40fb279';

    await service.list(query, 'church-id');

    expect(list).toHaveBeenCalledWith(query, 'church-id');
  });
});
