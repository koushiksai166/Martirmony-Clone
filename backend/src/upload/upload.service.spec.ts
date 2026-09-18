import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UploadService } from './upload.service';

function makeFile(filename = 'abc123.jpg'): Express.Multer.File {
  return { filename } as Express.Multer.File;
}

describe('UploadService', () => {
  const mockPrisma = {
    profile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: UploadService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UploadService(mockPrisma as any);
  });

  it('throws BadRequestException when no file provided', async () => {
    await expect(
      service.updateProfilePicture('user-1', null as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException when profile does not exist', async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(null);
    await expect(
      service.updateProfilePicture('user-1', makeFile()),
    ).rejects.toThrow(NotFoundException);
  });

  it('stores the URL and returns it', async () => {
    mockPrisma.profile.findUnique.mockResolvedValue({ userId: 'user-1', profilePicture: null });
    mockPrisma.profile.update.mockResolvedValue({});
    const result = await service.updateProfilePicture('user-1', makeFile('abc.jpg'));
    expect(result.profilePicture).toBe('/uploads/abc.jpg');
    expect(mockPrisma.profile.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { profilePicture: '/uploads/abc.jpg' },
    });
  });

  it('only updates the profile of the requesting user (ownership)', async () => {
    mockPrisma.profile.findUnique.mockResolvedValue({ userId: 'user-1', profilePicture: null });
    mockPrisma.profile.update.mockResolvedValue({});
    await service.updateProfilePicture('user-1', makeFile('xyz.jpg'));
    expect(mockPrisma.profile.findUnique).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(mockPrisma.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );
  });
});
