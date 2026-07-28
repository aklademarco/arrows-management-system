import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  AuthenticatedGuard,
  type AuthenticatedPrincipal,
} from '../auth/authenticated.guard';
import { AuthenticatedUser } from '../auth/authenticated-user.decorator';
import { DepartmentsService } from './departments.service';

@Controller('departments')
@UseGuards(AuthenticatedGuard)
export class DepartmentsController {
  constructor(private readonly service: DepartmentsService) {}

  @Get()
  async list(@AuthenticatedUser() user: AuthenticatedPrincipal) {
    return {
      success: true,
      message: 'Departments retrieved.',
      data: await this.service.list(user.churchId),
    };
  }
}
