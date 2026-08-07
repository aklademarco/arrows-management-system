import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/authenticated-user.decorator';
import {
  AuthenticatedGuard,
  type AuthenticatedPrincipal,
} from '../auth/authenticated.guard';
import { CreatePublicityFlyerDto } from './dto/create-publicity-flyer.dto';
import { MinistryContentService } from './ministry-content.service';

@Controller('ministry-content')
@UseGuards(AuthenticatedGuard)
export class MinistryContentController {
  constructor(private readonly service: MinistryContentService) {}

  @Get()
  async overview(@AuthenticatedUser() user: AuthenticatedPrincipal) {
    return {
      success: true,
      message: 'Ministry content retrieved.',
      data: await this.service.overview(user),
    };
  }

  @Post('publicity-flyers')
  async createFlyer(
    @Body() body: CreatePublicityFlyerDto,
    @AuthenticatedUser() user: AuthenticatedPrincipal,
  ) {
    return {
      success: true,
      message: 'Flyer sent to the Media team.',
      data: await this.service.createFlyer(body, user),
    };
  }
}
