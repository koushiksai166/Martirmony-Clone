import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomBytes } from 'crypto';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const uploadStorage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    const safe = randomBytes(16).toString('hex');
    cb(null, `${safe}${ext}`);
  },
});

export function imageFileFilter(
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, accept: boolean) => void,
) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(
      new BadRequestException('Only JPEG, PNG, and WebP images are allowed'),
      false,
    );
  }
  cb(null, true);
}

export const uploadLimits = { fileSize: MAX_SIZE_BYTES };