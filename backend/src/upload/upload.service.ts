/**
 * ============================================================================
 * UPLOAD SERVICE
 * ============================================================================
 * Handles business logic for file uploads and deletions, interacting with Prisma.
 * Actual file persistence to disk is handled by Multer (configured in upload.storage.ts)
 * before this service is even called.
 * 
 * Capabilities:
 * - updateProfilePicture() – Updates the DB record with the new file URL and
 *                            cleans up the old file from disk if it exists.
 * - deleteProfilePicture() – Removes the file from disk and nullifies the DB field.
 * ============================================================================
 */

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

  /**
   * Links an uploaded file to a user's profile and cleans up any previous picture.
   * Note: The `file` object here has already been saved to disk by Multer.
   */
  async updateProfilePicture(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ profilePicture: string }> {
    if (!file) throw new BadRequestException('No file provided');

    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    // Delete the previous picture from local storage to save space
    if (profile.profilePicture) {
      await this.deleteLocalFile(profile.profilePicture);
    }

    // The public URL path (served by Express static middleware in main.ts)
    const url = `/uploads/${file.filename}`;
    
    await this.prisma.profile.update({
      where: { userId },
      data: { profilePicture: url },
    });

    return { profilePicture: url };
  }

  /**
   * Removes the profile picture from the database and deletes the physical file.
   */
  async deleteProfilePicture(userId: string): Promise<void> {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    
    if (!profile) throw new NotFoundException('Profile not found');
    if (!profile.profilePicture) return;

    // Remove from physical disk
    await this.deleteLocalFile(profile.profilePicture);
    
    // Nullify in database
    await this.prisma.profile.update({
      where: { userId },
      data: { profilePicture: null },
    });
  }

  /**
   * Safely deletes a file from the local `uploads` directory.
   * Catches and ignores errors (e.g., file already missing or in use).
   */
  private async deleteLocalFile(url: string): Promise<void> {
    // Only attempt deletion if it's a locally managed file
    if (!url.startsWith('/uploads/')) return;
    
    const filename = url.replace('/uploads/', '');
    try {
      await unlink(join(process.cwd(), 'uploads', filename));
    } catch {
      // File may already be gone — not fatal, continue execution
    }
  }
}
