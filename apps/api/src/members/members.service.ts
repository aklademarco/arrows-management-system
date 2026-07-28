import { BadRequestException, Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/authenticated.guard';
import { ListMembersDto } from './dto/list-members.dto';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
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

  updateOwnProfile(user: AuthenticatedPrincipal, updates: UpdateOwnProfileDto) {
    if (Object.values(updates).every((value) => value === undefined)) {
      throw new BadRequestException('Provide at least one profile field.');
    }
    return this.repository.updateOwnProfile({
      userId: user.id,
      churchId: user.churchId,
      updates,
    });
  }

  updateMember(input: {
    memberId: string;
    actorUserId: string;
    churchId: string;
    updates: UpdateMemberDto;
  }) {
    if (Object.values(input.updates).every((value) => value === undefined)) {
      throw new BadRequestException('Provide at least one member field.');
    }
    return this.repository.updateMember(input);
  }

  archiveMember(input: {
    memberId: string;
    actorUserId: string;
    churchId: string;
  }) {
    return this.repository.archiveMember(input);
  }

  setPrimaryDepartment(input: {
    memberId: string;
    churchId: string;
    actorUserId: string;
    departmentMembershipId: string | null;
    effectiveOn?: string;
    reason: string;
  }) {
    return this.repository.setPrimaryDepartment(input);
  }
}
