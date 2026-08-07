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
});
