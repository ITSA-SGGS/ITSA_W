/**
 * ITSA Platform — Multer Upload Middleware Configuration
 * Phase 4: Storage & Media Migration
 */

import multer from 'multer';
import { Request } from 'express';
import { StorageFile } from './types.js';
import { BadRequestError, ValidationError } from '../utils/errors.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB overall ceiling (category limits enforced in validation)
    files: 1,
  },
  fileFilter: (_req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
    const mime = (file.mimetype || '').toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mime)) {
      return callback(
        new ValidationError(
          `Unsupported file format: "${file.mimetype}". Allowed image formats are: JPEG, PNG, WebP, AVIF.`
        )
      );
    }
    callback(null, true);
  },
});

export const uploadSingleImage = upload.single('file');

/**
 * Converts Express Multer file object into StorageFile abstraction.
 */
export function toStorageFile(file?: Express.Multer.File): StorageFile {
  if (!file || !file.buffer) {
    throw new BadRequestError(
      "No file provided. Please upload an image file in the multipart request with field name 'file'."
    );
  }

  return {
    buffer: file.buffer,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  };
}
