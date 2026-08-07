import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AdminPrincipal } from '../auth/admin.guard';
import type { ListAuditLogsDto } from './dto/list-audit-logs.dto';
import { AuditLogsRepository } from './audit-logs.repository';

@Injectable()
export class AuditLogsService {
  constructor(private readonly repository: AuditLogsRepository) {}
  list(query: ListAuditLogsDto, user: AdminPrincipal) {
    if (!user.roles.includes('SUPER_ADMIN'))
      throw new ForbiddenException(
        'Only Super Administrators can view audit logs.',
      );
    return this.repository.list(user.churchId, query);
  }
}
