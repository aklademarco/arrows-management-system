import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminUser } from '../auth/admin-user.decorator';
import { AdminGuard, type AdminPrincipal } from '../auth/admin.guard';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { PastoralCareService } from './pastoral-care.service';

@Controller('pastoral-care')
@UseGuards(AdminGuard)
export class PastoralCareController {
  constructor(private readonly service: PastoralCareService) {}

  @Get('queue')
  async queue(@AdminUser() user: AdminPrincipal) {
    return {
      success: true,
      message: 'Pastoral care queue retrieved.',
      data: await this.service.queue(user),
    };
  }

  @Post('members/:memberId/follow-ups')
  async record(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() input: CreateFollowUpDto,
    @AdminUser() user: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Follow-up recorded.',
      data: await this.service.record(memberId, input, user),
    };
  }
}
