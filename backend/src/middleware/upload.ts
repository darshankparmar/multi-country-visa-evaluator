import multer from 'multer';
import { Request } from 'express';
import { getConfig } from '../config/environment';
import { ValidationError } from '../utils/errors';

/**
 * Allowed MIME types for document uploads
 */
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png'
];

/**
 * File filter function for Multer
 * Validates file MIME types before upload
 */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
): void => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new ValidationError(
        `Invalid file type: ${file.mimetype}. Allowed types: PDF, DOC, DOCX, TXT, JPG, PNG`
      )
    );
  }
};

/**
 * Multer configuration with memory storage
 * Files are stored in memory as Buffer objects for processing before saving to disk
 */
const config = getConfig();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: config.MAX_FILE_SIZE, // 5MB default
    files: 10 // Maximum 10 files per request
  },
  fileFilter
});

/**
 * Middleware for uploading multiple documents
 * Accepts up to 10 files with field name 'documents'
 */
export const uploadDocuments = upload.array('documents', 10);

/**
 * Middleware for uploading a single document
 * Accepts a single file with field name 'document'
 */
export const uploadSingleDocument = upload.single('document');

/**
 * Export the base upload instance for custom configurations
 */
export default upload;
