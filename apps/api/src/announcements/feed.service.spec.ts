import 'reflect-metadata';
import { NotFoundException } from '@nestjs/common';
import type { MembersRepository } from '../members/members.repository';
import { ListCommentsDto, ListFeedDto } from './dto/feed.dto';
import { FeedRepository } from './feed.repository';
import { FeedService } from './feed.service';
import { PublisherAccessService } from './publisher-access.service';

const viewer = (id: string, roles: string[]) => ({
  id,
  churchId: 'church-id',
  email: `${id}@example.com`,
  roles,
});
const pastor = viewer('pastor-id', ['PASTOR']);
const leader = viewer('leader-id', ['DEPARTMENT_LEADER']);
const member = viewer('member-id', ['MEMBER']);

const post = {
  id: 'post-id',
  title: 'Choir rehearsal moved',
  theme: null,
  description: 'Now on Friday.',
  locationName: null,
  startsAt: null,
  endsAt: null,
  flyerUrl: null,
  createdBy: 'leader-id',
  authorName: 'Ama Mensah',
  authorPhotoUrl: null,
  pinnedAt: null as Date | null,
  commentsClosedAt: null as Date | null,
  createdAt: new Date('2026-11-10T10:00:00Z'),
  updatedAt: new Date('2026-11-10T10:00:00Z'),
};

function setup(
  overrides: Partial<Record<keyof FeedRepository, jest.Mock>> = {},
  ledDepartmentIds: string[] = ['dept-a'],
) {
  const repository = {
    listPosts: jest.fn().mockResolvedValue({ items: [post], total: 1 }),
    findPost: jest.fn().mockResolvedValue(post),
    engagement: jest.fn().mockResolvedValue({
      reactions: [
        { postId: 'post-id', reaction: 'AMEN', total: 3 },
        { postId: 'post-id', reaction: 'LIKE', total: 1 },
      ],
      mine: [{ postId: 'post-id', reaction: 'AMEN' }],
      comments: [{ postId: 'post-id', total: 2 }],
    }),
    upsertReaction: jest.fn().mockResolvedValue(undefined),
    removeReaction: jest.fn().mockResolvedValue(undefined),
    listComments: jest.fn().mockResolvedValue({
      items: [
        { id: 'c1', body: 'Amen!', authorUserId: 'member-id' },
        { id: 'c2', body: 'Noted.', authorUserId: 'someone-else' },
      ],
      total: 2,
    }),
    findComment: jest
      .fn()
      .mockResolvedValue({ id: 'comment-id', authorUserId: 'member-id' }),
    createComment: jest.fn().mockResolvedValue({ id: 'comment-id' }),
    updateCommentBody: jest.fn().mockResolvedValue(undefined),
    deleteComment: jest.fn().mockResolvedValue(undefined),
    reportComment: jest.fn().mockResolvedValue(undefined),
    setPinned: jest.fn().mockResolvedValue(undefined),
    setCommentsClosed: jest.fn().mockResolvedValue(undefined),
    listOpenReports: jest.fn().mockResolvedValue([]),
    findCommentForModeration: jest.fn().mockResolvedValue({ id: 'comment-id' }),
    hideComment: jest.fn().mockResolvedValue(undefined),
    dismissReports: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  const members = {
    findLedDepartmentIds: jest.fn().mockResolvedValue(ledDepartmentIds),
  };
  return {
    repository,
    service: new FeedService(
      repository as unknown as FeedRepository,
      new PublisherAccessService(members as unknown as MembersRepository),
    ),
  };
}

describe('FeedService', () => {
  describe('reading', () => {
    it('summarises reactions, the viewer reaction, and comment count', async () => {
      const { service } = setup();

      const page = await service.list(new ListFeedDto(), member);

      expect(page.items[0]).toMatchObject({
        reactionCounts: { LIKE: 1, AMEN: 3, LOVE: 0 },
        myReaction: 'AMEN',
        commentCount: 2,
        isPinned: false,
        commentsClosed: false,
        canManage: false,
      });
      expect(page.canPublish).toBe(false);
      expect(page.canModerate).toBe(false);
    });

    it('lets an active leader publish and manage only their own posts', async () => {
      const { service } = setup();
      const page = await service.list(new ListFeedDto(), leader);
      expect(page.canPublish).toBe(true);
      expect(page.canModerate).toBe(false);
      expect(page.items[0].canManage).toBe(true);
    });

    it('marks which comments belong to the viewer without exposing user IDs', async () => {
      const { service } = setup();
      const comments = await service.listComments(
        'post-id',
        new ListCommentsDto(),
        member,
      );
      expect(comments.items).toEqual([
        { id: 'c1', body: 'Amen!', isOwn: true },
        { id: 'c2', body: 'Noted.', isOwn: false },
      ]);
    });
  });

  describe('reactions', () => {
    it('stores one reaction per member through an upsert', async () => {
      const { service, repository } = setup();

      await service.react('post-id', 'LOVE', member);
      await service.react('post-id', 'LOVE', member);

      expect(repository.upsertReaction).toHaveBeenCalledTimes(2);
      expect(repository.upsertReaction).toHaveBeenLastCalledWith({
        churchId: 'church-id',
        postId: 'post-id',
        userId: 'member-id',
        reaction: 'LOVE',
      });
    });

    it('rejects reactions on archived or missing posts', async () => {
      const { service, repository } = setup({
        findPost: jest
          .fn()
          .mockRejectedValue(new NotFoundException('Post not found.')),
      });
      await expect(service.react('post-id', 'LIKE', member)).rejects.toThrow(
        'Post not found.',
      );
      expect(repository.upsertReaction).not.toHaveBeenCalled();
    });
  });

  describe('comments', () => {
    it('adds a trimmed comment', async () => {
      const { service, repository } = setup();
      await service.addComment('post-id', '  Praise God  ', member);
      expect(repository.createComment).toHaveBeenCalledWith({
        churchId: 'church-id',
        post,
        authorUserId: 'member-id',
        body: 'Praise God',
      });
    });

    it('rejects a blank comment', async () => {
      const { service } = setup();
      await expect(
        service.addComment('post-id', '   ', member),
      ).rejects.toThrow('A comment cannot be empty.');
    });

    it('rejects new comments and edits when comments are closed', async () => {
      const { service, repository } = setup({
        findPost: jest
          .fn()
          .mockResolvedValue({ ...post, commentsClosedAt: new Date() }),
      });
      await expect(
        service.addComment('post-id', 'Hello', member),
      ).rejects.toThrow('Comments are closed on this post.');
      await expect(
        service.editComment('post-id', 'comment-id', 'Hello', member),
      ).rejects.toThrow('Comments are closed on this post.');
      expect(repository.createComment).not.toHaveBeenCalled();
      expect(repository.updateCommentBody).not.toHaveBeenCalled();
    });

    it("stops a member from editing someone else's comment", async () => {
      const { service, repository } = setup({
        findComment: jest
          .fn()
          .mockResolvedValue({ id: 'comment-id', authorUserId: 'other' }),
      });
      await expect(
        service.editComment('post-id', 'comment-id', 'Changed', member),
      ).rejects.toThrow('You can only change your own comments.');
      await expect(
        service.deleteComment('post-id', 'comment-id', member),
      ).rejects.toThrow('You can only change your own comments.');
      expect(repository.updateCommentBody).not.toHaveBeenCalled();
      expect(repository.deleteComment).not.toHaveBeenCalled();
    });

    it('lets authors edit and remove their own comments', async () => {
      const { service, repository } = setup();
      await service.editComment('post-id', 'comment-id', ' Edited ', member);
      await service.deleteComment('post-id', 'comment-id', member);
      expect(repository.updateCommentBody).toHaveBeenCalledWith(
        'comment-id',
        'Edited',
      );
      expect(repository.deleteComment).toHaveBeenCalledWith(
        'comment-id',
        'member-id',
      );
    });
  });

  describe('reports', () => {
    it("records a report on someone else's comment", async () => {
      const { service, repository } = setup({
        findComment: jest
          .fn()
          .mockResolvedValue({ id: 'comment-id', authorUserId: 'other' }),
      });
      await service.reportComment('post-id', 'comment-id', ' Rude ', member);
      expect(repository.reportComment).toHaveBeenCalledWith({
        churchId: 'church-id',
        commentId: 'comment-id',
        reporterUserId: 'member-id',
        reason: 'Rude',
      });
    });

    it('rejects reporting your own comment', async () => {
      const { service } = setup();
      await expect(
        service.reportComment('post-id', 'comment-id', 'Oops', member),
      ).rejects.toThrow('You cannot report your own comment.');
    });
  });

  describe('moderation', () => {
    it.each([member, leader])(
      'stops $roles from pinning, closing, or hiding',
      async (user) => {
        const { service, repository } = setup();
        await expect(service.setPinned('post-id', true, user)).rejects.toThrow(
          'Only administrators and pastors can moderate the feed.',
        );
        await expect(
          service.setCommentsClosed('post-id', true, user),
        ).rejects.toThrow('Only administrators and pastors');
        await expect(
          service.hideComment('comment-id', 'Abusive', user),
        ).rejects.toThrow('Only administrators and pastors');
        await expect(service.listOpenReports(user)).rejects.toThrow(
          'Only administrators and pastors',
        );
        expect(repository.setPinned).not.toHaveBeenCalled();
        expect(repository.hideComment).not.toHaveBeenCalled();
      },
    );

    it('lets a pastor pin a post', async () => {
      const { service, repository } = setup();
      await service.setPinned('post-id', true, pastor);
      expect(repository.setPinned).toHaveBeenCalledWith({
        churchId: 'church-id',
        post,
        actorUserId: 'pastor-id',
        pinned: true,
      });
    });

    it('does nothing when the pin state already matches', async () => {
      const { service, repository } = setup({
        findPost: jest
          .fn()
          .mockResolvedValue({ ...post, pinnedAt: new Date() }),
      });
      await service.setPinned('post-id', true, pastor);
      expect(repository.setPinned).not.toHaveBeenCalled();
    });

    it('hides a comment with the trimmed reason', async () => {
      const { service, repository } = setup();
      await service.hideComment('comment-id', '  Abusive language ', pastor);
      expect(repository.hideComment).toHaveBeenCalledWith({
        churchId: 'church-id',
        commentId: 'comment-id',
        actorUserId: 'pastor-id',
        reason: 'Abusive language',
      });
    });

    it('dismisses reports for a comment', async () => {
      const { service, repository } = setup();
      await service.dismissReports('comment-id', pastor);
      expect(repository.dismissReports).toHaveBeenCalledWith({
        churchId: 'church-id',
        commentId: 'comment-id',
        actorUserId: 'pastor-id',
      });
    });
  });
});
