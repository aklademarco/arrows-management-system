import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module';
import {
  departmentLeaders,
  departmentMembers,
  departments,
  memberProfiles,
  ministryAttachments,
  ministryContent,
  ministrySongItems,
  notifications,
  users,
  auditLogs,
} from '../database/schema';
import type { CreatePublicityFlyerDto } from './dto/create-publicity-flyer.dto';
import type { CreateSongListDto } from './dto/create-song-list.dto';

@Injectable()
export class MinistryContentRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  private activeMembership(today: string) {
    return and(
      lte(departmentMembers.joinedAt, today),
      or(isNull(departmentMembers.leftAt), gt(departmentMembers.leftAt, today)),
    );
  }

  async getAccess(userId: string, churchId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const [
      publicityLeadership,
      choirLeadership,
      mediaMembership,
      [mediaDepartment],
      [choirDepartment],
    ] = await Promise.all([
      this.database
        .select({ id: departmentLeaders.id })
        .from(departmentLeaders)
        .innerJoin(
          memberProfiles,
          eq(memberProfiles.id, departmentLeaders.memberId),
        )
        .innerJoin(
          departments,
          eq(departments.id, departmentLeaders.departmentId),
        )
        .where(
          and(
            eq(memberProfiles.userId, userId),
            eq(departments.churchId, churchId),
            sql`lower(${departments.name}) like '%publicity%'`,
            isNull(departmentLeaders.revokedAt),
            lte(departmentLeaders.startsAt, today),
            or(
              isNull(departmentLeaders.endsAt),
              sql`${departmentLeaders.endsAt} >= ${today}`,
            ),
          ),
        )
        .limit(1),
      this.database
        .select({ id: departmentLeaders.id })
        .from(departmentLeaders)
        .innerJoin(
          memberProfiles,
          eq(memberProfiles.id, departmentLeaders.memberId),
        )
        .innerJoin(
          departments,
          eq(departments.id, departmentLeaders.departmentId),
        )
        .where(
          and(
            eq(memberProfiles.userId, userId),
            eq(departments.churchId, churchId),
            sql`(lower(${departments.name}) like '%choir%' or lower(${departments.name}) like '%music%')`,
            isNull(departmentLeaders.revokedAt),
            lte(departmentLeaders.startsAt, today),
            or(
              isNull(departmentLeaders.endsAt),
              sql`${departmentLeaders.endsAt} >= ${today}`,
            ),
          ),
        )
        .limit(1),
      this.database
        .select({ id: departmentMembers.id })
        .from(departmentMembers)
        .innerJoin(
          memberProfiles,
          eq(memberProfiles.id, departmentMembers.memberId),
        )
        .innerJoin(
          departments,
          eq(departments.id, departmentMembers.departmentId),
        )
        .where(
          and(
            eq(memberProfiles.userId, userId),
            eq(departments.churchId, churchId),
            eq(departments.isActive, true),
            sql`lower(${departments.name}) like '%media%'`,
            this.activeMembership(today),
          ),
        )
        .limit(1),
      this.database
        .select({ id: departments.id, name: departments.name })
        .from(departments)
        .where(
          and(
            eq(departments.churchId, churchId),
            eq(departments.isActive, true),
            sql`lower(${departments.name}) like '%media%'`,
          ),
        )
        .limit(1),
      this.database
        .select({ id: departments.id, name: departments.name })
        .from(departments)
        .where(
          and(
            eq(departments.churchId, churchId),
            eq(departments.isActive, true),
            sql`(lower(${departments.name}) like '%choir%' or lower(${departments.name}) like '%music%')`,
          ),
        )
        .limit(1),
    ]);
    return {
      canSubmitFlyer: publicityLeadership.length > 0,
      canSubmitSongList: choirLeadership.length > 0,
      canManageMediaWork: mediaMembership.length > 0,
      mediaDepartment,
      choirDepartment,
    };
  }

  async createSongList(
    input: CreateSongListDto & {
      churchId: string;
      senderUserId: string;
      choirDepartmentId: string;
      mediaDepartmentId: string;
    },
  ) {
    const today = new Date().toISOString().slice(0, 10);
    return this.database.transaction(async (transaction) => {
      const [content] = await transaction
        .insert(ministryContent)
        .values({
          churchId: input.churchId,
          senderUserId: input.senderUserId,
          eventId: input.eventId,
          targetDepartmentId: input.mediaDepartmentId,
          type: 'SONG_LIST',
          status: 'SENT',
          title: input.title,
          instructions: input.instructions,
          sentAt: new Date(),
        })
        .returning();
      const songs = await transaction
        .insert(ministrySongItems)
        .values(
          input.songs.map((song, index) => ({
            contentId: content.id,
            position: index + 1,
            title: song.title,
            lyrics: song.lyrics,
            musicalKey: song.musicalKey,
            notes: song.notes,
          })),
        )
        .returning();
      const recipients = await transaction
        .selectDistinct({ userId: memberProfiles.userId })
        .from(departmentMembers)
        .innerJoin(
          memberProfiles,
          eq(memberProfiles.id, departmentMembers.memberId),
        )
        .innerJoin(users, eq(users.id, memberProfiles.userId))
        .where(
          and(
            inArray(departmentMembers.departmentId, [
              input.choirDepartmentId,
              input.mediaDepartmentId,
            ]),
            this.activeMembership(today),
            eq(users.accountStatus, 'ACTIVE'),
          ),
        );
      if (recipients.length)
        await transaction.insert(notifications).values(
          recipients.map(({ userId }) => ({
            churchId: input.churchId,
            recipientUserId: userId,
            actorUserId: input.senderUserId,
            type: 'SONG_LIST',
            title: `New song list: ${input.title}`,
            body:
              input.instructions ||
              `${songs.length} songs are ready for the service.`,
            link: '/member/media-hub',
            ministryContentId: content.id,
          })),
        );
      return { ...content, songs, recipientCount: recipients.length };
    });
  }

  async createFlyer(
    input: CreatePublicityFlyerDto & {
      churchId: string;
      senderUserId: string;
      targetDepartmentId: string;
    },
  ) {
    const today = new Date().toISOString().slice(0, 10);
    return this.database.transaction(async (transaction) => {
      const [content] = await transaction
        .insert(ministryContent)
        .values({
          churchId: input.churchId,
          senderUserId: input.senderUserId,
          eventId: input.eventId,
          targetDepartmentId: input.targetDepartmentId,
          type: 'PUBLICITY_FLYER',
          status: 'SENT',
          title: input.title,
          instructions: input.instructions,
          deadlineAt: input.deadlineAt ? new Date(input.deadlineAt) : undefined,
          sentAt: new Date(),
        })
        .returning();
      const [attachment] = await transaction
        .insert(ministryAttachments)
        .values({
          contentId: content.id,
          cloudinaryUrl: input.cloudinaryUrl,
          cloudinaryPublicId: input.cloudinaryPublicId,
          fileName: input.fileName,
          mimeType: input.mimeType,
        })
        .returning();
      const recipients = await transaction
        .selectDistinct({ userId: memberProfiles.userId })
        .from(departmentMembers)
        .innerJoin(
          memberProfiles,
          eq(memberProfiles.id, departmentMembers.memberId),
        )
        .innerJoin(users, eq(users.id, memberProfiles.userId))
        .where(
          and(
            eq(departmentMembers.departmentId, input.targetDepartmentId),
            this.activeMembership(today),
            eq(users.accountStatus, 'ACTIVE'),
          ),
        );
      if (recipients.length > 0)
        await transaction.insert(notifications).values(
          recipients.map(({ userId }) => ({
            churchId: input.churchId,
            recipientUserId: userId,
            actorUserId: input.senderUserId,
            type: 'PUBLICITY_FLYER',
            title: `New flyer: ${input.title}`,
            body:
              input.instructions ||
              'A new announcement flyer is ready for the Media team.',
            link: '/member/media-hub',
            ministryContentId: content.id,
          })),
        );
      return { ...content, attachment, recipientCount: recipients.length };
    });
  }

  async list(userId: string, churchId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const memberships = this.database
      .select({ departmentId: departmentMembers.departmentId })
      .from(departmentMembers)
      .innerJoin(
        memberProfiles,
        eq(memberProfiles.id, departmentMembers.memberId),
      )
      .where(
        and(eq(memberProfiles.userId, userId), this.activeMembership(today)),
      );
    const items = await this.database
      .select({
        id: ministryContent.id,
        title: ministryContent.title,
        instructions: ministryContent.instructions,
        status: ministryContent.status,
        acknowledgedAt: ministryContent.acknowledgedAt,
        completedAt: ministryContent.completedAt,
        deadlineAt: ministryContent.deadlineAt,
        sentAt: ministryContent.sentAt,
        createdAt: ministryContent.createdAt,
        type: ministryContent.type,
        eventId: ministryContent.eventId,
        attachmentUrl: ministryAttachments.cloudinaryUrl,
        fileName: ministryAttachments.fileName,
      })
      .from(ministryContent)
      .leftJoin(
        ministryAttachments,
        eq(ministryAttachments.contentId, ministryContent.id),
      )
      .where(
        and(
          eq(ministryContent.churchId, churchId),
          or(
            eq(ministryContent.senderUserId, userId),
            inArray(ministryContent.targetDepartmentId, memberships),
            and(
              eq(ministryContent.type, 'SONG_LIST'),
              sql`exists (select 1 from ${departments} d where d.id in (${memberships}) and (lower(d.name) like '%choir%' or lower(d.name) like '%music%'))`,
            ),
          ),
        ),
      )
      .orderBy(desc(ministryContent.createdAt));
    const songContentIds = items
      .filter((item) => item.type === 'SONG_LIST')
      .map((item) => item.id);
    const songs = songContentIds.length
      ? await this.database
          .select({
            id: ministrySongItems.id,
            contentId: ministrySongItems.contentId,
            position: ministrySongItems.position,
            title: ministrySongItems.title,
            lyrics: ministrySongItems.lyrics,
            musicalKey: ministrySongItems.musicalKey,
            notes: ministrySongItems.notes,
          })
          .from(ministrySongItems)
          .where(inArray(ministrySongItems.contentId, songContentIds))
          .orderBy(asc(ministrySongItems.position))
      : [];
    return items.map((item) => ({
      ...item,
      songs: songs.filter((song) => song.contentId === item.id),
    }));
  }

  async updateStatus(input: {
    contentId: string;
    churchId: string;
    actorUserId: string;
    action: 'ACKNOWLEDGE' | 'COMPLETE';
  }) {
    return this.database.transaction(async (transaction) => {
      const [content] = await transaction
        .select({
          id: ministryContent.id,
          senderUserId: ministryContent.senderUserId,
          title: ministryContent.title,
          status: ministryContent.status,
        })
        .from(ministryContent)
        .where(
          and(
            eq(ministryContent.id, input.contentId),
            eq(ministryContent.churchId, input.churchId),
          ),
        )
        .limit(1)
        .for('update');
      if (!content)
        throw new NotFoundException('Ministry work item not found.');
      const now = new Date();
      if (input.action === 'ACKNOWLEDGE' && content.status !== 'SENT')
        throw new ConflictException(
          'Only newly sent work can be acknowledged.',
        );
      if (input.action === 'COMPLETE' && content.status !== 'ACKNOWLEDGED')
        throw new ConflictException(
          'Acknowledge this work before completing it.',
        );
      const nextStatus =
        input.action === 'ACKNOWLEDGE' ? 'ACKNOWLEDGED' : 'COMPLETED';
      const [updated] = await transaction
        .update(ministryContent)
        .set({
          status: nextStatus,
          ...(input.action === 'ACKNOWLEDGE'
            ? { acknowledgedAt: now }
            : { completedAt: now }),
          updatedAt: now,
        })
        .where(eq(ministryContent.id, content.id))
        .returning();
      await transaction.insert(notifications).values({
        churchId: input.churchId,
        recipientUserId: content.senderUserId,
        actorUserId: input.actorUserId,
        type: 'MINISTRY_WORK_STATUS',
        title: `${content.title}: ${nextStatus === 'ACKNOWLEDGED' ? 'accepted by Media' : 'completed by Media'}`,
        body:
          nextStatus === 'ACKNOWLEDGED'
            ? 'The Media team has accepted this work item.'
            : 'The Media team marked this work item complete.',
        link: '/leader/ministry',
        ministryContentId: content.id,
      });
      await transaction.insert(auditLogs).values({
        churchId: input.churchId,
        actorUserId: input.actorUserId,
        action: `MINISTRY_CONTENT_${nextStatus}`,
        entityType: 'MINISTRY_CONTENT',
        entityId: content.id,
        previousData: { status: content.status },
        newData: { status: nextStatus },
      });
      return updated;
    });
  }

  async listAll(churchId: string) {
    return this.database
      .select({
        id: ministryContent.id,
        type: ministryContent.type,
        title: ministryContent.title,
        instructions: ministryContent.instructions,
        status: ministryContent.status,
        deadlineAt: ministryContent.deadlineAt,
        sentAt: ministryContent.sentAt,
        acknowledgedAt: ministryContent.acknowledgedAt,
        completedAt: ministryContent.completedAt,
        createdAt: ministryContent.createdAt,
        senderEmail: users.email,
        targetDepartment: departments.name,
        attachmentUrl: ministryAttachments.cloudinaryUrl,
      })
      .from(ministryContent)
      .innerJoin(users, eq(users.id, ministryContent.senderUserId))
      .innerJoin(
        departments,
        eq(departments.id, ministryContent.targetDepartmentId),
      )
      .leftJoin(
        ministryAttachments,
        eq(ministryAttachments.contentId, ministryContent.id),
      )
      .where(eq(ministryContent.churchId, churchId))
      .orderBy(desc(ministryContent.createdAt));
  }
}
