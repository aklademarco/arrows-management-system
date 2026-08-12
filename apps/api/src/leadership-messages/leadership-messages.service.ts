import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/authenticated.guard';
import {
  LeadershipMessageAudience,
  type CreateLeadershipMessageDto,
} from './dto/create-leadership-message.dto';
import { LeadershipMessagesRepository } from './leadership-messages.repository';

@Injectable()
export class LeadershipMessagesService {
  constructor(private readonly repository: LeadershipMessagesRepository) {}

  async composeContext(user: AuthenticatedPrincipal) {
    const departments = await this.repository.activeLedDepartments(user.id, user.churchId);
    const canMessageChurch = user.roles.includes('PASTOR');
    if (!canMessageChurch && departments.length === 0)
      throw new ForbiddenException('Only pastors and active department leaders can send messages.');
    return { canMessageChurch, departments };
  }

  async sent(user: AuthenticatedPrincipal) {
    await this.composeContext(user);
    return this.repository.sent(user.id, user.churchId);
  }

  async create(body: CreateLeadershipMessageDto, user: AuthenticatedPrincipal) {
    const context = await this.composeContext(user);
    let departmentIds: string[] = [];
    if (body.audience === LeadershipMessageAudience.CHURCH) {
      if (!context.canMessageChurch)
        throw new ForbiddenException('Only pastors can message the entire church.');
      if (body.departmentIds?.length)
        throw new BadRequestException('Church-wide messages cannot include department selections.');
    } else {
      departmentIds = [...new Set(body.departmentIds ?? [])];
      if (!departmentIds.length)
        throw new BadRequestException('Choose at least one department.');
      const allowed = new Set(context.departments.map((department) => department.id));
      if (departmentIds.some((id) => !allowed.has(id)))
        throw new ForbiddenException('You can message only departments you actively lead.');
    }
    return this.repository.create({
      churchId: user.churchId,
      senderUserId: user.id,
      audience: body.audience,
      title: body.title.trim(),
      body: body.body.trim(),
      departmentIds,
    });
  }
}
