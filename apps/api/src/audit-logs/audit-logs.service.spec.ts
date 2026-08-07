import { AuditLogsRepository } from './audit-logs.repository';
import { AuditLogsService } from './audit-logs.service';

describe('AuditLogsService', () => {
  it('allows a Super Administrator and scopes the query to their church', async () => {
    const list = jest.fn().mockResolvedValue({ items: [], total: 0 });
    const service = new AuditLogsService({
      list,
    } as unknown as AuditLogsRepository);
    await service.list(
      { page: 1, limit: 25 },
      {
        id: 'super',
        churchId: 'church',
        email: 'super@example.com',
        roles: ['SUPER_ADMIN'],
      },
    );
    expect(list).toHaveBeenCalledWith('church', { page: 1, limit: 25 });
  });
  it('rejects a regular administrator', () => {
    const service = new AuditLogsService({} as AuditLogsRepository);
    expect(() =>
      service.list(
        { page: 1, limit: 25 },
        {
          id: 'admin',
          churchId: 'church',
          email: 'admin@example.com',
          roles: ['ADMIN'],
        },
      ),
    ).toThrow('Only Super Administrators can view audit logs.');
  });
});
