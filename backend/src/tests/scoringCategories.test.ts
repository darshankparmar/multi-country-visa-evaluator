import {
  DEFAULT_SCORING_CONFIG,
  VISA_SPECIFIC_CONFIGS,
  getScoringConfig,
  validateScoringConfig,
  VisaScoringConfig
} from '../config/scoringCategories';

describe('Scoring Categories Configuration', () => {
  describe('Default Configuration', () => {
    it('should have exactly 5 categories', () => {
      expect(DEFAULT_SCORING_CONFIG.categories).toHaveLength(5);
    });

    it('should have weights that sum to 100', () => {
      const totalWeight = DEFAULT_SCORING_CONFIG.categories.reduce(
        (sum, cat) => sum + cat.weight,
        0
      );
      expect(totalWeight).toBe(100);
    });

    it('should have all required category properties', () => {
      DEFAULT_SCORING_CONFIG.categories.forEach(category => {
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('weight');
        expect(category).toHaveProperty('description');
        expect(typeof category.name).toBe('string');
        expect(typeof category.weight).toBe('number');
        expect(typeof category.description).toBe('string');
        expect(category.name.length).toBeGreaterThan(0);
        expect(category.weight).toBeGreaterThan(0);
        expect(category.description.length).toBeGreaterThan(0);
      });
    });

    it('should include expected category names', () => {
      const categoryNames = DEFAULT_SCORING_CONFIG.categories.map(c => c.name);
      expect(categoryNames).toContain('Professional Qualifications');
      expect(categoryNames).toContain('Financial Stability');
      expect(categoryNames).toContain('Documentation Quality');
      expect(categoryNames).toContain('Language Proficiency');
      expect(categoryNames).toContain('Country-Specific Requirements');
    });

    it('should have Professional Qualifications with highest weight', () => {
      const profQual = DEFAULT_SCORING_CONFIG.categories.find(
        c => c.name === 'Professional Qualifications'
      );
      expect(profQual).toBeDefined();
      expect(profQual!.weight).toBe(30);
    });
  });

  describe('Visa-Specific Configurations', () => {
    it('should have United States O-1A configuration', () => {
      const config = VISA_SPECIFIC_CONFIGS['United States-O-1A'];
      expect(config).toBeDefined();
      expect(config.categories).toHaveLength(5);
    });

    it('should have O-1A weights sum to 100', () => {
      const config = VISA_SPECIFIC_CONFIGS['United States-O-1A'];
      const totalWeight = config.categories.reduce(
        (sum, cat) => sum + cat.weight,
        0
      );
      expect(totalWeight).toBe(100);
    });

    it('should have O-1A with higher Professional Qualifications weight', () => {
      const config = VISA_SPECIFIC_CONFIGS['United States-O-1A'];
      const profQual = config.categories.find(
        c => c.name === 'Professional Qualifications'
      );
      expect(profQual).toBeDefined();
      expect(profQual!.weight).toBe(40);
      expect(profQual!.weight).toBeGreaterThan(
        DEFAULT_SCORING_CONFIG.categories.find(
          c => c.name === 'Professional Qualifications'
        )!.weight
      );
    });

    it('should validate all visa-specific configurations', () => {
      Object.entries(VISA_SPECIFIC_CONFIGS).forEach(([, config]) => {
        expect(() => validateScoringConfig(config)).not.toThrow();
      });
    });
  });

  describe('getScoringConfig', () => {
    it('should return default config for unknown visa type', () => {
      const config = getScoringConfig('Unknown Country', 'Unknown Visa');
      expect(config).toEqual(DEFAULT_SCORING_CONFIG);
    });

    it('should return specific config for United States O-1A', () => {
      const config = getScoringConfig('United States', 'O-1A');
      expect(config).toEqual(VISA_SPECIFIC_CONFIGS['United States-O-1A']);
      expect(config).not.toEqual(DEFAULT_SCORING_CONFIG);
    });

    it('should return default config for United States with different visa type', () => {
      const config = getScoringConfig('United States', 'H-1B');
      expect(config).toEqual(DEFAULT_SCORING_CONFIG);
    });

    it('should handle case-sensitive matching', () => {
      const config = getScoringConfig('united states', 'o-1a');
      expect(config).toEqual(DEFAULT_SCORING_CONFIG);
    });
  });

  describe('validateScoringConfig', () => {
    it('should validate config with weights summing to 100', () => {
      const validConfig: VisaScoringConfig = {
        categories: [
          { name: 'Cat1', weight: 50, description: 'Test' },
          { name: 'Cat2', weight: 50, description: 'Test' }
        ]
      };
      expect(() => validateScoringConfig(validConfig)).not.toThrow();
    });

    it('should throw error for weights not summing to 100', () => {
      const invalidConfig: VisaScoringConfig = {
        categories: [
          { name: 'Cat1', weight: 50, description: 'Test' },
          { name: 'Cat2', weight: 40, description: 'Test' }
        ]
      };
      expect(() => validateScoringConfig(invalidConfig)).toThrow(
        'Scoring category weights must sum to 100%'
      );
    });

    it('should throw error for weights summing over 100', () => {
      const invalidConfig: VisaScoringConfig = {
        categories: [
          { name: 'Cat1', weight: 60, description: 'Test' },
          { name: 'Cat2', weight: 50, description: 'Test' }
        ]
      };
      expect(() => validateScoringConfig(invalidConfig)).toThrow();
    });

    it('should handle floating point precision', () => {
      const validConfig: VisaScoringConfig = {
        categories: [
          { name: 'Cat1', weight: 33.33, description: 'Test' },
          { name: 'Cat2', weight: 33.33, description: 'Test' },
          { name: 'Cat3', weight: 33.34, description: 'Test' }
        ]
      };
      expect(() => validateScoringConfig(validConfig)).not.toThrow();
    });
  });

  describe('Configuration Integrity', () => {
    it('should have unique category names in default config', () => {
      const names = DEFAULT_SCORING_CONFIG.categories.map(c => c.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have all weights as positive numbers', () => {
      DEFAULT_SCORING_CONFIG.categories.forEach(category => {
        expect(category.weight).toBeGreaterThan(0);
        expect(category.weight).toBeLessThanOrEqual(100);
      });
    });

    it('should have non-empty descriptions', () => {
      DEFAULT_SCORING_CONFIG.categories.forEach(category => {
        expect(category.description.trim().length).toBeGreaterThan(0);
      });
    });
  });
});
