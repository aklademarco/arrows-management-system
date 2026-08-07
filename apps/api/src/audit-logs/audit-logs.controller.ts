import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminUser } from '../auth/admin-user.decorator';
import { AdminGuard, type AdminPrincipal } from '../auth/admin.guard';
import { AuditLogsService } from './audit-logs.service';
import { ListAuditLogsDto } from './dto/list-audit-logs.dto';

@Controller('audit-logs')
@UseGuards(AdminGuard)
export class AuditLogsController {
  constructor(private readonly service: AuditLogsService) {}
  @Get()
  async list(
    @Query() query: ListAuditLogsDto,
    @AdminUser() user: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Audit logs retrieved.',
      data: await this.service.list(query, user),
    };
  }
}
