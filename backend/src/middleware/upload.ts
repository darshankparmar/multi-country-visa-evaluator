import multer from 'multer';
import { Request } from 'express';
import { getConfig } from '../config/environment';
import { ValidationError } from '../utils/errors';
import { UPLOAD_LIMITS } from '../constants';

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
 * 
 * Note: Using getter for fileSize to support hot-reload in development
 * where modules may be reloaded without restarting the process
 */
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    get fileSize() {
      return getConfig().MAX_FILE_SIZE;
    },
    files: UPLOAD_LIMITS.MAX_FILES_PER_REQUEST
  },
  fileFilter
});

/**
 * Middleware for uploading multiple documents
 * Accepts up to 10 files with field name 'documents'
 */
export const uploadDocuments = upload.array('documents', UPLOAD_LIMITS.MAX_FILES_PER_REQUEST);

/**
 * Middleware for uploading a single document
 * Accepts a single file with field name 'document'
 */
export const uploadSingleDocument = upload.single('document');

/**
 * Export the base upload instance for custom configurations
 */
export default upload;
