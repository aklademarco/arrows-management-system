import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
import { UpdateMemberDto } from './dto/update-member.dto';
import { SetPrimaryDepartmentDto } from './dto/set-primary-department.dto';

@Controller('members')
export class MembersController {
  constructor(private readonly service: MembersService) {}

  @Get('me')
  @UseGuards(AuthenticatedGuard)
  async findOwnProfile(@AuthenticatedUser() user: AuthenticatedPrincipal) {
    return {
      success: true,
      message: 'Member profile retrieved.',
      data: await this.service.findOwnProfile(user),
    };
  }

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

  @Patch(':memberId')
  @UseGuards(AdminGuard)
  async updateMember(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() body: UpdateMemberDto,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Member updated.',
      data: await this.service.updateMember({
        memberId,
        actorUserId: admin.id,
        churchId: admin.churchId,
        updates: body,
      }),
    };
  }

  @Post(':memberId/archive')
  @UseGuards(AdminGuard)
  async archiveMember(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @AdminUser() admin: AdminPrincipal,
  ) {
    await this.service.archiveMember({
      memberId,
      actorUserId: admin.id,
      churchId: admin.churchId,
    });
    return {
      success: true,
      message: 'Member archived.',
      data: null,
    };
  }

  @Put(':memberId/primary-department')
  @UseGuards(AdminGuard)
  async setPrimaryDepartment(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() body: SetPrimaryDepartmentDto,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Primary department updated.',
      data: await this.service.setPrimaryDepartment({
        memberId,
        churchId: admin.churchId,
        actorUserId: admin.id,
        ...body,
      }),
    };
  }
}
