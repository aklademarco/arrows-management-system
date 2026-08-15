import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/authenticated-user.decorator';
import {
  AuthenticatedGuard,
  type AuthenticatedPrincipal,
} from '../auth/authenticated.guard';
import { ControlLiturgyItemDto } from './dto/control-liturgy-item.dto';
import { LiturgiesService } from './liturgies.service';

@Controller('live-liturgies')
@UseGuards(AuthenticatedGuard)
export class LiveLiturgiesController {
  constructor(private readonly service: LiturgiesService) {}

  @Get('events/:eventId')
  async event(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @AuthenticatedUser() user: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Live liturgy retrieved.',
      data: await this.service.liveEvent(eventId, user),
    };
  }

  @Patch('items/:itemId')
  async control(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() body: ControlLiturgyItemDto,
    @AuthenticatedUser() user: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Live liturgy updated.',
      data: await this.service.control(itemId, body, user),
    };
  }
}
