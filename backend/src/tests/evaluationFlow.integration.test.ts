import { AIEvaluator } from '../services/evaluators/aiEvaluator';
import { EvaluateParams } from '../services/evaluators/evaluatorInterface';
import path from 'path';

describe('Evaluation Flow Integration Tests', () => {
  let evaluator: AIEvaluator;
  const fixturesPath = path.join(__dirname, 'fixtures');

  beforeAll(() => {
    evaluator = new AIEvaluator();
  });

  describe('End-to-End Evaluation with PDF Documents', () => {
    it('should complete evaluation with PDF document', async () => {
      const pdfPath = path.join(fixturesPath, 'Darshan Parmar Resume.pdf');
      
      const params: EvaluateParams = {
        country: 'United States',
        visaType: 'O-1A',
        documents: [
          {
            filename: 'resume.pdf',
            originalName: 'Darshan Parmar Resume.pdf',
            path: pdfPath
          }
        ],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await evaluator.evaluate(params);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.summary).toBeDefined();
      expect(result.summary.length).toBeGreaterThan(0);
      expect(result.recommendations).toBeDefined();
      expect(result.conclusion).toBeDefined();
    });
  });

  describe('End-to-End Evaluation with DOCX Documents', () => {
    it('should complete evaluation with DOCX document', async () => {
      const docxPath = path.join(fixturesPath, 'Darshan Parmar Resume.docx');
      
      const params: EvaluateParams = {
        country: 'Canada',
        visaType: 'Express Entry',
        documents: [
          {
            filename: 'resume.docx',
            originalName: 'Darshan Parmar Resume.docx',
            path: docxPath
          }
        ],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await evaluator.evaluate(params);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.conclusion).toBeDefined();
    });
  });

  describe('End-to-End Evaluation with Mixed Document Types', () => {
    it('should complete evaluation with mixed document types', async () => {
      const txtPath = path.join(fixturesPath, 'sample.txt');
      
      const params: EvaluateParams = {
        country: 'United Kingdom',
        visaType: 'Skilled Worker',
        documents: [
          {
            filename: 'doc1.txt',
            originalName: 'cover_letter.txt',
            path: txtPath
          },
          {
            filename: 'doc2.txt',
            originalName: 'references.txt',
            path: txtPath
          }
        ],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await evaluator.evaluate(params);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.conclusion).toBeDefined();
    });
  });

  describe('Response Structure Validation', () => {
    it('should include recommendations in response', async () => {
      const params: EvaluateParams = {
        country: 'Australia',
        visaType: 'Skilled Independent',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await evaluator.evaluate(params);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations!.length).toBeGreaterThan(0);
    });

    it('should include conclusion in response', async () => {
      const params: EvaluateParams = {
        country: 'Germany',
        visaType: 'EU Blue Card',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await evaluator.evaluate(params);

      expect(result.conclusion).toBeDefined();
      expect(typeof result.conclusion).toBe('string');
      expect(result.conclusion!.length).toBeGreaterThan(0);
    });

    it('should not expose category scores to users', async () => {
      const params: EvaluateParams = {
        country: 'France',
        visaType: 'Talent Passport',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await evaluator.evaluate(params);

      expect(result).not.toHaveProperty('categoryScores');
      expect(result).not.toHaveProperty('categoryBreakdown');
      expect(result).not.toHaveProperty('internalScores');
    });
  });

  describe('Mock AI Mode Integration', () => {
    it('should work with mock AI mode enabled', async () => {
      const params: EvaluateParams = {
        country: 'United States',
        visaType: 'O-1A',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await evaluator.evaluate(params);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.conclusion).toBeDefined();
    });

    it('should return consistent structure in mock mode', async () => {
      const params1: EvaluateParams = {
        country: 'Canada',
        visaType: 'Express Entry',
        documents: [],
        userInfo: { name: 'User 1', email: 'user1@example.com' }
      };

      const params2: EvaluateParams = {
        country: 'Australia',
        visaType: 'Skilled Independent',
        documents: [],
        userInfo: { name: 'User 2', email: 'user2@example.com' }
      };

      const result1 = await evaluator.evaluate(params1);
      const result2 = await evaluator.evaluate(params2);

      // Both should have the same structure
      expect(Object.keys(result1).sort()).toEqual(Object.keys(result2).sort());
      expect(Array.isArray(result1.recommendations)).toBe(true);
      expect(Array.isArray(result2.recommendations)).toBe(true);
    });
  });

  describe('Visa-Specific Configuration Integration', () => {
    it('should use visa-specific config for United States O-1A', async () => {
      const params: EvaluateParams = {
        country: 'United States',
        visaType: 'O-1A',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await evaluator.evaluate(params);

      // Should complete successfully with visa-specific config
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should use default config for unknown visa types', async () => {
      const params: EvaluateParams = {
        country: 'Unknown Country',
        visaType: 'Unknown Visa',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await evaluator.evaluate(params);

      // Should complete successfully with default config
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should use visa-specific evaluation for Ireland Critical Skills', async () => {
      const params: EvaluateParams = {
        country: 'Ireland',
        visaType: 'Critical Skills Employment Permit',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await evaluator.evaluate(params);

      // Should complete successfully with visa-specific criteria
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.conclusion).toBeDefined();
    });

    it('should use visa-specific evaluation for Germany EU Blue Card', async () => {
      const params: EvaluateParams = {
        country: 'Germany',
        visaType: 'EU Blue Card',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await evaluator.evaluate(params);

      // Should complete successfully with visa-specific criteria
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.conclusion).toBeDefined();
    });

    it('should use visa-specific evaluation for Netherlands Knowledge Migrant', async () => {
      const params: EvaluateParams = {
        country: 'Netherlands',
        visaType: 'Knowledge Migrant Permit',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await evaluator.evaluate(params);

      // Should complete successfully with visa-specific criteria
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.conclusion).toBeDefined();
    });
  });

  describe('Performance and Reliability', () => {
    it('should complete evaluation within reasonable time', async () => {
      const startTime = Date.now();
      
      const params: EvaluateParams = {
        country: 'Singapore',
        visaType: 'Employment Pass',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      await evaluator.evaluate(params);
      
      const duration = Date.now() - startTime;
      
      // Should complete within 5 seconds in mock mode
      expect(duration).toBeLessThan(5000);
    });

    it('should handle multiple evaluations sequentially', async () => {
      const params: EvaluateParams = {
        country: 'Japan',
        visaType: 'Highly Skilled Professional',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result1 = await evaluator.evaluate(params);
      const result2 = await evaluator.evaluate(params);
      const result3 = await evaluator.evaluate(params);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result3).toBeDefined();
    });
  });
});
