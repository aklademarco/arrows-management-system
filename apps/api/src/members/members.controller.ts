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
import { ListDirectoryDto } from './dto/list-directory.dto';
import { MembersService } from './members.service';
import {
  AuthenticatedGuard,
  type AuthenticatedPrincipal,
} from '../auth/authenticated.guard';
import { AuthenticatedUser } from '../auth/authenticated-user.decorator';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { SetPrimaryDepartmentDto } from './dto/set-primary-department.dto';
import { UpdateCoverPhotoDto } from './dto/update-cover-photo.dto';
import { UpdateProfilePhotoDto } from './dto/update-profile-photo.dto';

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

  @Patch('me/cover-photo')
  @UseGuards(AuthenticatedGuard)
  async updateCoverPhoto(
    @Body() body: UpdateCoverPhotoDto,
    @AuthenticatedUser() user: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: body.coverPhotoUrl
        ? 'Cover photo updated.'
        : 'Cover photo removed.',
      data: await this.service.updateCoverPhoto(user, body.coverPhotoUrl),
    };
  }

  @Patch('me/profile-photo')
  @UseGuards(AuthenticatedGuard)
  async updateProfilePhoto(
    @Body() body: UpdateProfilePhotoDto,
    @AuthenticatedUser() user: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: body.profilePhotoUrl
        ? 'Profile photo updated.'
        : 'Profile photo removed.',
      data: await this.service.updateProfilePhoto(user, body.profilePhotoUrl),
    };
  }

  @Get()
  @UseGuards(AuthenticatedGuard)
  async list(
    @Query() query: ListMembersDto,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Members retrieved.',
      data: await this.service.list(query, viewer),
    };
  }

  @Get('directory')
  @UseGuards(AuthenticatedGuard)
  async directory(
    @Query() query: ListDirectoryDto,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Church directory retrieved.',
      data: await this.service.directory(query, viewer),
    };
  }

  @Get('directory/:memberId')
  @UseGuards(AuthenticatedGuard)
  async directoryProfile(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Directory profile retrieved.',
      data: await this.service.directoryProfile(memberId, viewer),
    };
  }

  @Post('directory/:memberId/hello')
  @UseGuards(AuthenticatedGuard)
  async greetDirectoryMember(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Your hello was sent.',
      data: await this.service.greetDirectoryMember(memberId, viewer),
    };
  }

  @Get(':memberId')
  @UseGuards(AuthenticatedGuard)
  async findById(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @AuthenticatedUser() viewer: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Member retrieved.',
      data: await this.service.findById(memberId, viewer),
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
