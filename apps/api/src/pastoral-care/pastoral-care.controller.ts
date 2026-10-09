import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthenticatedUser } from '../auth/authenticated-user.decorator';
import {
  AuthenticatedGuard,
  type AuthenticatedPrincipal,
} from '../auth/authenticated.guard';
import { RATE_LIMITS } from '../common/security/rate-limits';
import { CreateCareRequestDto } from './dto/create-care-request.dto';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { UpdateCareRequestStatusDto } from './dto/update-care-request-status.dto';
import { PastoralCareService } from './pastoral-care.service';

@Controller('pastoral-care')
@UseGuards(AuthenticatedGuard)
export class PastoralCareController {
  constructor(private readonly service: PastoralCareService) {}

  @Post('requests')
  @Throttle({ default: RATE_LIMITS.pastoralCareRequest })
  async submitRequest(
    @Body() body: CreateCareRequestDto,
    @AuthenticatedUser() user: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Your private message has been sent to the pastoral team.',
      data: await this.service.submitRequest(body, user),
    };
  }

  @Get('requests/me')
  async listOwnRequests(@AuthenticatedUser() user: AuthenticatedPrincipal) {
    return {
      success: true,
      message: 'Your pastoral care requests were retrieved.',
      data: await this.service.listOwnRequests(user),
    };
  }

  @Get('requests/inbox')
  async requestInbox(@AuthenticatedUser() user: AuthenticatedPrincipal) {
    return {
      success: true,
      message: 'Pastoral inbox retrieved.',
      data: await this.service.listRequestInbox(user),
    };
  }

  @Patch('requests/:requestId/status')
  async updateRequestStatus(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() body: UpdateCareRequestStatusDto,
    @AuthenticatedUser() user: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Pastoral care request updated.',
      data: await this.service.updateRequestStatus(requestId, body, user),
    };
  }

  @Get('queue')
  async queue(@AuthenticatedUser() user: AuthenticatedPrincipal) {
    return {
      success: true,
      message: 'Pastoral care queue retrieved.',
      data: await this.service.queue(user),
    };
  }

  @Post('members/:memberId/follow-ups')
  async record(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() input: CreateFollowUpDto,
    @AuthenticatedUser() user: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Follow-up recorded.',
      data: await this.service.record(memberId, input, user),
    };
  }
}
