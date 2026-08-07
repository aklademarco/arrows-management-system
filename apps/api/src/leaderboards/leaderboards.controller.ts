import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminUser } from '../auth/admin-user.decorator';
import { AdminGuard, type AdminPrincipal } from '../auth/admin.guard';
import { AuthenticatedUser } from '../auth/authenticated-user.decorator';
import {
  AuthenticatedGuard,
  type AuthenticatedPrincipal,
} from '../auth/authenticated.guard';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
import { CreatePointsAdjustmentDto } from './dto/create-points-adjustment.dto';
import { LeaderboardsService } from './leaderboards.service';

@Controller('leaderboards')
@UseGuards(AuthenticatedGuard)
export class LeaderboardsController {
  constructor(private readonly service: LeaderboardsService) {}
  @Get('individual')
  async individual(
    @Query() query: LeaderboardQueryDto,
    @AuthenticatedUser() user: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Individual leaderboard retrieved.',
      data: await this.service.individual(query, user),
    };
  }

  @Get('departments')
  async departments(
    @Query() query: LeaderboardQueryDto,
    @AuthenticatedUser() user: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Department leaderboard retrieved.',
      data: await this.service.departments(query, user),
    };
  }

  @Post('members/:memberId/adjustments')
  @UseGuards(AdminGuard)
  async adjustMemberPoints(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() body: CreatePointsAdjustmentDto,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Point adjustment recorded.',
      data: await this.service.adjustMemberPoints(memberId, body, admin),
    };
  }

  @Get('members/:memberId/adjustments')
  @UseGuards(AdminGuard)
  async memberAdjustments(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @AdminUser() admin: AdminPrincipal,
  ) {
    return {
      success: true,
      message: 'Point adjustments retrieved.',
      data: await this.service.memberAdjustments(memberId, admin),
    };
  }
}
