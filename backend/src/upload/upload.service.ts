import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UploadService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfilePicture(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ profilePicture: string }> {
    if (!file) throw new BadRequestException('No file provided');

    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    // Delete old file if it was a local upload
    if (profile.profilePicture) {
      await this.deleteLocalFile(profile.profilePicture);
    }

    const url = `/uploads/${file.filename}`;
    await this.prisma.profile.update({
      where: { userId },
      data: { profilePicture: url },
    });

    return { profilePicture: url };
  }

  async deleteProfilePicture(userId: string): Promise<void> {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    if (!profile.profilePicture) return;

    await this.deleteLocalFile(profile.profilePicture);
    await this.prisma.profile.update({
      where: { userId },
      data: { profilePicture: null },
    });
  }

  private async deleteLocalFile(url: string): Promise<void> {
    if (!url.startsWith('/uploads/')) return;
    const filename = url.replace('/uploads/', '');
    try {
      await unlink(join(process.cwd(), 'uploads', filename));
    } catch {
      // File may already be gone — not fatal
    }
  }
}
