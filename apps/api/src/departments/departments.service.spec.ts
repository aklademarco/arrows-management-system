import { DepartmentsRepository } from './departments.repository';
import { DepartmentsService } from './departments.service';

describe('DepartmentsService', () => {
  it('lists departments within the authenticated church', async () => {
    const list = jest.fn().mockResolvedValue([]);
    const service = new DepartmentsService({
      list,
    } as unknown as DepartmentsRepository);

    await service.list('church-id');

    expect(list).toHaveBeenCalledWith('church-id');
  });
});
