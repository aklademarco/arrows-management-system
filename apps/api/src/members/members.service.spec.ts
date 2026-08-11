import 'reflect-metadata';
import { ListMembersDto } from './dto/list-members.dto';
import { ListDirectoryDto } from './dto/list-directory.dto';
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

  const admin = {
    id: 'admin-id',
    churchId: 'church-id',
    email: 'admin@example.com',
    roles: ['ADMIN'],
  };
  const leader = {
    id: 'leader-id',
    churchId: 'church-id',
    email: 'leader@example.com',
    roles: ['DEPARTMENT_LEADER'],
  };

  it('loads any member in the church for an administrator', async () => {
    const findById = jest.fn().mockResolvedValue({ id: 'member-id' });
    const service = new MembersService({
      findById,
    } as unknown as MembersRepository);

    await service.findById('member-id', admin);

    expect(findById).toHaveBeenCalledWith('member-id', 'church-id', undefined);
  });

  it('gives an administrator the whole-church member list', async () => {
    const list = jest.fn().mockResolvedValue({ items: [], total: 0 });
    const service = new MembersService({
      list,
    } as unknown as MembersRepository);
    const query = new ListMembersDto();
    query.search = 'Marco';

    await service.list(query, admin);

    expect(list).toHaveBeenCalledWith(query, 'church-id', undefined);
  });

  it('restricts a leader to the members of their led departments', async () => {
    const list = jest.fn().mockResolvedValue({ items: [], total: 0 });
    const findLedDepartmentIds = jest.fn().mockResolvedValue(['dept-a']);
    const service = new MembersService({
      list,
      findLedDepartmentIds,
    } as unknown as MembersRepository);
    const query = new ListMembersDto();

    await service.list(query, leader);

    expect(findLedDepartmentIds).toHaveBeenCalledWith('leader-id', 'church-id');
    expect(list).toHaveBeenCalledWith(query, 'church-id', ['dept-a']);
  });

  it('denies the directory to a viewer who leads nothing', async () => {
    const findLedDepartmentIds = jest.fn().mockResolvedValue([]);
    const service = new MembersService({
      findLedDepartmentIds,
    } as unknown as MembersRepository);

    await expect(service.list(new ListMembersDto(), leader)).rejects.toThrow(
      'You do not have access to the member directory.',
    );
  });

  it('allows a member to load the privacy-safe church directory', async () => {
    const directory = jest.fn().mockResolvedValue({ items: [], total: 0 });
    const service = new MembersService({
      directory,
    } as unknown as MembersRepository);
    const query = new ListDirectoryDto();
    const member = {
      id: 'member-user-id',
      churchId: 'church-id',
      email: 'member@example.com',
      roles: ['MEMBER'],
    };

    await service.directory(query, member);

    expect(directory).toHaveBeenCalledWith(query, 'church-id');
  });
});
