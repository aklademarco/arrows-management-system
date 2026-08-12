import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/authenticated.guard';
import type { CreatePublicityFlyerDto } from './dto/create-publicity-flyer.dto';
import type { CreateSongListDto } from './dto/create-song-list.dto';
import { MinistryContentRepository } from './ministry-content.repository';

@Injectable()
export class MinistryContentService {
  constructor(private readonly repository: MinistryContentRepository) {}

  async overview(user: AuthenticatedPrincipal) {
    const [access, items] = await Promise.all([
      this.repository.getAccess(user.id, user.churchId),
      this.repository.list(user.id, user.churchId),
    ]);
    return { ...access, items };
  }

  async createFlyer(
    body: CreatePublicityFlyerDto,
    user: AuthenticatedPrincipal,
  ) {
    const access = await this.repository.getAccess(user.id, user.churchId);
    if (!access.canSubmitFlyer)
      throw new ForbiddenException(
        'Only an active Publicity department leader can send flyers.',
      );
    if (!access.mediaDepartment)
      throw new BadRequestException(
        'Create an active Media department before sending a flyer.',
      );
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (
      !cloudName ||
      !body.cloudinaryUrl.startsWith(`https://res.cloudinary.com/${cloudName}/`)
    )
      throw new BadRequestException(
        'The flyer must use the configured Cloudinary account.',
      );
    return this.repository.createFlyer({
      ...body,
      churchId: user.churchId,
      senderUserId: user.id,
      targetDepartmentId: access.mediaDepartment.id,
    });
  }

  async createSongList(body: CreateSongListDto, user: AuthenticatedPrincipal) {
    const access = await this.repository.getAccess(user.id, user.churchId);
    if (!access.canSubmitSongList)
      throw new ForbiddenException(
        'Only an active Choir department leader can publish song lists.',
      );
    if (!access.choirDepartment || !access.mediaDepartment)
      throw new BadRequestException(
        'Active Choir and Media departments are required before publishing a song list.',
      );
    return this.repository.createSongList({
      ...body,
      churchId: user.churchId,
      senderUserId: user.id,
      choirDepartmentId: access.choirDepartment.id,
      mediaDepartmentId: access.mediaDepartment.id,
    });
  }
}
