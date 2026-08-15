import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/authenticated-user.decorator';
import {
  AuthenticatedGuard,
  type AuthenticatedPrincipal,
} from '../auth/authenticated.guard';
import { CreateLeadershipMessageDto } from './dto/create-leadership-message.dto';
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
