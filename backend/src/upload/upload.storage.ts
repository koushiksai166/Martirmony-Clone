/**
 * ============================================================================
 * MULTER STORAGE CONFIGURATION
 * ============================================================================
 * Defines the configuration for physical file storage, validation, and limits.
 * Passed into the Multer interceptor in upload.controller.ts.
 * ============================================================================
 */

import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomBytes } from 'crypto';

// 1. MIME Type Whitelist
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

// 2. File Size Limit
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Storage Engine Configuration
 * Determines where to save the file and what to name it.
 */
export const uploadStorage = diskStorage({
  // Save directly to the backend/uploads folder (must exist)
  destination: './uploads',
  
  // Generate a random 16-byte hex name to prevent directory traversal
  // and filename collision attacks (e.g. overwriting existing files).
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    const safe = randomBytes(16).toString('hex');
    cb(null, `${safe}${ext}`);
  },
});

/**
 * File Filter
 * Validates the MIME type of incoming files before they are streamed to disk.
 * If rejected, Multer throws the exception immediately.
 */
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
  // Accept the file
  cb(null, true);
}

/**
 * Exported limits object for Multer interceptor
 */
export const uploadLimits = { fileSize: MAX_SIZE_BYTES };