import { BadRequestException, Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/authenticated.guard';
import { ListMembersDto } from './dto/list-members.dto';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto';
import { MembersRepository } from './members.repository';

@Injectable()
export class MembersService {
  constructor(private readonly repository: MembersRepository) {}

  list(query: ListMembersDto, churchId: string) {
    return this.repository.list(query, churchId);
  }

  findById(memberId: string, churchId: string) {
    return this.repository.findById(memberId, churchId);
  }

  updateOwnProfile(
    user: AuthenticatedPrincipal,
    updates: UpdateOwnProfileDto,
  ) {
    if (Object.values(updates).every((value) => value === undefined)) {
      throw new BadRequestException('Provide at least one profile field.');
    }
    return this.repository.updateOwnProfile({
      userId: user.id,
      churchId: user.churchId,
      updates,
    });
  }
}
