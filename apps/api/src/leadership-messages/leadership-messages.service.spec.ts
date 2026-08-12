import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { LeadershipMessageAudience } from './dto/create-leadership-message.dto';
import { LeadershipMessagesService } from './leadership-messages.service';

describe('LeadershipMessagesService', () => {
  const leader = { id: 'leader', churchId: 'church', email: 'leader@test.com', roles: ['DEPARTMENT_LEADER'] };
  const pastor = { ...leader, roles: ['PASTOR'] };

  it('prevents a department leader from messaging the whole church', async () => {
    const repository = { activeLedDepartments: jest.fn().mockResolvedValue([{ id: '11111111-1111-4111-8111-111111111111', name: 'Choir' }]) };
    const service = new LeadershipMessagesService(repository as never);
    await expect(service.create({ audience: LeadershipMessageAudience.CHURCH, title: 'Notice', body: 'Message' }, leader)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('prevents a leader from selecting a department they do not lead', async () => {
    const repository = { activeLedDepartments: jest.fn().mockResolvedValue([{ id: '11111111-1111-4111-8111-111111111111', name: 'Choir' }]) };
    const service = new LeadershipMessagesService(repository as never);
    await expect(service.create({ audience: LeadershipMessageAudience.DEPARTMENT, title: 'Notice', body: 'Message', departmentIds: ['22222222-2222-4222-8222-222222222222'] }, leader)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires at least one department for a team message', async () => {
    const repository = { activeLedDepartments: jest.fn().mockResolvedValue([{ id: '11111111-1111-4111-8111-111111111111', name: 'Choir' }]) };
    const service = new LeadershipMessagesService(repository as never);
    await expect(service.create({ audience: LeadershipMessageAudience.DEPARTMENT, title: 'Notice', body: 'Message' }, leader)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows a pastor to message the whole church', async () => {
    const repository = {
      activeLedDepartments: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'message', recipientCount: 10 }),
    };
    const service = new LeadershipMessagesService(repository as never);
    await expect(service.create({ audience: LeadershipMessageAudience.CHURCH, title: 'Church notice', body: 'Please take note.' }, pastor)).resolves.toEqual({ id: 'message', recipientCount: 10 });
  });
});
