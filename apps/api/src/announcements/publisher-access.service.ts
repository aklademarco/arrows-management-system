import { Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/authenticated.guard';
import { MembersRepository } from '../members/members.repository';

/** Roles that may moderate the feed and manage anyone's posts. */
const MODERATOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'PASTOR'];

export type PublisherAccess = {
  /** May create posts. */
  canPublish: boolean;
  /** May edit/archive any post, pin, close comments, and hide comments. */
  canModerate: boolean;
};

/**
 * Who may publish and moderate. Department leaders publish only while they
 * hold a current, active leadership assignment; the role alone is not enough.
 */
@Injectable()
export class PublisherAccessService {
  constructor(private readonly members: MembersRepository) {}

  async resolve(viewer: AuthenticatedPrincipal): Promise<PublisherAccess> {
    if (viewer.roles.some((role) => MODERATOR_ROLES.includes(role))) {
      return { canPublish: true, canModerate: true };
    }
    if (!viewer.roles.includes('DEPARTMENT_LEADER')) {
      return { canPublish: false, canModerate: false };
    }
    const ledDepartmentIds = await this.members.findLedDepartmentIds(
      viewer.id,
      viewer.churchId,
    );
    return { canPublish: ledDepartmentIds.length > 0, canModerate: false };
  }

  /** Moderators manage every post; publishers manage their own. */
  canManage(
    item: { createdBy: string },
    viewer: AuthenticatedPrincipal,
    access: PublisherAccess,
  ) {
    return (
      access.canModerate || (access.canPublish && item.createdBy === viewer.id)
    );
  }
}
