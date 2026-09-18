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

  @Post('profile-picture')
  @ApiOperation({ summary: 'Upload or replace profile picture' })
  @ApiConsumes('multipart/form-data')
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

  @Delete('profile-picture')
  @ApiOperation({ summary: 'Delete profile picture' })
  deleteProfilePicture(@GetUser() user: any) {
    return this.uploadService.deleteProfilePicture(user.id);
  }
}
