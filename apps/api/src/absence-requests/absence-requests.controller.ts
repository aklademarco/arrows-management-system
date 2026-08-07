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
import { AuthenticatedUser } from '../auth/authenticated-user.decorator';
import {
  AuthenticatedGuard,
  type AuthenticatedPrincipal,
} from '../auth/authenticated.guard';
import { AbsenceRequestsService } from './absence-requests.service';
import { CreateAbsenceRequestDto } from './dto/create-absence-request.dto';
import { ReviewAbsenceRequestDto } from './dto/review-absence-request.dto';

@Controller('absence-requests')
@UseGuards(AuthenticatedGuard)
export class AbsenceRequestsController {
  constructor(private readonly service: AbsenceRequestsService) {}

  @Post()
  async submit(
    @Body() body: CreateAbsenceRequestDto,
    @AuthenticatedUser() user: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Absence request submitted.',
      data: await this.service.submit(user, body),
    };
  }

  @Get('me')
  async listOwn(@AuthenticatedUser() user: AuthenticatedPrincipal) {
    return {
      success: true,
      message: 'Absence requests retrieved.',
      data: await this.service.listOwn(user),
    };
  }

  @Get('reviewable')
  async listReviewable(@AuthenticatedUser() user: AuthenticatedPrincipal) {
    return {
      success: true,
      message: 'Reviewable absence requests retrieved.',
      data: await this.service.listReviewable(user),
    };
  }

  @Post(':requestId/cancel')
  async cancel(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @AuthenticatedUser() user: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Absence request cancelled.',
      data: await this.service.cancel(requestId, user),
    };
  }

  @Patch(':requestId/review')
  async review(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() body: ReviewAbsenceRequestDto,
    @AuthenticatedUser() user: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Absence request reviewed.',
      data: await this.service.review(requestId, user, body),
    };
  }
}
