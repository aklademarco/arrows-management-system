import 'reflect-metadata';
import { ListMembersDto } from './dto/list-members.dto';
import { MembersRepository } from './members.repository';
import { MembersService } from './members.service';

describe('MembersService', () => {
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
