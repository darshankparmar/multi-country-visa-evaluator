import { AIEvaluator } from '../services/evaluators/aiEvaluator';
import { EvaluateParams } from '../services/evaluators/evaluatorInterface';
import { getVisaCriteria } from '../config/visaCriteria';

describe('Enhanced AI Evaluation Integration Tests', () => {
  let evaluator: AIEvaluator;

  beforeAll(() => {
    evaluator = new AIEvaluator();
  });

  describe('Ireland Critical Skills Employment Permit', () => {
    it('should evaluate with Ireland Critical Skills criteria', async () => {
      const criteria = getVisaCriteria('Ireland', 'Critical Skills Employment Permit');
      expect(criteria).toBeDefined();

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

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.conclusion).toBeDefined();
    });

    it('should generate visa-specific recommendations for Ireland Critical Skills', async () => {
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

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations!.length).toBeGreaterThan(0);
    });

    it('should include visa-specific context in summary', async () => {
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

      expect(result.summary).toBeDefined();
      expect(typeof result.summary).toBe('string');
      expect(result.summary.length).toBeGreaterThan(0);
    });
  });

  describe('Netherlands Knowledge Migrant Permit', () => {
    it('should evaluate with Netherlands Knowledge Migrant criteria', async () => {
      const criteria = getVisaCriteria('Netherlands', 'Knowledge Migrant Permit');
      expect(criteria).toBeDefined();

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

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.conclusion).toBeDefined();
    });

    it('should handle multiple salary thresholds for Netherlands', async () => {
      const criteria = getVisaCriteria('Netherlands', 'Knowledge Migrant Permit');
      expect(criteria?.salaryThresholds).toHaveLength(3);

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

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Germany EU Blue Card', () => {
    it('should evaluate with Germany EU Blue Card criteria', async () => {
      const criteria = getVisaCriteria('Germany', 'EU Blue Card');
      expect(criteria).toBeDefined();

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

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.conclusion).toBeDefined();
    });

    it('should handle education requirements for Germany EU Blue Card', async () => {
      const criteria = getVisaCriteria('Germany', 'EU Blue Card');
      expect(criteria?.educationLevel).toBe('Bachelor');

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

      expect(result).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });
  });

  describe('United States H-1B Visa', () => {
    it('should evaluate with US H-1B criteria', async () => {
      const criteria = getVisaCriteria('United States', 'H-1B Visa');
      expect(criteria).toBeDefined();

      const params: EvaluateParams = {
        country: 'United States',
        visaType: 'H-1B Visa',
        documents: [],
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

    it('should handle labor market test requirement for H-1B', async () => {
      const criteria = getVisaCriteria('United States', 'H-1B Visa');
      expect(criteria?.laborMarketTestRequired).toBe(true);

      const params: EvaluateParams = {
        country: 'United States',
        visaType: 'H-1B Visa',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await evaluator.evaluate(params);

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });

  describe('Visa-Specific Recommendations', () => {
    it('should generate recommendations based on visa criteria', async () => {
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

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations!.length).toBeGreaterThan(0);
    });

    it('should provide actionable recommendations', async () => {
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

      expect(result.recommendations).toBeDefined();
      result.recommendations!.forEach(rec => {
        expect(typeof rec).toBe('string');
        expect(rec.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Fallback to Generic Evaluation', () => {
    it('should fallback to generic evaluation for unknown visa types', async () => {
      const criteria = getVisaCriteria('Unknown Country', 'Unknown Visa');
      expect(criteria).toBeNull();

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

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.conclusion).toBeDefined();
    });

    it('should maintain consistent response structure for fallback', async () => {
      const params: EvaluateParams = {
        country: 'Test Country',
        visaType: 'Test Visa',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await evaluator.evaluate(params);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('conclusion');
      expect(result).not.toHaveProperty('categoryScores');
    });
  });

  describe('Multiple Visa Types Comparison', () => {
    it('should handle different visa types with different criteria', async () => {
      const visaTypes = [
        { country: 'Ireland', visaType: 'Critical Skills Employment Permit' },
        { country: 'Netherlands', visaType: 'Knowledge Migrant Permit' },
        { country: 'Germany', visaType: 'EU Blue Card' },
        { country: 'United States', visaType: 'H-1B Visa' }
      ];

      for (const visa of visaTypes) {
        const params: EvaluateParams = {
          country: visa.country,
          visaType: visa.visaType,
          documents: [],
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
      }
    });
  });

  describe('Response Structure Validation', () => {
    it('should not expose internal category scores', async () => {
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

      expect(result).not.toHaveProperty('categoryScores');
      expect(result).not.toHaveProperty('categoryBreakdown');
      expect(result).not.toHaveProperty('internalScores');
      expect(result).not.toHaveProperty('weights');
    });

    it('should include all required fields in response', async () => {
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

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('conclusion');
      
      expect(typeof result.score).toBe('number');
      expect(typeof result.summary).toBe('string');
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(typeof result.conclusion).toBe('string');
    });
  });

  describe('Performance with Visa-Specific Criteria', () => {
    it('should complete visa-specific evaluation within reasonable time', async () => {
      const startTime = Date.now();

      const params: EvaluateParams = {
        country: 'Germany',
        visaType: 'EU Blue Card',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      await evaluator.evaluate(params);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
    });

    it('should handle sequential visa-specific evaluations', async () => {
      const params1: EvaluateParams = {
        country: 'Ireland',
        visaType: 'Critical Skills Employment Permit',
        documents: [],
        userInfo: { name: 'User 1', email: 'user1@example.com' }
      };

      const params2: EvaluateParams = {
        country: 'Netherlands',
        visaType: 'Knowledge Migrant Permit',
        documents: [],
        userInfo: { name: 'User 2', email: 'user2@example.com' }
      };

      const result1 = await evaluator.evaluate(params1);
      const result2 = await evaluator.evaluate(params2);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.score).toBeGreaterThanOrEqual(0);
      expect(result2.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Visa Criteria Integration', () => {
    it('should use correct criteria weights for Ireland Critical Skills', async () => {
      const criteria = getVisaCriteria('Ireland', 'Critical Skills Employment Permit');
      expect(criteria?.criteriaWeights).toBeDefined();
      expect(criteria?.criteriaWeights?.salary).toBe(35);
      expect(criteria?.criteriaWeights?.education).toBe(25);

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

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle visa without salary thresholds', async () => {
      const criteria = getVisaCriteria('Netherlands', 'Orientation Year Permit');
      expect(criteria?.salaryThresholds).toBeUndefined();

      const params: EvaluateParams = {
        country: 'Netherlands',
        visaType: 'Orientation Year Permit',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await evaluator.evaluate(params);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle visa with no labor market test requirement', async () => {
      const criteria = getVisaCriteria('Ireland', 'Critical Skills Employment Permit');
      expect(criteria?.laborMarketTestRequired).toBe(false);

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

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });
});
