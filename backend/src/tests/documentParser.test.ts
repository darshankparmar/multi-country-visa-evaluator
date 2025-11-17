import { DocumentParser } from '../services/documentParser';
import { promises as fs } from 'fs';
import path from 'path';

describe('DocumentParser', () => {
  let parser: DocumentParser;
  const fixturesPath = path.join(__dirname, 'fixtures');

  beforeAll(() => {
    parser = new DocumentParser();
  });

  describe('TXT file parsing', () => {
    it('should extract text from TXT file', async () => {
      const txtPath = path.join(fixturesPath, 'sample.txt');
      
      const result = await parser['parseDocument'](
        txtPath,
        'sample.txt',
        'sample.txt'
      );

      expect(result.success).toBe(true);
      expect(result.documentType).toBe('TXT');
      expect(result.extractedText).toContain('sample text document');
      expect(result.error).toBeUndefined();
    });

    it('should handle empty TXT files', async () => {
      const emptyTxtPath = path.join(fixturesPath, 'empty.txt');
      await fs.writeFile(emptyTxtPath, '');

      const result = await parser['parseDocument'](
        emptyTxtPath,
        'empty.txt',
        'empty.txt'
      );

      expect(result.success).toBe(true);
      expect(result.extractedText).toBe('[Text file is empty]');
      
      // Cleanup
      await fs.unlink(emptyTxtPath);
    });

    it('should handle TXT file reading errors', async () => {
      const nonExistentPath = path.join(fixturesPath, 'nonexistent.txt');

      const result = await parser['parseDocument'](
        nonExistentPath,
        'nonexistent.txt',
        'nonexistent.txt'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Failed to read text file');
    });
  });

  describe('PDF file parsing', () => {
    it('should extract text from PDF file', async () => {
      // Use the existing PDF in temp folder
      const pdfPath = path.join(fixturesPath, 'Darshan Parmar Resume.pdf');
      
      // Check if file exists
      try {
        await fs.access(pdfPath);
      } catch {
        console.log('PDF test file not found, skipping test');
        return;
      }

      const result = await parser['parseDocument'](
        pdfPath,
        'resume.pdf',
        'Darshan Parmar Resume.pdf'
      );

      expect(result.success).toBe(true);
      expect(result.documentType).toBe('PDF');
      expect(result.extractedText.length).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    it('should handle corrupt PDF files', async () => {
      const corruptPdfPath = path.join(fixturesPath, 'corrupt.pdf');
      await fs.writeFile(corruptPdfPath, 'This is not a valid PDF file');

      const result = await parser['parseDocument'](
        corruptPdfPath,
        'corrupt.pdf',
        'corrupt.pdf'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Failed to parse PDF');
      
      // Cleanup
      await fs.unlink(corruptPdfPath);
    });
  });

  describe('DOCX file parsing', () => {
    it('should extract text from DOCX file', async () => {
      // Use the existing DOCX in temp folder
      const docxPath = path.join(fixturesPath, 'Darshan Parmar Resume.docx');
      
      // Check if file exists
      try {
        await fs.access(docxPath);
      } catch {
        console.log('DOCX test file not found, skipping test');
        return;
      }

      const result = await parser['parseDocument'](
        docxPath,
        'resume.docx',
        'Darshan Parmar Resume.docx'
      );

      expect(result.success).toBe(true);
      expect(result.documentType).toBe('DOCX');
      expect(result.extractedText.length).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    it('should handle corrupt DOCX files', async () => {
      const corruptDocxPath = path.join(fixturesPath, 'corrupt.docx');
      await fs.writeFile(corruptDocxPath, 'This is not a valid DOCX file');

      const result = await parser['parseDocument'](
        corruptDocxPath,
        'corrupt.docx',
        'corrupt.docx'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Failed to parse DOCX');
      
      // Cleanup
      await fs.unlink(corruptDocxPath);
    });
  });

  describe('Unsupported file formats', () => {
    it('should handle unsupported file formats', async () => {
      const unsupportedPath = path.join(fixturesPath, 'sample.txt');

      const result = await parser['parseDocument'](
        unsupportedPath,
        'image.jpg',
        'image.jpg'
      );

      expect(result.success).toBe(false);
      expect(result.documentType).toBe('UNSUPPORTED');
      expect(result.error).toContain('Unsupported file format');
    });
  });

  describe('Parallel document parsing', () => {
    it('should parse multiple documents in parallel', async () => {
      const txtPath = path.join(fixturesPath, 'sample.txt');
      
      const documents = [
        { filename: 'doc1.txt', originalName: 'sample1.txt', path: txtPath },
        { filename: 'doc2.txt', originalName: 'sample2.txt', path: txtPath },
        { filename: 'doc3.txt', originalName: 'sample3.txt', path: txtPath }
      ];

      const results = await parser.parseDocuments(documents);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(results.every(r => r.extractedText.length > 0)).toBe(true);
    });

    it('should handle mixed success and failure in parallel parsing', async () => {
      const txtPath = path.join(fixturesPath, 'sample.txt');
      const nonExistentPath = path.join(fixturesPath, 'nonexistent.txt');
      
      const documents = [
        { filename: 'doc1.txt', originalName: 'sample.txt', path: txtPath },
        { filename: 'doc2.txt', originalName: 'missing.txt', path: nonExistentPath },
        { filename: 'doc3.jpg', originalName: 'image.jpg', path: txtPath }
      ];

      const results = await parser.parseDocuments(documents);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(false);
    });
  });

  describe('Text truncation', () => {
    it('should truncate very long text', async () => {
      const longTextPath = path.join(fixturesPath, 'long.txt');
      const longText = 'A'.repeat(15000); // Exceeds MAX_DOCUMENT_TEXT_LENGTH
      await fs.writeFile(longTextPath, longText);

      const result = await parser['parseDocument'](
        longTextPath,
        'long.txt',
        'long.txt'
      );

      expect(result.success).toBe(true);
      expect(result.extractedText).toContain('[truncated]');
      expect(result.extractedText.length).toBeLessThan(longText.length);
      
      // Cleanup
      await fs.unlink(longTextPath);
    });
  });
});
