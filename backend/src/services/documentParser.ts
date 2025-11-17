import { promises as fs } from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { logger } from '../config/logger';
import { getConfig } from '../config/environment';

/**
 * Interface representing a parsed document with extracted text
 */
export interface ParsedDocument {
  filename: string;
  originalName: string;
  extractedText: string;
  documentType: string;
  success: boolean;
  error?: string;
}

/**
 * Service for parsing various document formats and extracting text content
 * Supports PDF, DOCX, DOC, and TXT file formats
 */
export class DocumentParser {
  private readonly maxTextLength: number;
  private readonly parsingTimeout: number;

  constructor() {
    // Load configuration from environment using validated config
    const config = getConfig();
    this.maxTextLength = config.MAX_DOCUMENT_TEXT_LENGTH;
    this.parsingTimeout = config.PARSING_TIMEOUT;
    
    logger.info('DocumentParser initialized', {
      maxTextLength: this.maxTextLength,
      parsingTimeout: this.parsingTimeout,
      parsingEnabled: config.ENABLE_DOCUMENT_PARSING
    });
  }

  /**
   * Parse multiple documents in parallel and extract text content
   * @param documents Array of document metadata with file paths
   * @returns Promise resolving to array of parsed documents
   */
  async parseDocuments(documents: Array<{
    filename: string;
    originalName: string;
    path: string;
  }>): Promise<ParsedDocument[]> {
    const startTime = Date.now();
    
    logger.info('Starting document parsing', {
      documentCount: documents.length
    });

    // Parse all documents in parallel
    const parsedDocuments = await Promise.all(
      documents.map(doc => this.parseDocument(doc.path, doc.filename, doc.originalName))
    );

    // Calculate statistics
    const successCount = parsedDocuments.filter(d => d.success).length;
    const failureCount = parsedDocuments.filter(d => !d.success).length;
    const totalTextLength = parsedDocuments
      .filter(d => d.success)
      .reduce((sum, d) => sum + d.extractedText.length, 0);
    const avgTextLength = successCount > 0 ? Math.round(totalTextLength / successCount) : 0;
    const duration = Date.now() - startTime;

    logger.info('Document parsing completed', {
      totalDocuments: documents.length,
      successfulParses: successCount,
      failedParses: failureCount,
      averageTextLength: avgTextLength,
      totalTextLength,
      durationMs: duration
    });

    return parsedDocuments;
  }

  /**
   * Parse a single document based on its file extension
   * @param filePath Full path to the document file
   * @param filename Stored filename
   * @param originalName Original filename from upload
   * @returns Promise resolving to parsed document result
   */
  private async parseDocument(
    filePath: string,
    filename: string,
    originalName: string
  ): Promise<ParsedDocument> {
    const ext = path.extname(originalName).toLowerCase();
    
    logger.debug('Parsing document', { filename, originalName, extension: ext });

    try {
      let extractedText: string;
      let documentType: string;

      switch (ext) {
        case '.pdf':
          extractedText = await this.parsePDF(filePath);
          documentType = 'PDF';
          break;
        
        case '.docx':
        case '.doc':
          extractedText = await this.parseDOCX(filePath);
          documentType = 'DOCX';
          break;
        
        case '.txt':
          extractedText = await this.parseTXT(filePath);
          documentType = 'TXT';
          break;
        
        default:
          logger.warn('Unsupported document format', { filename, extension: ext });
          return {
            filename,
            originalName,
            extractedText: '',
            documentType: 'UNSUPPORTED',
            success: false,
            error: `Unsupported file format: ${ext}`
          };
      }

      // Truncate text if it exceeds maximum length
      if (extractedText.length > this.maxTextLength) {
        logger.debug('Truncating document text', {
          filename,
          originalLength: extractedText.length,
          truncatedLength: this.maxTextLength
        });
        extractedText = extractedText.substring(0, this.maxTextLength) + '\n... [truncated]';
      }

      logger.debug('Document parsed successfully', {
        filename,
        documentType,
        textLength: extractedText.length
      });

      return {
        filename,
        originalName,
        extractedText,
        documentType,
        success: true
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('Document parsing failed', {
        filename,
        originalName,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        filename,
        originalName,
        extractedText: '',
        documentType: ext.substring(1).toUpperCase(),
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Extract text from PDF file using pdf-parse library
   * @param filePath Full path to the PDF file
   * @returns Promise resolving to extracted text content
   * @throws Error if PDF parsing fails
   */
  private async parsePDF(filePath: string): Promise<string> {
    try {
      // Read the PDF file as a buffer
      const dataBuffer = await fs.readFile(filePath);
      
      // Parse PDF with timeout protection
      const parsePromise = pdfParse(dataBuffer);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('PDF parsing timeout')), this.parsingTimeout);
      });

      const data = await Promise.race([parsePromise, timeoutPromise]);
      
      // Extract and clean text
      let text = data.text.trim();
      
      if (!text || text.length === 0) {
        logger.warn('PDF parsing resulted in empty text', { filePath });
        return '[PDF contains no extractable text]';
      }

      return text;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown PDF parsing error';
      logger.error('PDF parsing error', { filePath, error: errorMessage });
      throw new Error(`Failed to parse PDF: ${errorMessage}`);
    }
  }

  /**
   * Extract text from DOCX file using mammoth library
   * @param filePath Full path to the DOCX file
   * @returns Promise resolving to extracted plain text content
   * @throws Error if DOCX parsing fails
   */
  private async parseDOCX(filePath: string): Promise<string> {
    try {
      // Read the DOCX file as a buffer
      const dataBuffer = await fs.readFile(filePath);
      
      // Parse DOCX with timeout protection
      const parsePromise = mammoth.extractRawText({ buffer: dataBuffer });
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('DOCX parsing timeout')), this.parsingTimeout);
      });

      const result = await Promise.race([parsePromise, timeoutPromise]);
      
      // Extract and clean text
      let text = result.value.trim();
      
      // Log any warnings from mammoth
      if (result.messages && result.messages.length > 0) {
        logger.debug('DOCX parsing warnings', {
          filePath,
          warnings: result.messages.map(m => m.message)
        });
      }

      if (!text || text.length === 0) {
        logger.warn('DOCX parsing resulted in empty text', { filePath });
        return '[DOCX contains no extractable text]';
      }

      return text;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown DOCX parsing error';
      logger.error('DOCX parsing error', { filePath, error: errorMessage });
      throw new Error(`Failed to parse DOCX: ${errorMessage}`);
    }
  }

  /**
   * Read plain text file with UTF-8 encoding
   * @param filePath Full path to the text file
   * @returns Promise resolving to file content as string
   * @throws Error if file reading fails
   */
  private async parseTXT(filePath: string): Promise<string> {
    try {
      // Read text file with UTF-8 encoding and timeout protection
      const readPromise = fs.readFile(filePath, { encoding: 'utf-8' });
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('TXT file reading timeout')), this.parsingTimeout);
      });

      const text = await Promise.race([readPromise, timeoutPromise]);
      
      // Clean and validate text
      const cleanedText = text.trim();

      if (!cleanedText || cleanedText.length === 0) {
        logger.warn('TXT file is empty', { filePath });
        return '[Text file is empty]';
      }

      return cleanedText;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown file reading error';
      logger.error('TXT file reading error', { filePath, error: errorMessage });
      throw new Error(`Failed to read text file: ${errorMessage}`);
    }
  }
}
