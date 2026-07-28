import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminUser } from '../auth/admin-user.decorator';
import { AdminGuard, type AdminPrincipal } from '../auth/admin.guard';
import {
  AuthenticatedGuard,
  type AuthenticatedPrincipal,
} from '../auth/authenticated.guard';
import { AuthenticatedUser } from '../auth/authenticated-user.decorator';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { AddDepartmentMemberDto } from './dto/add-department-member.dto';
import { EndDepartmentMembershipDto } from './dto/end-department-membership.dto';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly service: DepartmentsService) {}

  @Get()
  @UseGuards(AuthenticatedGuard)
  async list(@AuthenticatedUser() user: AuthenticatedPrincipal) {
    return {
      success: true,
      message: 'Departments retrieved.',
      data: await this.service.list(user.churchId),
    };
  }

  @Post()
  @UseGuards(AdminGuard)
  async create(
    @Body() body: CreateDepartmentDto,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Department created.',
      data: await this.service.create({
        churchId: admin.churchId,
        actorUserId: admin.id,
        ...body,
      }),
    };
  }

  @Patch(':departmentId')
  @UseGuards(AdminGuard)
  async update(
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
    @Body() body: UpdateDepartmentDto,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Department updated.',
      data: await this.service.update({
        departmentId,
        churchId: admin.churchId,
        actorUserId: admin.id,
        updates: body,
      }),
    };
  }

  @Post(':departmentId/deactivate')
  @UseGuards(AdminGuard)
  async deactivate(
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
    @AdminUser() admin: AdminPrincipal,
  ) {
    await this.service.deactivate({
      departmentId,
      churchId: admin.churchId,
      actorUserId: admin.id,
    });
    return {
      success: true,
      message: 'Department deactivated.',
      data: null,
    };
  }

  @Post(':departmentId/members')
  @UseGuards(AdminGuard)
  async addMember(
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
    @Body() body: AddDepartmentMemberDto,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Member added to department.',
      data: await this.service.addMember({
        departmentId,
        churchId: admin.churchId,
        actorUserId: admin.id,
        ...body,
      }),
    };
  }

  @Post(':departmentId/memberships/:membershipId/end')
  @UseGuards(AdminGuard)
  async endMembership(
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Body() body: EndDepartmentMembershipDto,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Department membership ended.',
      data: await this.service.endMembership({
        departmentId,
        membershipId,
        churchId: admin.churchId,
        actorUserId: admin.id,
        ...body,
      }),
    };
  }
}
