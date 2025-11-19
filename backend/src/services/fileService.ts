import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from '../config/environment';
import { ValidationError } from '../utils/errors';
import { validateFile } from '../utils/fileValidator';
import { logger } from '../config/logger';
import { TEXT_LIMITS } from '../constants';

/**
 * Represents a stored file with metadata
 */
export interface StoredFile {
  filename: string;
  path: string;
  originalName: string;
  size: number;
  mimetype: string;
  uploadedAt: Date;
}

/**
 * Allowed file extensions for document uploads
 */
const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.jpg',
  '.jpeg',
  '.png'
];

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
 * Service for managing file uploads and storage
 */
export class FileService {
  private uploadDir: string;
  private maxFileSize: number;

  /**
   * Creates a new FileService instance
   * @param uploadDir - Directory path for storing uploaded files (defaults to config value)
   * @param maxFileSize - Maximum file size in bytes (defaults to config value)
   */
  constructor(uploadDir?: string, maxFileSize?: number) {
    const config = getConfig();
    this.uploadDir = uploadDir || config.UPLOAD_DIR;
    this.maxFileSize = maxFileSize || config.MAX_FILE_SIZE;
  }

  /**
   * Initializes the upload directory
   * Creates the directory if it doesn't exist
   */
  async initialize(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      // Directory doesn't exist, create it
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Validates a file based on size, type, and content
   * Uses magic number validation to prevent file type spoofing
   * @param file - File to validate
   * @throws {ValidationError} If file is invalid
   */
  private async validateFileBasic(file: Express.Multer.File): Promise<void> {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new ValidationError(
        `File ${file.originalname} exceeds maximum size of ${this.maxFileSize / 1024 / 1024}MB`
      );
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new ValidationError(
        `File ${file.originalname} has invalid extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
      );
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new ValidationError(
        `File ${file.originalname} has invalid type. Allowed types: PDF, DOC, DOCX, TXT, JPG, PNG`
      );
    }

    // Perform deep content validation using magic numbers
    await validateFile(file);
  }

  /**
   * Generates a unique filename for storage
   * Prevents directory traversal by strictly sanitizing the filename
   * @param originalName - Original filename
   * @returns Unique filename with timestamp and UUID
   * @throws {ValidationError} If filename is invalid
   */
  private generateUniqueFilename(originalName: string): string {
    // Extract extension and validate it's in allowed list
    const ext = path.extname(originalName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new ValidationError(`Invalid file extension: ${ext}`);
    }

    const timestamp = Date.now();
    const uuid = uuidv4().split('-')[0]; // Use first segment of UUID for brevity
    
    // Use only basename to prevent directory traversal
    // Remove all special characters except alphanumeric, underscore, and hyphen
    const baseName = path.basename(originalName, ext);
    const sanitizedName = baseName
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, TEXT_LIMITS.FILENAME_MAX);
    
    // Ensure sanitized name is not empty
    if (sanitizedName.length === 0) {
      throw new ValidationError('Invalid filename - contains no valid characters');
    }
    
    return `${timestamp}_${uuid}_${sanitizedName}${ext}`;
  }

  /**
   * Validates that a file path is within the upload directory
   * Prevents directory traversal attacks
   * @param filePath - Path to validate
   * @throws {ValidationError} If path is outside upload directory
   */
  private validateFilePath(filePath: string): void {
    const resolvedPath = path.resolve(filePath);
    const uploadDirResolved = path.resolve(this.uploadDir);
    
    // Ensure the resolved path starts with the upload directory
    if (!resolvedPath.startsWith(uploadDirResolved + path.sep) && resolvedPath !== uploadDirResolved) {
      throw new ValidationError('Invalid file path - directory traversal detected');
    }
  }

  /**
   * Stores uploaded documents with validation and unique filename generation
   * @param files - Array of uploaded files from Multer
   * @returns Array of stored file metadata
   * @throws {ValidationError} If any file is invalid
   */
  async storeDocuments(files: Express.Multer.File[]): Promise<StoredFile[]> {
    // Ensure upload directory exists
    await this.initialize();

    const storedFiles: StoredFile[] = [];

    for (const file of files) {
      try {
        // Validate file (includes magic number validation)
        await this.validateFileBasic(file);

        // Generate unique filename (includes validation)
        const filename = this.generateUniqueFilename(file.originalname);
        const filePath = path.join(this.uploadDir, filename);

        // Validate the final path to prevent directory traversal
        this.validateFilePath(filePath);

        // Write file to disk
        await fs.writeFile(filePath, file.buffer);

        logger.info('File stored successfully', {
          originalName: file.originalname,
          filename,
          size: file.size,
          mimetype: file.mimetype
        });

        // Add to stored files array
        storedFiles.push({
          filename,
          path: filePath,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: new Date()
        });
      } catch (error) {
        logger.error('File validation or storage failed', {
          originalName: file.originalname,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    }

    return storedFiles;
  }

  /**
   * Retrieves a document by its path
   * @param filePath - Path to the file
   * @returns File buffer
   * @throws {Error} If file doesn't exist or can't be read
   * @throws {ValidationError} If path is outside upload directory
   */
  async getDocument(filePath: string): Promise<Buffer> {
    try {
      // Validate path to prevent directory traversal
      this.validateFilePath(filePath);
      
      return await fs.readFile(filePath);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Failed to retrieve document: ${filePath}`);
    }
  }

  /**
   * Deletes a document by its path
   * @param filePath - Path to the file
   * @throws {Error} If file can't be deleted
   * @throws {ValidationError} If path is outside upload directory
   */
  async deleteDocument(filePath: string): Promise<void> {
    try {
      // Validate path to prevent directory traversal
      this.validateFilePath(filePath);
      
      await fs.unlink(filePath);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Failed to delete document: ${filePath}`);
    }
  }

  /**
   * Checks if a file exists
   * @param filePath - Path to the file
   * @returns True if file exists, false otherwise
   * @throws {ValidationError} If path is outside upload directory
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      // Validate path to prevent directory traversal
      this.validateFilePath(filePath);
      
      await fs.access(filePath);
      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      return false;
    }
  }
}
