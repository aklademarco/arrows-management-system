import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/authenticated-user.decorator';
import {
  AuthenticatedGuard,
  type AuthenticatedPrincipal,
} from '../auth/authenticated.guard';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
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
}
