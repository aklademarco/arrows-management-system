import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/authenticated-user.decorator';
import {
  AuthenticatedGuard,
  type AuthenticatedPrincipal,
} from '../auth/authenticated.guard';
import { CreateLeadershipMessageDto } from './dto/create-leadership-message.dto';
import { ListDirectoryDto } from '../members/dto/list-directory.dto';
import { LeadershipMessagesService } from './leadership-messages.service';

@Controller('leadership-messages')
@UseGuards(AuthenticatedGuard)
export class LeadershipMessagesController {
  constructor(private readonly service: LeadershipMessagesService) {}

  @Get('compose-context')
  async composeContext(@AuthenticatedUser() user: AuthenticatedPrincipal) {
    return {
      success: true,
      message: 'Message permissions retrieved.',
      data: await this.service.composeContext(user),
    };
  }

  @Get('team')
  async team(
    @Query() query: ListDirectoryDto,
    @AuthenticatedUser() user: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Your team retrieved.',
      data: await this.service.team(query, user),
    };
  }

  @Get('sent')
  async sent(@AuthenticatedUser() user: AuthenticatedPrincipal) {
    return {
      success: true,
      message: 'Sent messages retrieved.',
      data: await this.service.sent(user),
    };
  }

  @Post()
  async create(
    @Body() body: CreateLeadershipMessageDto,
    @AuthenticatedUser() user: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Message sent.',
      data: await this.service.create(body, user),
    };
  }
}
