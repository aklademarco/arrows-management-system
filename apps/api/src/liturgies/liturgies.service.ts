import { Injectable } from '@nestjs/common';
import type { AdminPrincipal } from '../auth/admin.guard';
import { LiturgiesRepository } from './liturgies.repository';

@Injectable()
export class LiturgiesService {
  constructor(private readonly repository: LiturgiesRepository) {}

  async templates(admin: AdminPrincipal) {
    await this.repository.ensureSundayDefaults(admin.churchId, admin.id);
    return this.repository.listTemplates(admin.churchId);
  }
}
