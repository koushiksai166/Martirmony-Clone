/**
 * ============================================================================
 * UPLOAD CONTROLLER
 * ============================================================================
 * Exposes REST endpoints for handling file uploads (multipart/form-data).
 * 
 * Interceptors:
 * - FileInterceptor: Intercepts the 'file' field from the request, processes it
 *   using the provided storage engine (Multer), and attaches the processed file
 *   to the request object.
 * 
 * Endpoints:
 * POST   /upload/profile-picture – Uploads and links a new profile image
 * DELETE /upload/profile-picture – Deletes the existing profile image
 * ============================================================================
 */

import {
  Controller,
  Delete,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

import { imageFileFilter, uploadLimits, uploadStorage } from './upload.storage';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Upload or replace the current user's profile picture.
   * Enforces file size limits and allowed MIME types defined in upload.storage.ts.
   */
  @Post('profile-picture')
  @ApiOperation({ summary: 'Upload or replace profile picture' })
  @ApiConsumes('multipart/form-data') // Explicitly declare multipart for Swagger
  @UseInterceptors(
    FileInterceptor('file', {
      storage: uploadStorage,
      fileFilter: imageFileFilter,
      limits: uploadLimits,
    }),
  )
  uploadProfilePicture(
    @GetUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadService.updateProfilePicture(user.id, file);
  }

  /**
   * Delete the current user's profile picture.
   */
  @Delete('profile-picture')
  @ApiOperation({ summary: 'Delete profile picture' })
  deleteProfilePicture(@GetUser() user: any) {
    return this.uploadService.deleteProfilePicture(user.id);
  }
}
