import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminUser } from '../auth/admin-user.decorator';
import { AdminGuard, type AdminPrincipal } from '../auth/admin.guard';
import { LiturgiesService } from './liturgies.service';

@Controller('liturgies')
@UseGuards(AdminGuard)
export class LiturgiesController {
  constructor(private readonly service: LiturgiesService) {}

  @Get('templates')
  async templates(@AdminUser() admin: AdminPrincipal) {
    return {
      success: true,
      message: 'Liturgy templates retrieved.',
      data: await this.service.templates(admin),
    };
  }
}
