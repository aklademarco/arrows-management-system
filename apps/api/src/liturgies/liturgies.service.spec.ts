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

  it('generates an event liturgy after ensuring defaults', async () => {
    const repository = {
      ensureSundayDefaults: jest.fn().mockResolvedValue(undefined),
      generateEventLiturgy: jest.fn().mockResolvedValue({ id: 'liturgy-id' }),
    };
    const service = new LiturgiesService(repository as never);
    const admin = { id: 'admin-id', churchId: 'church-id', email: 'admin@example.com', roles: ['ADMIN'] };
    await expect(service.generate('event-id', { preacherName: 'Pastor Ken' }, admin)).resolves.toEqual({ id: 'liturgy-id' });
    expect(repository.generateEventLiturgy).toHaveBeenCalledWith(expect.objectContaining({
      eventId: 'event-id',
      churchId: 'church-id',
      actorUserId: 'admin-id',
      preacherName: 'Pastor Ken',
    }));
  });

  it('allows an active Media member to operate a liturgy', async () => {
    const repository = {
      isActiveMediaMember: jest.fn().mockResolvedValue(true),
      controlItem: jest.fn().mockResolvedValue({ id: 'item-id', status: 'ACTIVE' }),
    };
    const service = new LiturgiesService(repository as never);
    const member = { id: 'media-user', churchId: 'church-id', email: 'media@example.com', roles: ['MEMBER'] };
    await expect(service.control('item-id', { action: 'START' as never }, member)).resolves.toEqual({ id: 'item-id', status: 'ACTIVE' });
  });
});
