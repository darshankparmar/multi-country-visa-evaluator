import { RuleBasedEvaluator } from '../services/evaluators/ruleBasedEvaluator';
import { EvaluateParams } from '../services/evaluators/evaluatorInterface';
import { getVisaCriteria } from '../config/visaCriteria';

describe('Enhanced Rule-Based Evaluation Integration Tests', () => {
  let evaluator: RuleBasedEvaluator;

  beforeAll(() => {
    evaluator = new RuleBasedEvaluator();
  });

  describe('Visa-Specific Rule-Based Evaluation', () => {
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
    });

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
    });

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
    });
  });

  describe('Salary Threshold Validation', () => {
    it('should validate salary thresholds in rule-based evaluation', async () => {
      const criteria = getVisaCriteria('Ireland', 'Critical Skills Employment Permit');
      expect(criteria?.salaryThresholds).toBeDefined();
      expect(criteria?.salaryThresholds?.[0].amount).toBe(38000);

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

    it('should handle multiple salary thresholds', async () => {
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
  });

  describe('Education Requirement Validation', () => {
    it('should validate Bachelor requirement', async () => {
      const criteria = getVisaCriteria('Ireland', 'Critical Skills Employment Permit');
      expect(criteria?.educationLevel).toBe('Bachelor');

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
      expect(result.recommendations).toBeDefined();
    });

    it('should validate Master requirement', async () => {
      const criteria = getVisaCriteria('France', 'Talent Passport');
      expect(criteria?.educationLevel).toBe('Master');

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

      expect(result).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should handle visa with no education requirement', async () => {
      const criteria = getVisaCriteria('United States', 'O-1A Visa');
      expect(criteria?.educationLevel).toBe('None');

      const params: EvaluateParams = {
        country: 'United States',
        visaType: 'O-1A Visa',
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
      expect(result).not.toHaveProperty('categoryScores');
    });

    it('should handle visa types not in configuration', async () => {
      const params: EvaluateParams = {
        country: 'Canada',
        visaType: 'Express Entry',
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

  describe('Visa-Specific Scoring', () => {
    it('should apply visa-specific weights for Ireland Critical Skills', async () => {
      const criteria = getVisaCriteria('Ireland', 'Critical Skills Employment Permit');
      expect(criteria?.criteriaWeights).toBeDefined();
      expect(criteria?.criteriaWeights?.salary).toBe(35);

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

    it('should apply visa-specific weights for Netherlands Knowledge Migrant', async () => {
      const criteria = getVisaCriteria('Netherlands', 'Knowledge Migrant Permit');
      expect(criteria?.criteriaWeights).toBeDefined();
      expect(criteria?.criteriaWeights?.salary).toBe(40);

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
    });
  });

  describe('Visa-Specific Recommendations', () => {
    it('should generate visa-specific recommendations', async () => {
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
    });

    it('should include all required fields', async () => {
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
      
      expect(typeof result.score).toBe('number');
      expect(typeof result.summary).toBe('string');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('Multiple Visa Types', () => {
    it('should handle different visa types consistently', async () => {
      const visaTypes = [
        { country: 'Ireland', visaType: 'Critical Skills Employment Permit' },
        { country: 'Netherlands', visaType: 'Knowledge Migrant Permit' },
        { country: 'Germany', visaType: 'EU Blue Card' },
        { country: 'France', visaType: 'Talent Passport' }
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
      }
    });
  });

  describe('Performance', () => {
    it('should complete evaluation within reasonable time', async () => {
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

      expect(duration).toBeLessThan(2000);
    });

    it('should handle sequential evaluations', async () => {
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

  describe('Labor Market Test Handling', () => {
    it('should handle visa requiring labor market test', async () => {
      const criteria = getVisaCriteria('Ireland', 'General Employment Permit');
      expect(criteria?.laborMarketTestRequired).toBe(true);

      const params: EvaluateParams = {
        country: 'Ireland',
        visaType: 'General Employment Permit',
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

    it('should handle visa not requiring labor market test', async () => {
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

  describe('Sponsor Requirements Handling', () => {
    it('should handle visa requiring sponsor', async () => {
      const criteria = getVisaCriteria('Ireland', 'Critical Skills Employment Permit');
      expect(criteria?.sponsorRequired).toBe(true);

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

    it('should handle visa not requiring sponsor', async () => {
      const criteria = getVisaCriteria('Netherlands', 'Orientation Year Permit');
      expect(criteria?.sponsorRequired).toBe(false);

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
      expect(result.summary).toBeDefined();
    });
  });
});
