import { AIEvaluator } from '../services/evaluators/aiEvaluator';
import { DEFAULT_SCORING_CONFIG } from '../config/scoringCategories';
import { EvaluateParams } from '../services/evaluators/evaluatorInterface';

describe('AIEvaluator', () => {
  let evaluator: AIEvaluator;

  beforeAll(() => {
    evaluator = new AIEvaluator();
  });

  describe('buildCategoryScores', () => {
    it('should build category scores with correct weights', () => {
      const aiScores = [
        { category: 'Professional Qualifications', score: 80, reasoning: 'Good' },
        { category: 'Financial Stability', score: 70, reasoning: 'Adequate' },
        { category: 'Documentation Quality', score: 90, reasoning: 'Excellent' },
        { category: 'Language Proficiency', score: 75, reasoning: 'Good' },
        { category: 'Country-Specific Requirements', score: 65, reasoning: 'Fair' }
      ];

      const categoryScores = evaluator['buildCategoryScores'](
        aiScores,
        DEFAULT_SCORING_CONFIG
      );

      expect(categoryScores).toHaveLength(5);
      expect(categoryScores[0].category).toBe('Professional Qualifications');
      expect(categoryScores[0].score).toBe(80);
      expect(categoryScores[0].weight).toBe(30);
      expect(categoryScores[0].weightedScore).toBe(24); // 80 * 30 / 100
    });

    it('should handle missing category scores with defaults', () => {
      const aiScores = [
        { category: 'Professional Qualifications', score: 80, reasoning: 'Good' }
      ];

      const categoryScores = evaluator['buildCategoryScores'](
        aiScores,
        DEFAULT_SCORING_CONFIG
      );

      expect(categoryScores).toHaveLength(5);
      expect(categoryScores[1].score).toBe(50); // Default score
      expect(categoryScores[1].reasoning).toBe('No specific feedback provided');
    });

    it('should clamp scores to 0-100 range', () => {
      const aiScores = [
        { category: 'Professional Qualifications', score: 150, reasoning: 'Too high' },
        { category: 'Financial Stability', score: -10, reasoning: 'Too low' }
      ];

      const categoryScores = evaluator['buildCategoryScores'](
        aiScores,
        DEFAULT_SCORING_CONFIG
      );

      expect(categoryScores[0].score).toBe(100);
      expect(categoryScores[1].score).toBe(0);
    });
  });

  describe('calculateWeightedScore', () => {
    it('should calculate correct weighted score', () => {
      const categoryScores = [
        {
          category: 'Cat1',
          score: 80,
          weight: 50,
          weightedScore: 40,
          reasoning: 'Good'
        },
        {
          category: 'Cat2',
          score: 60,
          weight: 50,
          weightedScore: 30,
          reasoning: 'Fair'
        }
      ];

      const finalScore = evaluator['calculateWeightedScore'](categoryScores);
      expect(finalScore).toBe(70);
    });

    it('should handle all categories with same score', () => {
      const categoryScores = DEFAULT_SCORING_CONFIG.categories.map(cat => ({
        category: cat.name,
        score: 75,
        weight: cat.weight,
        weightedScore: (75 * cat.weight) / 100,
        reasoning: 'Consistent'
      }));

      const finalScore = evaluator['calculateWeightedScore'](categoryScores);
      expect(finalScore).toBe(75);
    });

    it('should handle zero scores', () => {
      const categoryScores = DEFAULT_SCORING_CONFIG.categories.map(cat => ({
        category: cat.name,
        score: 0,
        weight: cat.weight,
        weightedScore: 0,
        reasoning: 'None'
      }));

      const finalScore = evaluator['calculateWeightedScore'](categoryScores);
      expect(finalScore).toBe(0);
    });
  });

  describe('parseEnhancedResponse', () => {
    it('should parse valid JSON response', () => {
      const mockResponse: any = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                categoryScores: [
                  {
                    category: 'Professional Qualifications',
                    score: 85,
                    reasoning: 'Strong qualifications'
                  },
                  {
                    category: 'Financial Stability',
                    score: 75,
                    reasoning: 'Good financial backing'
                  },
                  {
                    category: 'Documentation Quality',
                    score: 90,
                    reasoning: 'Excellent documentation'
                  },
                  {
                    category: 'Language Proficiency',
                    score: 80,
                    reasoning: 'Good language skills'
                  },
                  {
                    category: 'Country-Specific Requirements',
                    score: 70,
                    reasoning: 'Meets requirements'
                  }
                ],
                summary: 'Strong application with good prospects',
                recommendations: ['Rec 1', 'Rec 2', 'Rec 3'],
                conclusion: 'High likelihood of approval'
              })
            }
          }
        ]
      };

      const result = evaluator['parseEnhancedResponse'](
        mockResponse,
        DEFAULT_SCORING_CONFIG
      );

      expect(result.score).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(result.summary).toBe('Strong application with good prospects');
      expect(result.recommendations).toHaveLength(3);
      expect(result.conclusion).toBe('High likelihood of approval');
    });

    it('should not expose category scores in result', () => {
      const mockResponse: any = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                categoryScores: [
                  { category: 'Test', score: 75, reasoning: 'Good' }
                ],
                summary: 'Test summary',
                recommendations: ['Rec 1'],
                conclusion: 'Test conclusion'
              })
            }
          }
        ]
      };

      const result = evaluator['parseEnhancedResponse'](
        mockResponse,
        DEFAULT_SCORING_CONFIG
      );

      expect(result).not.toHaveProperty('categoryScores');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('conclusion');
    });
  });

  describe('parseTextResponse', () => {
    it('should extract score from text', () => {
      const content = 'Score: 75\nSummary: Good application';

      const result = evaluator['parseTextResponse'](
        content,
        DEFAULT_SCORING_CONFIG
      );

      expect(result.score).toBe(75);
      expect(result.summary).toContain('Good application');
    });

    it('should provide default recommendations and conclusion', () => {
      const content = 'Score: 80\nSummary: Strong application';

      const result = evaluator['parseTextResponse'](
        content,
        DEFAULT_SCORING_CONFIG
      );

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations!.length).toBeGreaterThan(0);
      expect(result.conclusion).toBeDefined();
    });

    it('should handle missing score with default', () => {
      const content = 'Summary: Application review completed';

      const result = evaluator['parseTextResponse'](
        content,
        DEFAULT_SCORING_CONFIG
      );

      expect(result.score).toBe(50);
    });

    it('should clamp extracted score to valid range', () => {
      const content = 'Score: 150\nSummary: Test';

      const result = evaluator['parseTextResponse'](
        content,
        DEFAULT_SCORING_CONFIG
      );

      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('formatDocumentContent', () => {
    it('should format successful document parsing', () => {
      const parsedDocs = [
        {
          filename: 'doc1.pdf',
          originalName: 'resume.pdf',
          extractedText: 'Resume content here',
          documentType: 'PDF',
          success: true
        }
      ];

      const formatted = evaluator['formatDocumentContent'](parsedDocs);

      expect(formatted).toContain('resume.pdf');
      expect(formatted).toContain('PDF');
      expect(formatted).toContain('Resume content here');
    });

    it('should handle parsing failures', () => {
      const parsedDocs = [
        {
          filename: 'doc1.pdf',
          originalName: 'corrupt.pdf',
          extractedText: '',
          documentType: 'PDF',
          success: false,
          error: 'Parsing failed'
        }
      ];

      const formatted = evaluator['formatDocumentContent'](parsedDocs);

      expect(formatted).toContain('corrupt.pdf');
      expect(formatted).toContain('Parsing failed');
    });

    it('should truncate long text', () => {
      const longText = 'A'.repeat(2000);
      const parsedDocs = [
        {
          filename: 'doc1.txt',
          originalName: 'long.txt',
          extractedText: longText,
          documentType: 'TXT',
          success: true
        }
      ];

      const formatted = evaluator['formatDocumentContent'](parsedDocs);

      expect(formatted).toContain('[truncated]');
      expect(formatted.length).toBeLessThan(longText.length + 100);
    });

    it('should handle empty document list', () => {
      const formatted = evaluator['formatDocumentContent']([]);
      expect(formatted).toBe('No documents provided');
    });
  });

  describe('Mock Mode Functionality', () => {
    it('should return mock evaluation in mock mode', async () => {
      const params: EvaluateParams = {
        country: 'United States',
        visaType: 'O-1A',
        documents: [
          {
            filename: 'test.pdf',
            originalName: 'resume.pdf',
            path: '/path/to/test.pdf'
          }
        ],
        userInfo: {
          name: 'Test User',
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

    it('should not expose category scores in mock mode', async () => {
      const params: EvaluateParams = {
        country: 'Canada',
        visaType: 'Express Entry',
        documents: [],
        userInfo: {
          name: 'Test User',
          email: 'test@example.com'
        }
      };

      const result = await evaluator.evaluate(params);

      expect(result).not.toHaveProperty('categoryScores');
    });
  });
});
