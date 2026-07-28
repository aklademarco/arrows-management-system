import { DepartmentsRepository } from './departments.repository';
import { DepartmentsService } from './departments.service';

describe('DepartmentsService', () => {
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
