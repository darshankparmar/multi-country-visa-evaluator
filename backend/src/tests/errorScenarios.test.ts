import { AIEvaluator } from '../services/evaluators/aiEvaluator';
import { DocumentParser } from '../services/documentParser';
import { EvaluateParams } from '../services/evaluators/evaluatorInterface';
import { promises as fs } from 'fs';
import path from 'path';

describe('Error Scenario Tests', () => {
  let evaluator: AIEvaluator;
  let parser: DocumentParser;
  const fixturesPath = path.join(__dirname, 'fixtures');

  beforeAll(() => {
    evaluator = new AIEvaluator();
    parser = new DocumentParser();
  });

  describe('Document Parsing Failures', () => {
    it('should handle non-existent file gracefully', async () => {
      const nonExistentPath = path.join(fixturesPath, 'nonexistent.pdf');
      
      const documents = [
        {
          filename: 'missing.pdf',
          originalName: 'missing.pdf',
          path: nonExistentPath
        }
      ];

      const results = await parser.parseDocuments(documents);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
    });

    it('should handle corrupt PDF files', async () => {
      const corruptPdfPath = path.join(fixturesPath, 'corrupt_test.pdf');
      await fs.writeFile(corruptPdfPath, 'This is not a valid PDF');

      const documents = [
        {
          filename: 'corrupt.pdf',
          originalName: 'corrupt.pdf',
          path: corruptPdfPath
        }
      ];

      const results = await parser.parseDocuments(documents);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Failed to parse PDF');
      
      // Cleanup
      await fs.unlink(corruptPdfPath);
    });

    it('should handle corrupt DOCX files', async () => {
      const corruptDocxPath = path.join(fixturesPath, 'corrupt_test.docx');
      await fs.writeFile(corruptDocxPath, 'This is not a valid DOCX');

      const documents = [
        {
          filename: 'corrupt.docx',
          originalName: 'corrupt.docx',
          path: corruptDocxPath
        }
      ];

      const results = await parser.parseDocuments(documents);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Failed to parse DOCX');
      
      // Cleanup
      await fs.unlink(corruptDocxPath);
    });

    it('should continue evaluation when some documents fail to parse', async () => {
      const txtPath = path.join(fixturesPath, 'sample.txt');
      const nonExistentPath = path.join(fixturesPath, 'missing.pdf');
      
      const params: EvaluateParams = {
        country: 'United States',
        visaType: 'H-1B',
        documents: [
          {
            filename: 'good.txt',
            originalName: 'sample.txt',
            path: txtPath
          },
          {
            filename: 'bad.pdf',
            originalName: 'missing.pdf',
            path: nonExistentPath
          }
        ],
        userInfo: {
          name: 'Test User',
          email: 'test@example.com'
        }
      };

      const result = await evaluator.evaluate(params);

      // Should still complete evaluation
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.summary).toBeDefined();
    });
  });

  describe('Invalid File Formats', () => {
    it('should handle unsupported file formats', async () => {
      const txtPath = path.join(fixturesPath, 'sample.txt');
      
      const documents = [
        {
          filename: 'image.jpg',
          originalName: 'photo.jpg',
          path: txtPath
        }
      ];

      const results = await parser.parseDocuments(documents);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].documentType).toBe('UNSUPPORTED');
      expect(results[0].error).toContain('Unsupported file format');
    });

    it('should handle multiple unsupported formats', async () => {
      const txtPath = path.join(fixturesPath, 'sample.txt');
      
      const documents = [
        {
          filename: 'image.jpg',
          originalName: 'photo.jpg',
          path: txtPath
        },
        {
          filename: 'video.mp4',
          originalName: 'video.mp4',
          path: txtPath
        },
        {
          filename: 'archive.zip',
          originalName: 'files.zip',
          path: txtPath
        }
      ];

      const results = await parser.parseDocuments(documents);

      expect(results).toHaveLength(3);
      expect(results.every(r => !r.success)).toBe(true);
      expect(results.every(r => r.documentType === 'UNSUPPORTED')).toBe(true);
    });
  });

  describe('Fallback Evaluation', () => {
    it('should use fallback when document parsing fails completely', async () => {
      const params: EvaluateParams = {
        country: 'Canada',
        visaType: 'Express Entry',
        documents: [
          {
            filename: 'missing1.pdf',
            originalName: 'missing1.pdf',
            path: '/nonexistent/path1.pdf'
          },
          {
            filename: 'missing2.pdf',
            originalName: 'missing2.pdf',
            path: '/nonexistent/path2.pdf'
          }
        ],
        userInfo: {
          name: 'Test User',
          email: 'test@example.com'
        }
      };

      const result = await evaluator.evaluate(params);

      // Should still return a result using fallback or mock
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.summary).toBeDefined();
    });

    it('should provide meaningful fallback evaluation', async () => {
      // Test the fallback method directly
      const params: EvaluateParams = {
        country: 'United Kingdom',
        visaType: 'Skilled Worker',
        documents: [
          {
            filename: 'doc1.pdf',
            originalName: 'resume.pdf',
            path: '/path/to/doc1.pdf'
          },
          {
            filename: 'doc2.pdf',
            originalName: 'cover.pdf',
            path: '/path/to/doc2.pdf'
          }
        ],
        userInfo: {
          name: 'Test User',
          email: 'test@example.com'
        }
      };

      const fallbackResult = evaluator['fallbackEvaluation'](params);

      expect(fallbackResult.score).toBeGreaterThan(0);
      expect(fallbackResult.summary).toContain('United Kingdom');
      expect(fallbackResult.summary).toContain('Skilled Worker');
      expect(fallbackResult.summary).toContain('2 document');
    });
  });

  describe('OpenAI API Failure Scenarios', () => {
    it('should handle evaluation with no documents', async () => {
      const params: EvaluateParams = {
        country: 'Australia',
        visaType: 'Skilled Independent',
        documents: [],
        userInfo: {
          name: 'Test User',
          email: 'test@example.com'
        }
      };

      const result = await evaluator.evaluate(params);

      // Should complete even with no documents
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.summary).toBeDefined();
    });

    it('should handle malformed response gracefully', async () => {
      const malformedResponse: any = {
        choices: [
          {
            message: {
              content: 'This is not valid JSON { incomplete'
            }
          }
        ]
      };

      const result = evaluator['parseEnhancedResponse'](
        malformedResponse,
        { categories: [] }
      );

      // Should fallback to text parsing
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.summary).toBeDefined();
    });

    it('should handle empty response', async () => {
      const emptyResponse: any = {
        choices: [
          {
            message: {
              content: ''
            }
          }
        ]
      };

      const result = evaluator['parseEnhancedResponse'](
        emptyResponse,
        { categories: [] }
      );

      // Should provide default values
      expect(result).toBeDefined();
      expect(result.score).toBe(50); // Default score
      expect(result.summary).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long document names', async () => {
      const longName = 'a'.repeat(500) + '.txt';
      const txtPath = path.join(fixturesPath, 'sample.txt');
      
      const documents = [
        {
          filename: 'short.txt',
          originalName: longName,
          path: txtPath
        }
      ];

      const results = await parser.parseDocuments(documents);

      expect(results).toHaveLength(1);
      expect(results[0].originalName).toBe(longName);
    });

    it('should handle special characters in filenames', async () => {
      const specialName = 'file@#$%^&*().txt';
      const txtPath = path.join(fixturesPath, 'sample.txt');
      
      const documents = [
        {
          filename: 'normal.txt',
          originalName: specialName,
          path: txtPath
        }
      ];

      const results = await parser.parseDocuments(documents);

      expect(results).toHaveLength(1);
      expect(results[0].originalName).toBe(specialName);
    });

    it('should handle empty user info', async () => {
      const params: EvaluateParams = {
        country: 'Germany',
        visaType: 'EU Blue Card',
        documents: [],
        userInfo: {
          name: '',
          email: ''
        }
      };

      const result = await evaluator.evaluate(params);

      // Should still complete
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle very short country and visa type names', async () => {
      const params: EvaluateParams = {
        country: 'US',
        visaType: 'B',
        documents: [],
        userInfo: {
          name: 'Test User',
          email: 'test@example.com'
        }
      };

      const result = await evaluator.evaluate(params);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple parsing operations concurrently', async () => {
      const txtPath = path.join(fixturesPath, 'sample.txt');
      
      const documents = Array.from({ length: 10 }, (_, i) => ({
        filename: `doc${i}.txt`,
        originalName: `document${i}.txt`,
        path: txtPath
      }));

      const results = await parser.parseDocuments(documents);

      expect(results).toHaveLength(10);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle multiple evaluations concurrently', async () => {
      const params: EvaluateParams = {
        country: 'France',
        visaType: 'Talent Passport',
        documents: [],
        userInfo: {
          name: 'Test User',
          email: 'test@example.com'
        }
      };

      const evaluations = await Promise.all([
        evaluator.evaluate(params),
        evaluator.evaluate(params),
        evaluator.evaluate(params)
      ]);

      expect(evaluations).toHaveLength(3);
      expect(evaluations.every(e => e.score >= 0)).toBe(true);
    });
  });
});
