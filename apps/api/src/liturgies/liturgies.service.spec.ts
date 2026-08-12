import { LiturgiesService } from './liturgies.service';

describe('LiturgiesService', () => {
  it('ensures church defaults before listing templates', async () => {
    const templates = [{ id: 'template-id', name: 'Normal Sunday Service' }];
    const repository = {
      ensureSundayDefaults: jest.fn().mockResolvedValue(undefined),
      listTemplates: jest.fn().mockResolvedValue(templates),
    };
    const service = new LiturgiesService(repository as never);
    const admin = { id: 'admin-id', churchId: 'church-id', email: 'admin@example.com', roles: ['ADMIN'] };
    await expect(service.templates(admin)).resolves.toEqual(templates);
    expect(repository.ensureSundayDefaults).toHaveBeenCalledWith('church-id', 'admin-id');
    expect(repository.listTemplates).toHaveBeenCalledWith('church-id');
  });
});
