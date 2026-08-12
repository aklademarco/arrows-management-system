import { Injectable } from '@nestjs/common';
import type { AdminPrincipal } from '../auth/admin.guard';
import { LiturgiesRepository } from './liturgies.repository';
import type { GenerateEventLiturgyDto } from './dto/generate-event-liturgy.dto';
import { BadRequestException } from '@nestjs/common';

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
}
