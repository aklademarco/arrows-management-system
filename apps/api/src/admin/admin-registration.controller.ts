import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminUser } from '../auth/admin-user.decorator';
import { AdminGuard, type AdminPrincipal } from '../auth/admin.guard';
import { AdminRegistrationService } from './admin-registration.service';
import {
  ApproveRegistrationDto,
  RejectRegistrationDto,
} from './dto/review-registration.dto';

@Controller('admin/registrations')
@UseGuards(AdminGuard)
export class AdminRegistrationController {
  constructor(private readonly service: AdminRegistrationService) {}

  @Get()
  async listPending() {
    return {
      success: true,
      message: 'Pending registrations retrieved.',
      data: await this.service.listPending(),
    };
  }

  @Post(':userId/approve')
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: ApproveRegistrationDto,
    @AdminUser() admin: AdminPrincipal,
    @Ip() requestedIp: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    await this.service.approve({
      userId,
      reviewerId: admin.id,
      note: body.note,
      requestedIp,
      userAgent,
    });
    return {
      success: true,
      message: 'Registration approved.',
      data: null,
    };
  }

  @Post(':userId/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: RejectRegistrationDto,
    @AdminUser() admin: AdminPrincipal,
    @Ip() requestedIp: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    await this.service.reject({
      userId,
      reviewerId: admin.id,
      reason: body.reason,
      requestedIp,
      userAgent,
    });
    return {
      success: true,
      message: 'Registration rejected.',
      data: null,
    };
  }
}
