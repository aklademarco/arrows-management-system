import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/authenticated.guard';
import { ListMembersDto } from './dto/list-members.dto';
import { ListDirectoryDto } from './dto/list-directory.dto';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MembersRepository } from './members.repository';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

@Injectable()
export class MembersService {
  constructor(private readonly repository: MembersRepository) {}

  async list(query: ListMembersDto, viewer: AuthenticatedPrincipal) {
    const restrictToDepartmentIds = await this.resolveReadScope(viewer);
    return this.repository.list(
      query,
      viewer.churchId,
      restrictToDepartmentIds,
    );
  }

  directory(query: ListDirectoryDto, viewer: AuthenticatedPrincipal) {
    return this.repository.directory(query, viewer.churchId);
  }

  directoryProfile(memberId: string, viewer: AuthenticatedPrincipal) {
    return this.repository.directoryProfile(memberId, viewer.churchId);
  }

  async findById(memberId: string, viewer: AuthenticatedPrincipal) {
    const restrictToDepartmentIds = await this.resolveReadScope(viewer);
    return this.repository.findById(
      memberId,
      viewer.churchId,
      restrictToDepartmentIds,
    );
  }

  /**
   * Resolves the department directory a viewer may read. Administrators see the
   * whole church (undefined); a department leader is limited to the departments
   * they currently lead. Anyone else is denied.
   */
  private async resolveReadScope(
    viewer: AuthenticatedPrincipal,
  ): Promise<string[] | undefined> {
    if (viewer.roles.some((role) => ADMIN_ROLES.includes(role))) {
      return undefined;
    }
    const ledDepartmentIds = await this.repository.findLedDepartmentIds(
      viewer.id,
      viewer.churchId,
    );
    if (ledDepartmentIds.length === 0) {
      throw new ForbiddenException(
        'You do not have access to the member directory.',
      );
    }
    return ledDepartmentIds;
  }

  findOwnProfile(user: AuthenticatedPrincipal) {
    return this.repository.findOwnProfile(user.id, user.churchId);
  }

  updateOwnProfile(user: AuthenticatedPrincipal, updates: UpdateOwnProfileDto) {
    if (Object.values(updates).every((value) => value === undefined)) {
      throw new BadRequestException('Provide at least one profile field.');
    }
    const normalizedUpdates = {
      ...updates,
      ...(updates.skills
        ? {
            skills: [
              ...new Set(
                updates.skills.map((skill) => skill.trim()).filter(Boolean),
              ),
            ],
          }
        : {}),
    };
    return this.repository.updateOwnProfile({
      userId: user.id,
      churchId: user.churchId,
      updates: normalizedUpdates,
    });
  }

  updateProfilePhoto(
    user: AuthenticatedPrincipal,
    profilePhotoUrl: string | null,
  ) {
    this.validateCloudinaryUrl(profilePhotoUrl);
    return this.repository.updateProfilePhoto({
      userId: user.id,
      churchId: user.churchId,
      profilePhotoUrl,
    });
  }

  private validateCloudinaryUrl(value: string | null) {
    if (!value) return;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (
      !cloudName ||
      !value.startsWith(`https://res.cloudinary.com/${cloudName}/image/upload/`)
    )
      throw new BadRequestException(
        'Photo must be uploaded through the configured Cloudinary account.',
      );
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

  updateMinistryRoles(input: {
    memberId: string;
    churchId: string;
    actorUserId: string;
    roles: Array<'PASTOR' | 'DEPARTMENT_LEADER'>;
  }) {
    return this.repository.updateMinistryRoles(input);
  }
}
