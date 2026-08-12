import { Injectable } from '@nestjs/common';
import type { AdminPrincipal } from '../auth/admin.guard';
import { LiturgiesRepository } from './liturgies.repository';
import type { GenerateEventLiturgyDto } from './dto/generate-event-liturgy.dto';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/authenticated.guard';
import type { ControlLiturgyItemDto } from './dto/control-liturgy-item.dto';

@Injectable()
export class LiturgiesService {
  constructor(private readonly repository: LiturgiesRepository) {}

  async templates(admin: AdminPrincipal) {
    await this.repository.ensureSundayDefaults(admin.churchId, admin.id);
    return this.repository.listTemplates(admin.churchId);
  }

  eventLiturgy(eventId: string, admin: AdminPrincipal) {
    return this.repository.eventLiturgy(eventId, admin.churchId);
  }

  async generate(eventId: string, body: GenerateEventLiturgyDto, admin: AdminPrincipal) {
    if (body.preacherImageUrl) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      if (!cloudName || !body.preacherImageUrl.startsWith(`https://res.cloudinary.com/${cloudName}/`))
        throw new BadRequestException('The preacher image must use the configured Cloudinary account.');
    }
    await this.repository.ensureSundayDefaults(admin.churchId, admin.id);
    return this.repository.generateEventLiturgy({
      eventId,
      churchId: admin.churchId,
      actorUserId: admin.id,
      ...body,
    });
  }

  private async assertOperator(user: AuthenticatedPrincipal) {
    if (user.roles.some((role) => ['SUPER_ADMIN', 'ADMIN', 'PASTOR'].includes(role))) return;
    if (!(await this.repository.isActiveMediaMember(user.id, user.churchId)))
      throw new ForbiddenException('Only administrators, pastors, and active Media members can operate a service liturgy.');
  }

  async liveEvent(eventId: string, user: AuthenticatedPrincipal) {
    await this.assertOperator(user);
    return this.repository.eventLiturgy(eventId, user.churchId);
  }

  async control(itemId: string, body: ControlLiturgyItemDto, user: AuthenticatedPrincipal) {
    await this.assertOperator(user);
    if (body.action === 'EXTEND' && !body.extensionMinutes)
      throw new BadRequestException('Choose how many minutes to add.');
    return this.repository.controlItem({
      itemId,
      churchId: user.churchId,
      actorUserId: user.id,
      action: body.action,
      extensionMinutes: body.extensionMinutes,
    });
  }
}
