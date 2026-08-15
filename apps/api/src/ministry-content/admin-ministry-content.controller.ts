import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminUser } from '../auth/admin-user.decorator';
import { AdminGuard, type AdminPrincipal } from '../auth/admin.guard';
import { MinistryContentService } from './ministry-content.service';

@Controller('admin/ministry-content')
@UseGuards(AdminGuard)
export class AdminMinistryContentController {
  constructor(private readonly service: MinistryContentService) {}

  @Get()
  async list(@AdminUser() admin: AdminPrincipal) {
    return {
      success: true,
      message: 'Ministry workflow retrieved.',
      data: await this.service.adminOverview(admin),
    };
  }
}
