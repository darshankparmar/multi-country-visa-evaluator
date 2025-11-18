import { CriteriaValidator, ApplicantData } from '../services/criteriaValidator';
import { SalaryThreshold, VisaCriteriaConfig } from '../config/visaCriteria';

describe('CriteriaValidator', () => {
  let validator: CriteriaValidator;

  beforeEach(() => {
    validator = new CriteriaValidator();
  });

  describe('validateSalary', () => {
    it('should validate salary above single threshold', () => {
      const thresholds: SalaryThreshold[] = [
        { amount: 38000, currency: 'EUR', period: 'annual' }
      ];

      const result = validator.validateSalary(
        40000,
        'EUR',
        'annual',
        thresholds
      );

      expect(result.met).toBe(true);
      expect(result.score).toBe(100);
      expect(result.details).toContain('meets the requirement');
    });

    it('should validate salary below threshold', () => {
      const thresholds: SalaryThreshold[] = [
        { amount: 38000, currency: 'EUR', period: 'annual' }
      ];

      const result = validator.validateSalary(
        35000,
        'EUR',
        'annual',
        thresholds
      );

      expect(result.met).toBe(false);
      expect(result.score).toBeLessThan(100);
      expect(result.recommendation).toContain('38,000');
    });

    it('should handle multiple thresholds and select lowest', () => {
      const thresholds: SalaryThreshold[] = [
        { amount: 64000, currency: 'EUR', period: 'annual', conditions: 'for other occupations' },
        { amount: 38000, currency: 'EUR', period: 'annual', conditions: 'for critical occupations' }
      ];

      const result = validator.validateSalary(
        40000,
        'EUR',
        'annual',
        thresholds
      );

      expect(result.met).toBe(true);
      expect(result.details).toContain('38,000');
    });

    it('should handle age-based thresholds', () => {
      const thresholds: SalaryThreshold[] = [
        { amount: 5688, currency: 'EUR', period: 'monthly', conditions: 'if 30 years or older' },
        { amount: 4171, currency: 'EUR', period: 'monthly', conditions: 'if under 30 years old' }
      ];

      const result = validator.validateSalary(
        4500,
        'EUR',
        'monthly',
        thresholds,
        25
      );

      expect(result.met).toBe(true);
      expect(result.details).toContain('4,171');
    });

    it('should normalize monthly to annual salary', () => {
      const thresholds: SalaryThreshold[] = [
        { amount: 38000, currency: 'EUR', period: 'annual' }
      ];

      const result = validator.validateSalary(
        3500,
        'EUR',
        'monthly',
        thresholds
      );

      expect(result.met).toBe(true);
      expect(result.score).toBe(100);
    });

    it('should handle missing salary data', () => {
      const thresholds: SalaryThreshold[] = [
        { amount: 38000, currency: 'EUR', period: 'annual' }
      ];

      const result = validator.validateSalary(
        undefined,
        undefined,
        undefined,
        thresholds
      );

      expect(result.met).toBe(false);
      expect(result.score).toBe(0);
      expect(result.recommendation).toContain('provide');
    });

    it('should handle no thresholds defined', () => {
      const result = validator.validateSalary(
        50000,
        'USD',
        'annual',
        []
      );

      expect(result.met).toBe(true);
      expect(result.score).toBe(100);
      expect(result.details).toContain('No specific salary requirement');
    });
  });

  describe('validateEducation', () => {
    it('should validate Bachelor meets Bachelor requirement', () => {
      const result = validator.validateEducation(
        'Bachelor of Science',
        'Bachelor'
      );

      expect(result.met).toBe(true);
      expect(result.score).toBe(100);
      expect(result.details).toContain('meets the requirement');
    });

    it('should validate Master exceeds Bachelor requirement', () => {
      const result = validator.validateEducation(
        'Master of Science',
        'Bachelor'
      );

      expect(result.met).toBe(true);
      expect(result.score).toBe(100);
      expect(result.details).toContain('exceeds');
    });

    it('should validate Bachelor below Master requirement', () => {
      const result = validator.validateEducation(
        'Bachelor',
        'Master'
      );

      expect(result.met).toBe(false);
      expect(result.score).toBeLessThan(100);
      expect(result.recommendation).toContain('Master');
    });

    it('should handle alternative qualification with sufficient experience', () => {
      const result = validator.validateEducation(
        'High School',
        'Bachelor',
        '3 years experience per year of education',
        6
      );

      expect(result.met).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.details).toContain('alternative qualification');
    });

    it('should handle alternative qualification with insufficient experience', () => {
      const result = validator.validateEducation(
        'High School',
        'Bachelor',
        '3 years experience per year of education',
        2
      );

      expect(result.met).toBe(false);
      expect(result.recommendation).toBeDefined();
    });

    it('should handle missing education data', () => {
      const result = validator.validateEducation(
        undefined,
        'Bachelor'
      );

      expect(result.met).toBe(false);
      expect(result.score).toBe(0);
      expect(result.recommendation).toContain('Bachelor');
    });

    it('should handle no education requirement', () => {
      const result = validator.validateEducation(
        'High School',
        'None'
      );

      expect(result.met).toBe(true);
      expect(result.score).toBe(100);
      expect(result.details).toContain('No specific education requirement');
    });

    it('should recognize various education formats', () => {
      const formats = [
        'Bachelor of Science',
        'BSc Computer Science',
        'Undergraduate degree',
        'BA in Economics'
      ];

      formats.forEach(format => {
        const result = validator.validateEducation(format, 'Bachelor');
        expect(result.met).toBe(true);
      });
    });

    it('should recognize PhD formats', () => {
      const formats = [
        'PhD in Physics',
        'Doctorate in Medicine',
        'Doctoral degree'
      ];

      formats.forEach(format => {
        const result = validator.validateEducation(format, 'Bachelor');
        expect(result.met).toBe(true);
        expect(result.details).toContain('exceeds');
      });
    });
  });

  describe('validateExperience', () => {
    it('should validate experience meeting requirement', () => {
      const result = validator.validateExperience(5, 3);

      expect(result.met).toBe(true);
      expect(result.score).toBeGreaterThan(80);
      expect(result.details).toContain('exceeds');
    });

    it('should validate experience exactly meeting requirement', () => {
      const result = validator.validateExperience(3, 3);

      expect(result.met).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.details).toContain('meets');
    });

    it('should validate experience below requirement', () => {
      const result = validator.validateExperience(2, 5);

      expect(result.met).toBe(false);
      expect(result.score).toBeLessThan(80);
      expect(result.recommendation).toContain('more year');
    });

    it('should award bonus points for exceeding requirement', () => {
      const resultExact = validator.validateExperience(3, 3);
      const resultExcess = validator.validateExperience(8, 3);

      expect(resultExcess.score).toBeGreaterThan(resultExact.score);
    });

    it('should handle missing experience data', () => {
      const result = validator.validateExperience(undefined, 3);

      expect(result.met).toBe(false);
      expect(result.score).toBe(0);
      expect(result.recommendation).toContain('3 year');
    });

    it('should handle no experience requirement', () => {
      const result = validator.validateExperience(2, 0);

      expect(result.met).toBe(true);
      expect(result.score).toBe(100);
      expect(result.details).toContain('No specific experience requirement');
    });

    it('should handle undefined experience requirement', () => {
      const result = validator.validateExperience(5, undefined);

      expect(result.met).toBe(true);
      expect(result.score).toBe(100);
    });
  });

  describe('validateAllCriteria', () => {
    it('should validate all criteria for Ireland Critical Skills', () => {
      const applicantData: ApplicantData = {
        name: 'Test User',
        email: 'test@example.com',
        salary: 40000,
        salaryCurrency: 'EUR',
        salaryPeriod: 'annual',
        education: 'Bachelor of Science',
        experienceYears: 3
      };

      const visaCriteria: VisaCriteriaConfig = {
        country: 'Ireland',
        visaType: 'Critical Skills Employment Permit',
        description: 'Test',
        salaryThresholds: [
          { amount: 38000, currency: 'EUR', period: 'annual' }
        ],
        educationLevel: 'Bachelor',
        experienceYears: 0,
        laborMarketTestRequired: false,
        sponsorRequired: true
      };

      const results = validator.validateAllCriteria(applicantData, visaCriteria);

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.criterion === 'Salary')).toBe(true);
      expect(results.some(r => r.criterion === 'Education')).toBe(true);
    });

    it('should return validation results for each criterion', () => {
      const applicantData: ApplicantData = {
        name: 'Test User',
        email: 'test@example.com',
        salary: 50000,
        salaryCurrency: 'EUR',
        salaryPeriod: 'annual',
        education: 'Master',
        experienceYears: 5
      };

      const visaCriteria: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test Visa',
        description: 'Test',
        salaryThresholds: [
          { amount: 40000, currency: 'EUR', period: 'annual' }
        ],
        educationLevel: 'Bachelor',
        experienceYears: 3,
        laborMarketTestRequired: false,
        sponsorRequired: false
      };

      const results = validator.validateAllCriteria(applicantData, visaCriteria);

      expect(results).toHaveLength(3);
      
      const salaryResult = results.find(r => r.criterion === 'Salary');
      expect(salaryResult?.met).toBe(true);
      
      const educationResult = results.find(r => r.criterion === 'Education');
      expect(educationResult?.met).toBe(true);
      
      const experienceResult = results.find(r => r.criterion === 'Experience');
      expect(experienceResult?.met).toBe(true);
    });

    it('should handle missing applicant data', () => {
      const applicantData: ApplicantData = {
        name: 'Test User',
        email: 'test@example.com'
      };

      const visaCriteria: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test Visa',
        description: 'Test',
        salaryThresholds: [
          { amount: 40000, currency: 'EUR', period: 'annual' }
        ],
        educationLevel: 'Bachelor',
        experienceYears: 3,
        laborMarketTestRequired: false,
        sponsorRequired: false
      };

      const results = validator.validateAllCriteria(applicantData, visaCriteria);

      expect(results).toHaveLength(3);
      expect(results.every(r => !r.met)).toBe(true);
      expect(results.every(r => r.recommendation)).toBe(true);
    });

    it('should skip criteria not defined in visa config', () => {
      const applicantData: ApplicantData = {
        name: 'Test User',
        email: 'test@example.com',
        salary: 50000,
        salaryCurrency: 'USD',
        salaryPeriod: 'annual'
      };

      const visaCriteria: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test Visa',
        description: 'Test',
        laborMarketTestRequired: false,
        sponsorRequired: false
      };

      const results = validator.validateAllCriteria(applicantData, visaCriteria);

      expect(results).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero salary', () => {
      const thresholds: SalaryThreshold[] = [
        { amount: 38000, currency: 'EUR', period: 'annual' }
      ];

      const result = validator.validateSalary(
        0,
        'EUR',
        'annual',
        thresholds
      );

      expect(result.met).toBe(false);
      expect(result.score).toBe(0);
    });

    it('should handle very high salary exceeding threshold', () => {
      const thresholds: SalaryThreshold[] = [
        { amount: 38000, currency: 'EUR', period: 'annual' }
      ];

      const result = validator.validateSalary(
        100000,
        'EUR',
        'annual',
        thresholds
      );

      expect(result.met).toBe(true);
      expect(result.score).toBe(100);
      expect(result.details).toContain('Exceeds threshold');
    });

    it('should handle zero experience', () => {
      const result = validator.validateExperience(0, 3);

      expect(result.met).toBe(false);
      expect(result.score).toBe(0);
    });

    it('should handle fractional experience years', () => {
      const result = validator.validateExperience(2.5, 2);

      expect(result.met).toBe(true);
      expect(result.score).toBeGreaterThan(80);
    });
  });
});
