import { 
  getVisaCriteria, 
  validateVisaCriteriaConfig, 
  VISA_CRITERIA_CONFIGS,
  VisaCriteriaConfig 
} from '../config/visaCriteria';

describe('Visa Criteria Configuration', () => {
  describe('getVisaCriteria', () => {
    it('should load Ireland Critical Skills criteria', () => {
      const criteria = getVisaCriteria('Ireland', 'Critical Skills Employment Permit');
      
      expect(criteria).toBeDefined();
      expect(criteria?.country).toBe('Ireland');
      expect(criteria?.visaType).toBe('Critical Skills Employment Permit');
      expect(criteria?.salaryThresholds).toHaveLength(2);
      expect(criteria?.laborMarketTestRequired).toBe(false);
      expect(criteria?.sponsorRequired).toBe(true);
    });

    it('should load Ireland General Employment Permit criteria', () => {
      const criteria = getVisaCriteria('Ireland', 'General Employment Permit');
      
      expect(criteria).toBeDefined();
      expect(criteria?.country).toBe('Ireland');
      expect(criteria?.salaryThresholds).toHaveLength(1);
      expect(criteria?.salaryThresholds?.[0].amount).toBe(30000);
      expect(criteria?.laborMarketTestRequired).toBe(true);
    });

    it('should load Netherlands Knowledge Migrant Permit criteria', () => {
      const criteria = getVisaCriteria('Netherlands', 'Knowledge Migrant Permit');
      
      expect(criteria).toBeDefined();
      expect(criteria?.country).toBe('Netherlands');
      expect(criteria?.salaryThresholds).toHaveLength(3);
      expect(criteria?.educationLevel).toBe('Bachelor');
      expect(criteria?.laborMarketTestRequired).toBe(false);
    });

    it('should load Netherlands Orientation Year Permit criteria', () => {
      const criteria = getVisaCriteria('Netherlands', 'Orientation Year Permit');
      
      expect(criteria).toBeDefined();
      expect(criteria?.sponsorRequired).toBe(false);
      expect(criteria?.educationLevel).toBe('Bachelor');
    });

    it('should load Germany EU Blue Card criteria', () => {
      const criteria = getVisaCriteria('Germany', 'EU Blue Card');
      
      expect(criteria).toBeDefined();
      expect(criteria?.country).toBe('Germany');
      expect(criteria?.salaryThresholds).toHaveLength(2);
      expect(criteria?.educationLevel).toBe('Bachelor');
      expect(criteria?.laborMarketTestRequired).toBe(false);
    });

    it('should load Germany ICT Permit criteria', () => {
      const criteria = getVisaCriteria('Germany', 'ICT Permit');
      
      expect(criteria).toBeDefined();
      expect(criteria?.experienceYears).toBe(0.5);
      expect(criteria?.laborMarketTestRequired).toBe(false);
    });

    it('should load France Talent Passport criteria', () => {
      const criteria = getVisaCriteria('France', 'Talent Passport');
      
      expect(criteria).toBeDefined();
      expect(criteria?.educationLevel).toBe('Master');
      expect(criteria?.alternativeQualification).toContain('5 years');
      expect(criteria?.laborMarketTestRequired).toBe(false);
    });

    it('should load France Salarié en Mission criteria', () => {
      const criteria = getVisaCriteria('France', 'Salarié en Mission');
      
      expect(criteria).toBeDefined();
      expect(criteria?.sponsorRequired).toBe(true);
      expect(criteria?.laborMarketTestRequired).toBe(false);
    });

    it('should load United States O-1A Visa criteria', () => {
      const criteria = getVisaCriteria('United States', 'O-1A Visa');
      
      expect(criteria).toBeDefined();
      expect(criteria?.educationLevel).toBe('None');
      expect(criteria?.alternativeQualification?.toLowerCase()).toContain('extraordinary ability');
      expect(criteria?.laborMarketTestRequired).toBe(false);
    });

    it('should load United States H-1B Visa criteria', () => {
      const criteria = getVisaCriteria('United States', 'H-1B Visa');
      
      expect(criteria).toBeDefined();
      expect(criteria?.educationLevel).toBe('Bachelor');
      expect(criteria?.laborMarketTestRequired).toBe(true);
      expect(criteria?.sponsorRequired).toBe(true);
    });

    it('should load Poland Work Permit Type A criteria', () => {
      const criteria = getVisaCriteria('Poland', 'Work Permit Type A');
      
      expect(criteria).toBeDefined();
      expect(criteria?.laborMarketTestRequired).toBe(true);
      expect(criteria?.sponsorRequired).toBe(true);
    });

    it('should load Poland Work Permit Type C criteria', () => {
      const criteria = getVisaCriteria('Poland', 'Work Permit Type C');
      
      expect(criteria).toBeDefined();
      expect(criteria?.laborMarketTestRequired).toBe(false);
      expect(criteria?.sponsorRequired).toBe(true);
    });

    it('should return null for unknown visa type', () => {
      const criteria = getVisaCriteria('Unknown Country', 'Unknown Visa');
      
      expect(criteria).toBeNull();
    });

    it('should return null for valid country but unknown visa type', () => {
      const criteria = getVisaCriteria('Ireland', 'Non-Existent Visa');
      
      expect(criteria).toBeNull();
    });
  });

  describe('Salary Thresholds Configuration', () => {
    it('should have correct salary thresholds for Ireland Critical Skills', () => {
      const criteria = getVisaCriteria('Ireland', 'Critical Skills Employment Permit');
      
      expect(criteria?.salaryThresholds).toBeDefined();
      expect(criteria?.salaryThresholds?.[0].amount).toBe(38000);
      expect(criteria?.salaryThresholds?.[0].currency).toBe('EUR');
      expect(criteria?.salaryThresholds?.[0].period).toBe('annual');
      expect(criteria?.salaryThresholds?.[1].amount).toBe(64000);
    });

    it('should have correct salary thresholds for Netherlands Knowledge Migrant', () => {
      const criteria = getVisaCriteria('Netherlands', 'Knowledge Migrant Permit');
      
      expect(criteria?.salaryThresholds).toBeDefined();
      expect(criteria?.salaryThresholds?.[0].amount).toBe(5688);
      expect(criteria?.salaryThresholds?.[0].period).toBe('monthly');
      expect(criteria?.salaryThresholds?.[1].amount).toBe(4171);
      expect(criteria?.salaryThresholds?.[2].amount).toBe(2989);
    });

    it('should have correct salary thresholds for Germany EU Blue Card', () => {
      const criteria = getVisaCriteria('Germany', 'EU Blue Card');
      
      expect(criteria?.salaryThresholds).toBeDefined();
      expect(criteria?.salaryThresholds?.[0].amount).toBe(48300);
      expect(criteria?.salaryThresholds?.[0].currency).toBe('EUR');
      expect(criteria?.salaryThresholds?.[1].amount).toBe(43760);
    });

    it('should have salary threshold conditions where applicable', () => {
      const criteria = getVisaCriteria('Ireland', 'Critical Skills Employment Permit');
      
      expect(criteria?.salaryThresholds?.[0].conditions).toContain('critical occupations');
      expect(criteria?.salaryThresholds?.[1].conditions).toContain('other eligible occupations');
    });
  });

  describe('Education Requirements Configuration', () => {
    it('should have Bachelor requirement for Ireland Critical Skills', () => {
      const criteria = getVisaCriteria('Ireland', 'Critical Skills Employment Permit');
      
      expect(criteria?.educationLevel).toBe('Bachelor');
      expect(criteria?.alternativeQualification).toBeDefined();
    });

    it('should have Master requirement for France Talent Passport', () => {
      const criteria = getVisaCriteria('France', 'Talent Passport');
      
      expect(criteria?.educationLevel).toBe('Master');
      expect(criteria?.alternativeQualification).toContain('5 years');
    });

    it('should have None requirement for US O-1A', () => {
      const criteria = getVisaCriteria('United States', 'O-1A Visa');
      
      expect(criteria?.educationLevel).toBe('None');
      expect(criteria?.alternativeQualification?.toLowerCase()).toContain('extraordinary ability');
    });

    it('should have Bachelor requirement for US H-1B', () => {
      const criteria = getVisaCriteria('United States', 'H-1B Visa');
      
      expect(criteria?.educationLevel).toBe('Bachelor');
      expect(criteria?.alternativeQualification).toContain('experience');
    });
  });

  describe('Experience Requirements Configuration', () => {
    it('should have 0 experience requirement for most visa types', () => {
      const criteria = getVisaCriteria('Ireland', 'Critical Skills Employment Permit');
      
      expect(criteria?.experienceYears).toBe(0);
    });

    it('should have 0.5 years experience for Germany ICT', () => {
      const criteria = getVisaCriteria('Germany', 'ICT Permit');
      
      expect(criteria?.experienceYears).toBe(0.5);
    });
  });

  describe('validateVisaCriteriaConfig', () => {
    it('should validate a correct configuration', () => {
      const validConfig: VisaCriteriaConfig = {
        country: 'Test Country',
        visaType: 'Test Visa',
        description: 'Test description',
        laborMarketTestRequired: false,
        sponsorRequired: true,
        salaryThresholds: [
          {
            amount: 50000,
            currency: 'USD',
            period: 'annual'
          }
        ],
        educationLevel: 'Bachelor',
        experienceYears: 2,
        criteriaWeights: {
          salary: 30,
          education: 25,
          experience: 20,
          documentation: 15,
          other: 10
        }
      };

      const errors = validateVisaCriteriaConfig(validConfig);
      
      expect(errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidConfig: any = {
        country: '',
        visaType: 'Test Visa',
        description: 'Test'
      };

      const errors = validateVisaCriteriaConfig(invalidConfig);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('Country'))).toBe(true);
    });

    it('should detect invalid salary threshold', () => {
      const invalidConfig: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test',
        description: 'Test',
        laborMarketTestRequired: false,
        sponsorRequired: false,
        salaryThresholds: [
          {
            amount: -1000,
            currency: 'USD',
            period: 'annual'
          }
        ]
      };

      const errors = validateVisaCriteriaConfig(invalidConfig);
      
      expect(errors.some(e => e.includes('non-negative'))).toBe(true);
    });

    it('should detect invalid education level', () => {
      const invalidConfig: any = {
        country: 'Test',
        visaType: 'Test',
        description: 'Test',
        laborMarketTestRequired: false,
        sponsorRequired: false,
        educationLevel: 'Invalid Level'
      };

      const errors = validateVisaCriteriaConfig(invalidConfig);
      
      expect(errors.some(e => e.includes('educationLevel'))).toBe(true);
    });

    it('should detect invalid criteria weights sum', () => {
      const invalidConfig: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test',
        description: 'Test',
        laborMarketTestRequired: false,
        sponsorRequired: false,
        criteriaWeights: {
          salary: 30,
          education: 30,
          experience: 30,
          documentation: 30,
          other: 30
        }
      };

      const errors = validateVisaCriteriaConfig(invalidConfig);
      
      expect(errors.some(e => e.includes('sum to 100'))).toBe(true);
    });
  });

  describe('All Configured Visa Types', () => {
    it('should have valid configurations for all visa types', () => {
      const allConfigs = Object.entries(VISA_CRITERIA_CONFIGS);
      
      expect(allConfigs.length).toBeGreaterThan(0);
      
      allConfigs.forEach(([key, config]) => {
        const errors = validateVisaCriteriaConfig(config);
        
        if (errors.length > 0) {
          console.error(`Invalid configuration for ${key}:`, errors);
        }
        
        expect(errors).toHaveLength(0);
      });
    });

    it('should have at least 12 visa types configured', () => {
      const configCount = Object.keys(VISA_CRITERIA_CONFIGS).length;
      
      expect(configCount).toBeGreaterThanOrEqual(12);
    });
  });
});
