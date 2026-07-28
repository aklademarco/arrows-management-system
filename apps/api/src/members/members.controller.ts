import {
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminUser } from '../auth/admin-user.decorator';
import { AdminGuard, type AdminPrincipal } from '../auth/admin.guard';
import { ListMembersDto } from './dto/list-members.dto';
import { MembersService } from './members.service';
import {
  AuthenticatedGuard,
  type AuthenticatedPrincipal,
} from '../auth/authenticated.guard';
import { AuthenticatedUser } from '../auth/authenticated-user.decorator';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto';

@Controller('members')
export class MembersController {
  constructor(private readonly service: MembersService) {}

  @Patch('me')
  @UseGuards(AuthenticatedGuard)
  async updateOwnProfile(
    @Body() body: UpdateOwnProfileDto,
    @AuthenticatedUser() user: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Profile updated.',
      data: await this.service.updateOwnProfile(user, body),
    };
  }

  @Get()
  @UseGuards(AdminGuard)
  async list(
    @Query() query: ListMembersDto,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Members retrieved.',
      data: await this.service.list(query, admin.churchId),
    };
  }

  @Get(':memberId')
  @UseGuards(AdminGuard)
  async findById(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Member retrieved.',
      data: await this.service.findById(memberId, admin.churchId),
    };
  }
}
