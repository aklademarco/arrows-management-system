import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MinistryContentService } from './ministry-content.service';

describe('MinistryContentService', () => {
  const user = {
    id: 'user-id',
    churchId: 'church-id',
    email: 'leader@example.com',
    roles: ['DEPARTMENT_LEADER'],
  };
  const body = {
    title: 'Sunday service flyer',
    cloudinaryUrl: 'https://res.cloudinary.com/acms/image/upload/flyer.webp',
    cloudinaryPublicId: 'acms/flyers/flyer',
    fileName: 'flyer.webp',
    mimeType: 'image/webp',
  };

  it('prevents a non-publicity leader from submitting a flyer', async () => {
    const repository = {
      getAccess: jest.fn().mockResolvedValue({ canSubmitFlyer: false }),
      createFlyer: jest.fn(),
    };
    const service = new MinistryContentService(repository as never);
    await expect(service.createFlyer(body, user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('requires a Media department', async () => {
    const repository = {
      getAccess: jest.fn().mockResolvedValue({ canSubmitFlyer: true }),
      createFlyer: jest.fn(),
    };
    const service = new MinistryContentService(repository as never);
    await expect(service.createFlyer(body, user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('prevents a non-choir leader from publishing song lists', async () => {
    const repository = {
      getAccess: jest.fn().mockResolvedValue({ canSubmitSongList: false }),
      createSongList: jest.fn(),
    };
    const service = new MinistryContentService(repository as never);
    await expect(
      service.createSongList(
        { title: 'Sunday worship', songs: [{ title: 'Way Maker' }] },
        user,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('publishes an ordered song list for an active choir leader', async () => {
    const repository = {
      getAccess: jest.fn().mockResolvedValue({
        canSubmitSongList: true,
        choirDepartment: { id: 'choir-id' },
        mediaDepartment: { id: 'media-id' },
      }),
      createSongList: jest.fn().mockResolvedValue({ id: 'content-id' }),
    };
    const service = new MinistryContentService(repository as never);
    await expect(
      service.createSongList(
        { title: 'Sunday worship', songs: [{ title: 'Way Maker' }] },
        user,
      ),
    ).resolves.toEqual({ id: 'content-id' });
    expect(repository.createSongList).toHaveBeenCalledWith(
      expect.objectContaining({
        choirDepartmentId: 'choir-id',
        mediaDepartmentId: 'media-id',
      }),
    );
  });
});
