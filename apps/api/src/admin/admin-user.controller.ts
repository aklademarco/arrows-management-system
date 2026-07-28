import {
  Body,
  Controller,
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
import { AdminUserService } from './admin-user.service';
import { SuspendUserDto } from './dto/account-lifecycle.dto';

@Controller('admin/users')
@UseGuards(AdminGuard)
export class AdminUserController {
  constructor(private readonly service: AdminUserService) {}

  @Post(':userId/suspend')
  @HttpCode(HttpStatus.OK)
  async suspend(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: SuspendUserDto,
    @AdminUser() admin: AdminPrincipal,
    @Ip() requestedIp: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    await this.service.suspend({
      userId,
      actorUserId: admin.id,
      churchId: admin.churchId,
      reason: body.reason,
      requestedIp,
      userAgent,
    });
    return {
      success: true,
      message: 'User suspended.',
      data: null,
    };
  }

  @Post(':userId/reactivate')
  @HttpCode(HttpStatus.OK)
  async reactivate(
    @Param('userId', ParseUUIDPipe) userId: string,
    @AdminUser() admin: AdminPrincipal,
    @Ip() requestedIp: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    await this.service.reactivate({
      userId,
      actorUserId: admin.id,
      churchId: admin.churchId,
      requestedIp,
      userAgent,
    });
    return {
      success: true,
      message: 'User reactivated.',
      data: null,
    };
  }
}
