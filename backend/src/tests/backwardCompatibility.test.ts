import { AIEvaluator } from '../services/evaluators/aiEvaluator';
import { RuleBasedEvaluator } from '../services/evaluators/ruleBasedEvaluator';
import { EvaluateParams } from '../services/evaluators/evaluatorInterface';
import { getVisaCriteria } from '../config/visaCriteria';

describe('Backward Compatibility Tests', () => {
  let aiEvaluator: AIEvaluator;
  let ruleBasedEvaluator: RuleBasedEvaluator;

  beforeAll(() => {
    aiEvaluator = new AIEvaluator();
    ruleBasedEvaluator = new RuleBasedEvaluator();
  });

  describe('Visa Types Without Specific Criteria', () => {
    it('should evaluate Canada Express Entry without specific criteria', async () => {
      const criteria = getVisaCriteria('Canada', 'Express Entry');
      expect(criteria).toBeNull();

      const params: EvaluateParams = {
        country: 'Canada',
        visaType: 'Express Entry',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await aiEvaluator.evaluate(params);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.conclusion).toBeDefined();
    });

    it('should evaluate Australia Skilled Independent without specific criteria', async () => {
      const criteria = getVisaCriteria('Australia', 'Skilled Independent');
      expect(criteria).toBeNull();

      const params: EvaluateParams = {
        country: 'Australia',
        visaType: 'Skilled Independent',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await aiEvaluator.evaluate(params);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should evaluate UK Skilled Worker without specific criteria', async () => {
      const criteria = getVisaCriteria('United Kingdom', 'Skilled Worker');
      expect(criteria).toBeNull();

      const params: EvaluateParams = {
        country: 'United Kingdom',
        visaType: 'Skilled Worker',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await aiEvaluator.evaluate(params);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Existing Evaluations Still Work', () => {
    it('should maintain existing AI evaluation functionality', async () => {
      const params: EvaluateParams = {
        country: 'Singapore',
        visaType: 'Employment Pass',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await aiEvaluator.evaluate(params);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('conclusion');
      expect(result).not.toHaveProperty('categoryScores');
    });

    it('should maintain existing rule-based evaluation functionality', async () => {
      const params: EvaluateParams = {
        country: 'Japan',
        visaType: 'Highly Skilled Professional',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await ruleBasedEvaluator.evaluate(params);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('summary');
    });

    it('should produce consistent response structure for legacy visa types', async () => {
      const legacyVisaTypes = [
        { country: 'Canada', visaType: 'Express Entry' },
        { country: 'Australia', visaType: 'Skilled Independent' },
        { country: 'United Kingdom', visaType: 'Skilled Worker' },
        { country: 'Singapore', visaType: 'Employment Pass' }
      ];

      for (const visa of legacyVisaTypes) {
        const params: EvaluateParams = {
          country: visa.country,
          visaType: visa.visaType,
          documents: [],
          userInfo: {
            name: 'Test Applicant',
            email: 'test@example.com'
          }
        };

        const result = await aiEvaluator.evaluate(params);

        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('summary');
        expect(result).toHaveProperty('recommendations');
        expect(result).toHaveProperty('conclusion');
        expect(typeof result.score).toBe('number');
        expect(typeof result.summary).toBe('string');
        expect(Array.isArray(result.recommendations)).toBe(true);
      }
    });
  });

  describe('Fallback Mechanisms', () => {
    it('should fallback to default evaluation for unknown country', async () => {
      const params: EvaluateParams = {
        country: 'Unknown Country',
        visaType: 'Unknown Visa',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await aiEvaluator.evaluate(params);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.summary).toBeDefined();
    });

    it('should fallback gracefully when visa criteria not found', async () => {
      const criteria = getVisaCriteria('New Zealand', 'Skilled Migrant');
      expect(criteria).toBeNull();

      const params: EvaluateParams = {
        country: 'New Zealand',
        visaType: 'Skilled Migrant',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const aiResult = await aiEvaluator.evaluate(params);
      const ruleResult = await ruleBasedEvaluator.evaluate(params);

      expect(aiResult).toBeDefined();
      expect(ruleResult).toBeDefined();
      expect(aiResult.score).toBeGreaterThanOrEqual(0);
      expect(ruleResult.score).toBeGreaterThanOrEqual(0);
    });

    it('should use default scoring categories for unconfigured visa types', async () => {
      const params: EvaluateParams = {
        country: 'South Korea',
        visaType: 'E-7 Visa',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await aiEvaluator.evaluate(params);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });
  });

  describe('Response Structure Consistency', () => {
    it('should maintain same response structure for both configured and unconfigured visas', async () => {
      const configuredParams: EvaluateParams = {
        country: 'Ireland',
        visaType: 'Critical Skills Employment Permit',
        documents: [],
        userInfo: { name: 'User 1', email: 'user1@example.com' }
      };

      const unconfiguredParams: EvaluateParams = {
        country: 'Canada',
        visaType: 'Express Entry',
        documents: [],
        userInfo: { name: 'User 2', email: 'user2@example.com' }
      };

      const configuredResult = await aiEvaluator.evaluate(configuredParams);
      const unconfiguredResult = await aiEvaluator.evaluate(unconfiguredParams);

      expect(Object.keys(configuredResult).sort()).toEqual(Object.keys(unconfiguredResult).sort());
      expect(typeof configuredResult.score).toBe(typeof unconfiguredResult.score);
      expect(typeof configuredResult.summary).toBe(typeof unconfiguredResult.summary);
      expect(Array.isArray(configuredResult.recommendations)).toBe(Array.isArray(unconfiguredResult.recommendations));
    });

    it('should not expose category scores for any visa type', async () => {
      const visaTypes = [
        { country: 'Ireland', visaType: 'Critical Skills Employment Permit' },
        { country: 'Canada', visaType: 'Express Entry' },
        { country: 'Unknown', visaType: 'Unknown' }
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

        const result = await aiEvaluator.evaluate(params);

        expect(result).not.toHaveProperty('categoryScores');
        expect(result).not.toHaveProperty('categoryBreakdown');
        expect(result).not.toHaveProperty('internalScores');
      }
    });
  });

  describe('Mixed Evaluation Scenarios', () => {
    it('should handle mix of configured and unconfigured visa types in sequence', async () => {
      const evaluations = [
        { country: 'Ireland', visaType: 'Critical Skills Employment Permit', hasConfig: true },
        { country: 'Canada', visaType: 'Express Entry', hasConfig: false },
        { country: 'Germany', visaType: 'EU Blue Card', hasConfig: true },
        { country: 'Australia', visaType: 'Skilled Independent', hasConfig: false }
      ];

      for (const evaluation of evaluations) {
        const criteria = getVisaCriteria(evaluation.country, evaluation.visaType);
        
        if (evaluation.hasConfig) {
          expect(criteria).toBeDefined();
        } else {
          expect(criteria).toBeNull();
        }

        const params: EvaluateParams = {
          country: evaluation.country,
          visaType: evaluation.visaType,
          documents: [],
          userInfo: {
            name: 'Test Applicant',
            email: 'test@example.com'
          }
        };

        const result = await aiEvaluator.evaluate(params);

        expect(result).toBeDefined();
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Error Handling and Robustness', () => {
    it('should handle empty country and visa type gracefully', async () => {
      const params: EvaluateParams = {
        country: '',
        visaType: '',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await aiEvaluator.evaluate(params);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle special characters in visa type names', async () => {
      const params: EvaluateParams = {
        country: 'Test Country',
        visaType: 'Test-Visa/Type (Special)',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await aiEvaluator.evaluate(params);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Consistency', () => {
    it('should maintain similar performance for configured and unconfigured visas', async () => {
      const configuredParams: EvaluateParams = {
        country: 'Ireland',
        visaType: 'Critical Skills Employment Permit',
        documents: [],
        userInfo: { name: 'User 1', email: 'user1@example.com' }
      };

      const unconfiguredParams: EvaluateParams = {
        country: 'Canada',
        visaType: 'Express Entry',
        documents: [],
        userInfo: { name: 'User 2', email: 'user2@example.com' }
      };

      const startConfigured = Date.now();
      await aiEvaluator.evaluate(configuredParams);
      const durationConfigured = Date.now() - startConfigured;

      const startUnconfigured = Date.now();
      await aiEvaluator.evaluate(unconfiguredParams);
      const durationUnconfigured = Date.now() - startUnconfigured;

      expect(durationConfigured).toBeLessThan(5000);
      expect(durationUnconfigured).toBeLessThan(5000);
    });
  });

  describe('Rule-Based Evaluator Backward Compatibility', () => {
    it('should maintain rule-based evaluation for unconfigured visas', async () => {
      const params: EvaluateParams = {
        country: 'Canada',
        visaType: 'Express Entry',
        documents: [],
        userInfo: {
          name: 'Test Applicant',
          email: 'test@example.com'
        }
      };

      const result = await ruleBasedEvaluator.evaluate(params);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.summary).toBeDefined();
    });

    it('should produce valid scores for all visa types', async () => {
      const visaTypes = [
        { country: 'Ireland', visaType: 'Critical Skills Employment Permit' },
        { country: 'Canada', visaType: 'Express Entry' },
        { country: 'Germany', visaType: 'EU Blue Card' },
        { country: 'Australia', visaType: 'Skilled Independent' }
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

        const result = await ruleBasedEvaluator.evaluate(params);

        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
        expect(isNaN(result.score)).toBe(false);
      }
    });
  });

  describe('Recommendations Quality', () => {
    it('should provide recommendations for both configured and unconfigured visas', async () => {
      const configuredParams: EvaluateParams = {
        country: 'Ireland',
        visaType: 'Critical Skills Employment Permit',
        documents: [],
        userInfo: { name: 'User 1', email: 'user1@example.com' }
      };

      const unconfiguredParams: EvaluateParams = {
        country: 'Canada',
        visaType: 'Express Entry',
        documents: [],
        userInfo: { name: 'User 2', email: 'user2@example.com' }
      };

      const configuredResult = await aiEvaluator.evaluate(configuredParams);
      const unconfiguredResult = await aiEvaluator.evaluate(unconfiguredParams);

      expect(configuredResult.recommendations).toBeDefined();
      expect(unconfiguredResult.recommendations).toBeDefined();
      expect(configuredResult.recommendations!.length).toBeGreaterThan(0);
      expect(unconfiguredResult.recommendations!.length).toBeGreaterThan(0);
    });
  });
});
