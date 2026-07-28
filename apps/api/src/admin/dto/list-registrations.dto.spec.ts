import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListRegistrationsDto } from './list-registrations.dto';

describe('ListRegistrationsDto', () => {
  it('transforms and accepts bounded pagination filters', async () => {
    const query = plainToInstance(ListRegistrationsDto, {
      search: 'Bismark',
      requestedDepartmentId: 'c87f9051-bff8-40a8-a773-dc3ab40fb279',
      page: '2',
      limit: '50',
    });

    await expect(validate(query)).resolves.toHaveLength(0);
    expect(query.page).toBe(2);
    expect(query.limit).toBe(50);
  });

  it('rejects pagination values outside the supported range', async () => {
    const query = plainToInstance(ListRegistrationsDto, {
      page: '0',
      limit: '101',
    });

    await expect(validate(query)).resolves.toHaveLength(2);
  });
});
