import 'reflect-metadata';
import {
  AnnouncementsRepository,
  type AnnouncementValues,
} from './announcements.repository';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { ListAnnouncementsDto } from './dto/list-announcements.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { PublisherAccessService } from './publisher-access.service';
import type { MembersRepository } from '../members/members.repository';

const viewer = (id: string, roles: string[]) => ({
  id,
  churchId: 'church-id',
  email: `${id}@example.com`,
  roles,
});
const admin = viewer('admin-id', ['ADMIN']);
const pastor = viewer('pastor-id', ['PASTOR']);
const leader = viewer('leader-id', ['DEPARTMENT_LEADER']);
const member = viewer('member-id', ['MEMBER']);

const stored = {
  id: 'announcement-id',
  kind: 'EVENT' as const,
  title: 'Youth Night',
  theme: 'Rooted',
  description: 'An evening of worship.',
  locationName: 'Main auditorium',
  startsAt: new Date('2026-12-05T18:00:00Z'),
  endsAt: null,
  flyerUrl: null,
  flyerPublicId: null,
  createdBy: 'leader-id',
  authorName: 'Ama Mensah',
  createdAt: new Date('2026-11-01T10:00:00Z'),
  updatedAt: new Date('2026-11-01T10:00:00Z'),
};

function createDto(overrides: Partial<CreateAnnouncementDto> = {}) {
  return Object.assign(new CreateAnnouncementDto(), {
    kind: 'EVENT',
    title: '  Youth Night  ',
    theme: '',
    startsAt: '2026-12-05T18:00:00.000Z',
    ...overrides,
  });
}

type WriteCall = {
  id?: string;
  churchId: string;
  actorUserId: string;
  previous?: AnnouncementValues;
  values: AnnouncementValues;
};

/** First argument of the first call, typed for assertions. */
function firstCall(mock: jest.Mock) {
  return (mock.mock.calls as WriteCall[][])[0][0];
}

function setup(
  overrides: Partial<Record<keyof AnnouncementsRepository, jest.Mock>> = {},
  ledDepartmentIds: string[] = ['dept-a'],
) {
  const repository = {
    list: jest.fn().mockResolvedValue({ items: [stored], total: 1 }),
    findById: jest.fn().mockResolvedValue(stored),
    create: jest.fn().mockResolvedValue(stored),
    update: jest.fn().mockResolvedValue(stored),
    archive: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  const members = {
    findLedDepartmentIds: jest.fn().mockResolvedValue(ledDepartmentIds),
  };
  return {
    repository,
    members,
    service: new AnnouncementsService(
      repository as unknown as AnnouncementsRepository,
      new PublisherAccessService(members as unknown as MembersRepository),
    ),
  };
}

describe('AnnouncementsService', () => {
  const originalCloudName = process.env.CLOUDINARY_CLOUD_NAME;
  beforeAll(() => {
    process.env.CLOUDINARY_CLOUD_NAME = 'arrows';
  });
  afterAll(() => {
    process.env.CLOUDINARY_CLOUD_NAME = originalCloudName;
  });

  describe('list', () => {
    it('lets any member read and marks what they can manage', async () => {
      const { service, repository } = setup();
      const query = new ListAnnouncementsDto();

      const page = await service.list(query, member);

      expect(repository.list).toHaveBeenCalledWith(
        query,
        'church-id',
        expect.any(Date),
      );
      expect(page.canPublish).toBe(false);
      expect(page.items[0].canManage).toBe(false);
    });

    it('lets the author manage their own post', async () => {
      const { service } = setup();
      const page = await service.list(new ListAnnouncementsDto(), leader);
      expect(page.canPublish).toBe(true);
      expect(page.items[0].canManage).toBe(true);
    });
  });

  describe('create', () => {
    it.each([admin, pastor, leader])(
      'lets $roles post with trimmed values',
      async (publisher) => {
        const { service, repository } = setup();

        await service.create(createDto(), publisher);

        const call = firstCall(repository.create);
        expect(call.churchId).toBe('church-id');
        expect(call.actorUserId).toBe(publisher.id);
        expect(call.values).toMatchObject({
          kind: 'EVENT',
          title: 'Youth Night',
          theme: null,
          startsAt: new Date('2026-12-05T18:00:00.000Z'),
          flyerUrl: null,
        });
      },
    );

    it('rejects a leader without an active leadership assignment', async () => {
      const { service, repository, members } = setup({}, []);
      await expect(service.create(createDto(), leader)).rejects.toThrow(
        'with an active assignment',
      );
      expect(members.findLedDepartmentIds).toHaveBeenCalledWith(
        'leader-id',
        'church-id',
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('rejects ordinary members', async () => {
      const { service, repository } = setup();
      await expect(service.create(createDto(), member)).rejects.toThrow(
        'Only administrators, pastors, and department leaders',
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('requires a start date for events but not for announcements', async () => {
      const { service } = setup();
      await expect(
        service.create(createDto({ startsAt: undefined }), admin),
      ).rejects.toThrow('Events need a start date and time.');
      await expect(
        service.create(
          createDto({ kind: 'ANNOUNCEMENT', startsAt: undefined }),
          admin,
        ),
      ).resolves.toBeDefined();
    });

    it('rejects an end before the start', async () => {
      const { service } = setup();
      await expect(
        service.create(
          createDto({ endsAt: '2026-12-05T17:00:00.000Z' }),
          admin,
        ),
      ).rejects.toThrow('The end must be after the start.');
    });

    it('accepts a flyer from the church flyer folder', async () => {
      const { service, repository } = setup();
      const flyerPublicId = 'acms/announcement-flyers/flyer-1';
      const flyerUrl = `https://res.cloudinary.com/arrows/image/upload/v1/${flyerPublicId}.webp`;

      await service.create(createDto({ flyerUrl, flyerPublicId }), admin);

      expect(firstCall(repository.create).values).toMatchObject({
        flyerUrl,
        flyerPublicId,
      });
    });

    it.each([
      [
        'another Cloudinary account',
        'https://res.cloudinary.com/evil/image/upload/v1/acms/announcement-flyers/x.webp',
        'acms/announcement-flyers/x',
      ],
      [
        'another folder',
        'https://res.cloudinary.com/arrows/image/upload/v1/acms/profile-photos/x.webp',
        'acms/profile-photos/x',
      ],
      [
        'a mismatched upload ID',
        'https://res.cloudinary.com/arrows/image/upload/v1/acms/announcement-flyers/a.webp',
        'acms/announcement-flyers/b',
      ],
    ])('rejects a flyer from %s', async (_label, flyerUrl, flyerPublicId) => {
      const { service } = setup();
      await expect(
        service.create(createDto({ flyerUrl, flyerPublicId }), admin),
      ).rejects.toThrow('configured Cloudinary account');
    });

    it('rejects a flyer URL without its upload ID', async () => {
      const { service } = setup();
      await expect(
        service.create(
          createDto({
            flyerUrl:
              'https://res.cloudinary.com/arrows/image/upload/v1/acms/announcement-flyers/x.webp',
          }),
          admin,
        ),
      ).rejects.toThrow('both its image URL and its upload ID');
    });
  });

  describe('update', () => {
    it('changes only the provided fields and clears nulls', async () => {
      const { service, repository } = setup();
      const body = Object.assign(new UpdateAnnouncementDto(), {
        title: 'Youth Night 2026',
        theme: null,
      });

      await service.update('announcement-id', body, leader);

      const call = firstCall(repository.update);
      expect(call.id).toBe('announcement-id');
      expect(call.actorUserId).toBe('leader-id');
      expect(call.previous).toMatchObject({
        title: 'Youth Night',
        theme: 'Rooted',
      });
      expect(call.values).toMatchObject({
        title: 'Youth Night 2026',
        theme: null,
        locationName: 'Main auditorium',
        startsAt: stored.startsAt,
      });
    });

    it('rejects a blank title instead of ignoring it', async () => {
      const { service } = setup();
      await expect(
        service.update(
          'announcement-id',
          Object.assign(new UpdateAnnouncementDto(), { title: '   ' }),
          leader,
        ),
      ).rejects.toThrow('A title is required.');
    });

    it("stops a leader from editing someone else's post", async () => {
      const { service, repository } = setup({
        findById: jest
          .fn()
          .mockResolvedValue({ ...stored, createdBy: 'other-leader' }),
      });
      await expect(
        service.update(
          'announcement-id',
          Object.assign(new UpdateAnnouncementDto(), { title: 'Changed' }),
          leader,
        ),
      ).rejects.toThrow('You can only change announcements you posted.');
      expect(repository.update).not.toHaveBeenCalled();
    });

    it("lets a pastor edit anyone's post", async () => {
      const { service, repository } = setup();
      await service.update(
        'announcement-id',
        Object.assign(new UpdateAnnouncementDto(), { title: 'Changed' }),
        pastor,
      );
      expect(repository.update).toHaveBeenCalled();
    });

    it('rejects an empty update', async () => {
      const { service } = setup();
      await expect(
        service.update('announcement-id', new UpdateAnnouncementDto(), admin),
      ).rejects.toThrow('Provide at least one field to update.');
    });
  });

  describe('archive', () => {
    it('lets an admin archive any post', async () => {
      const { service, repository } = setup();
      await service.archive('announcement-id', admin);
      expect(repository.archive).toHaveBeenCalledWith({
        id: 'announcement-id',
        churchId: 'church-id',
        actorUserId: 'admin-id',
      });
    });

    it('stops a member from archiving', async () => {
      const { service, repository } = setup();
      await expect(service.archive('announcement-id', member)).rejects.toThrow(
        'You can only change announcements you posted.',
      );
      expect(repository.archive).not.toHaveBeenCalled();
    });
  });
});
