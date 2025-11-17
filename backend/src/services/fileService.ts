import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from '../config/environment';
import { ValidationError } from '../utils/errors';

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
   * Validates a file based on size and type
   * @param file - File to validate
   * @throws {ValidationError} If file is invalid
   */
  private validateFile(file: Express.Multer.File): void {
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
  }

  /**
   * Generates a unique filename for storage
   * @param originalName - Original filename
   * @returns Unique filename with timestamp and UUID
   */
  private generateUniqueFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const uuid = uuidv4().split('-')[0]; // Use first segment of UUID for brevity
    const sanitizedName = path.basename(originalName, ext)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50); // Limit length
    
    return `${timestamp}_${uuid}_${sanitizedName}${ext}`;
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
      // Validate file
      this.validateFile(file);

      // Generate unique filename
      const filename = this.generateUniqueFilename(file.originalname);
      const filePath = path.join(this.uploadDir, filename);

      // Write file to disk
      await fs.writeFile(filePath, file.buffer);

      // Add to stored files array
      storedFiles.push({
        filename,
        path: filePath,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date()
      });
    }

    return storedFiles;
  }

  /**
   * Retrieves a document by its path
   * @param filePath - Path to the file
   * @returns File buffer
   * @throws {Error} If file doesn't exist or can't be read
   */
  async getDocument(filePath: string): Promise<Buffer> {
    try {
      return await fs.readFile(filePath);
    } catch (error) {
      throw new Error(`Failed to retrieve document: ${filePath}`);
    }
  }

  /**
   * Deletes a document by its path
   * @param filePath - Path to the file
   * @throws {Error} If file can't be deleted
   */
  async deleteDocument(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      throw new Error(`Failed to delete document: ${filePath}`);
    }
  }

  /**
   * Checks if a file exists
   * @param filePath - Path to the file
   * @returns True if file exists, false otherwise
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
