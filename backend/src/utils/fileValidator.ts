import { fileTypeFromBuffer } from 'file-type';
import { ValidationError } from './errors';
import { logger } from '../config/logger';

/**
 * Allowed file types with their MIME types and extensions
 */
const ALLOWED_FILE_TYPES = {
  'application/pdf': ['pdf'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'text/plain': ['txt'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png']
} as const;

/**
 * Maximum file size (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * PDF file signature (magic number)
 */
const PDF_SIGNATURE = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF

/**
 * Validates file using magic numbers (file signatures)
 * This prevents file type spoofing by checking actual file content
 * 
 * @param buffer - File buffer to validate
 * @param declaredMimeType - MIME type from upload
 * @param originalName - Original filename
 * @throws ValidationError if file is invalid
 */
export async function validateFileContent(
  buffer: Buffer,
  declaredMimeType: string,
  originalName: string
): Promise<void> {
  // Check file size
  if (buffer.length > MAX_FILE_SIZE) {
    throw new ValidationError(
      `File ${originalName} exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  // Check if buffer is empty
  if (buffer.length === 0) {
    throw new ValidationError(`File ${originalName} is empty`);
  }

  // Detect actual file type from content (magic numbers)
  const detectedType = await fileTypeFromBuffer(buffer);

  // Special handling for text files (no magic number)
  if (declaredMimeType === 'text/plain') {
    // Validate it's actually text by checking for binary content
    const isText = isTextFile(buffer);
    if (!isText) {
      logger.warn('File validation failed: declared as text but contains binary data', {
        originalName,
        declaredMimeType
      });
      throw new ValidationError(
        `File ${originalName} is declared as text but contains binary data`
      );
    }
    return; // Text files don't have magic numbers, so we're done
  }

  // For binary files, we must detect the type
  if (!detectedType) {
    logger.warn('File validation failed: unable to detect file type', {
      originalName,
      declaredMimeType,
      bufferSize: buffer.length
    });
    throw new ValidationError(
      `Unable to determine file type for ${originalName}. File may be corrupted or unsupported.`
    );
  }

  // Check if detected type is in allowed list
  const allowedMimeTypes = Object.keys(ALLOWED_FILE_TYPES);
  if (!allowedMimeTypes.includes(detectedType.mime)) {
    logger.warn('File validation failed: detected type not allowed', {
      originalName,
      declaredMimeType,
      detectedMimeType: detectedType.mime
    });
    throw new ValidationError(
      `File type ${detectedType.mime} is not allowed. Allowed types: PDF, DOC, DOCX, TXT, JPG, PNG`
    );
  }

  // Verify declared MIME type matches detected type
  if (declaredMimeType !== detectedType.mime) {
    logger.warn('File validation failed: MIME type mismatch', {
      originalName,
      declaredMimeType,
      detectedMimeType: detectedType.mime
    });
    throw new ValidationError(
      `File ${originalName} MIME type mismatch. Declared: ${declaredMimeType}, Detected: ${detectedType.mime}`
    );
  }

  // Additional validation for specific file types
  await validateSpecificFileType(buffer, detectedType.mime, originalName);
}

/**
 * Checks if a buffer contains text content
 * Returns false if it contains binary/non-printable characters
 */
function isTextFile(buffer: Buffer): boolean {
  // Check first 8KB for binary content
  const sampleSize = Math.min(buffer.length, 8192);
  const sample = buffer.slice(0, sampleSize);

  let binaryCount = 0;
  for (let i = 0; i < sample.length; i++) {
    const byte = sample[i];
    
    // Allow common text characters:
    // - Printable ASCII (32-126)
    // - Common whitespace (9=tab, 10=LF, 13=CR)
    // - UTF-8 continuation bytes (128-255)
    if (
      (byte >= 32 && byte <= 126) || // Printable ASCII
      byte === 9 || byte === 10 || byte === 13 || // Whitespace
      byte >= 128 // UTF-8 multibyte
    ) {
      continue;
    }
    
    // Count binary/control characters
    binaryCount++;
  }

  // If more than 5% of sample is binary, consider it a binary file
  const binaryRatio = binaryCount / sample.length;
  return binaryRatio < 0.05;
}

/**
 * Performs additional validation for specific file types
 */
async function validateSpecificFileType(
  buffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<void> {
  switch (mimeType) {
    case 'application/pdf':
      await validatePDF(buffer, originalName);
      break;
    case 'image/jpeg':
    case 'image/png':
      await validateImage(buffer, originalName);
      break;
    // Add more specific validations as needed
  }
}

/**
 * Validates PDF files for security issues
 */
async function validatePDF(buffer: Buffer, originalName: string): Promise<void> {
  // Check PDF header
  if (!buffer.slice(0, 4).equals(PDF_SIGNATURE)) {
    throw new ValidationError(`File ${originalName} is not a valid PDF`);
  }

  // Check for embedded JavaScript (potential XSS)
  const content = buffer.toString('utf-8', 0, Math.min(buffer.length, 50000));
  
  if (content.includes('/JavaScript') || content.includes('/JS')) {
    logger.warn('PDF validation warning: contains JavaScript', {
      originalName,
      suspicious: true
    });
    throw new ValidationError(
      `PDF file ${originalName} contains JavaScript which is not allowed for security reasons`
    );
  }

  // Check for launch actions (can execute external programs)
  if (content.includes('/Launch')) {
    logger.warn('PDF validation warning: contains Launch action', {
      originalName,
      suspicious: true
    });
    throw new ValidationError(
      `PDF file ${originalName} contains Launch actions which are not allowed for security reasons`
    );
  }

  // Check for embedded files
  if (content.includes('/EmbeddedFile')) {
    logger.warn('PDF validation warning: contains embedded files', {
      originalName,
      suspicious: true
    });
    throw new ValidationError(
      `PDF file ${originalName} contains embedded files which are not allowed for security reasons`
    );
  }
}

/**
 * Validates image files
 */
async function validateImage(buffer: Buffer, originalName: string): Promise<void> {
  // Check for reasonable image size (not too large)
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new ValidationError(
      `Image ${originalName} exceeds maximum size of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`
    );
  }

  // Additional image validation could be added here
  // For example, checking image dimensions, format validity, etc.
}

/**
 * Validates file extension matches allowed types
 */
export function validateFileExtension(filename: string, mimeType: string): void {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  if (!ext) {
    throw new ValidationError('File has no extension');
  }

  const allowedExtensions = ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES];
  
  if (!allowedExtensions) {
    throw new ValidationError(`MIME type ${mimeType} is not allowed`);
  }

  if (!(allowedExtensions as readonly string[]).includes(ext)) {
    throw new ValidationError(
      `File extension .${ext} does not match MIME type ${mimeType}. Expected: ${allowedExtensions.join(', ')}`
    );
  }
}

/**
 * Comprehensive file validation
 * Validates file size, extension, MIME type, and content
 */
export async function validateFile(file: Express.Multer.File): Promise<void> {
  // Validate extension matches MIME type
  validateFileExtension(file.originalname, file.mimetype);

  // Validate file content using magic numbers
  await validateFileContent(file.buffer, file.mimetype, file.originalname);

  logger.info('File validation successful', {
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size
  });
}
