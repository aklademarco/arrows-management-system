import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/authenticated.guard';
import {
  LeadershipMessageAudience,
  type CreateLeadershipMessageDto,
} from './dto/create-leadership-message.dto';
import { LeadershipMessagesRepository } from './leadership-messages.repository';
import type { ListDirectoryDto } from '../members/dto/list-directory.dto';
import { isHubtelConfigured } from './hubtel-sms.provider';

@Injectable()
export class LeadershipMessagesService {
  constructor(private readonly repository: LeadershipMessagesRepository) {}

  async composeContext(user: AuthenticatedPrincipal) {
    const canMessageChurch = user.roles.includes('PASTOR');
    const canMessageDepartments = user.roles.includes('DEPARTMENT_LEADER');
    if (!canMessageChurch && !canMessageDepartments)
      throw new ForbiddenException(
        'A pastor or department leader role is required to use messaging.',
      );
    const departments = canMessageDepartments
      ? await this.repository.activeLedDepartments(user.id, user.churchId)
      : [];
    return {
      canMessageChurch,
      departments,
      smsAvailable: isHubtelConfigured(),
    };
  }

  async team(query: ListDirectoryDto, user: AuthenticatedPrincipal) {
    if (!user.roles.includes('DEPARTMENT_LEADER'))
      throw new ForbiddenException('Department leadership is required.');
    return this.repository.team(user.id, user.churchId, query);
  }

  async sent(user: AuthenticatedPrincipal) {
    await this.composeContext(user);
    return this.repository.sent(user.id, user.churchId);
  }

  async create(body: CreateLeadershipMessageDto, user: AuthenticatedPrincipal) {
    const context = await this.composeContext(user);
    if (!context.canMessageChurch && context.departments.length === 0)
      throw new ForbiddenException(
        'An administrator must assign you to an active department before you can send messages.',
      );
    if (body.smsRequested && !context.smsAvailable)
      throw new BadRequestException(
        'SMS delivery is not configured. Send this as a dashboard message instead.',
      );
    if (!body.title.trim() || !body.body.trim())
      throw new BadRequestException('A title and message are required.');
    if (body.audience === LeadershipMessageAudience.MEMBER) {
      if (
        !user.roles.includes('DEPARTMENT_LEADER') ||
        !context.departments.length
      )
        throw new ForbiddenException(
          'An active department leadership assignment is required.',
        );
      if (
        !body.recipientMemberId ||
        body.departmentIds?.length ||
        body.smsRequested
      )
        throw new BadRequestException(
          'Choose one member for a private in-app message without department selections or SMS.',
        );
    } else if (body.recipientMemberId) {
      throw new BadRequestException(
        'Individual recipients require a private message.',
      );
    }
    let departmentIds: string[] = [];
    if (body.audience === LeadershipMessageAudience.CHURCH) {
      if (!context.canMessageChurch)
        throw new ForbiddenException(
          'Only pastors can message the entire church.',
        );
      if (body.departmentIds?.length)
        throw new BadRequestException(
          'Church-wide messages cannot include department selections.',
        );
    } else if (body.audience === LeadershipMessageAudience.DEPARTMENT) {
      departmentIds = [...new Set(body.departmentIds ?? [])];
      if (!departmentIds.length)
        throw new BadRequestException('Choose at least one department.');
      const allowed = new Set(
        context.departments.map((department) => department.id),
      );
      if (departmentIds.some((id) => !allowed.has(id)))
        throw new ForbiddenException(
          'You can message only departments you actively lead.',
        );
    }
    return this.repository.create({
      churchId: user.churchId,
      senderUserId: user.id,
      audience: body.audience,
      title: body.title.trim(),
      body: body.body.trim(),
      departmentIds,
      recipientMemberId: body.recipientMemberId,
      smsRequested: body.smsRequested === true,
    });
  }
}
