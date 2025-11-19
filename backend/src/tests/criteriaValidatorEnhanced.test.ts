import { CriteriaValidator, ApplicantData } from '../services/criteriaValidator'
import { SalaryThreshold, VisaCriteriaConfig } from '../config/visaCriteria'

describe('CriteriaValidator - Enhanced Features', () => {
  let validator: CriteriaValidator

  beforeEach(() => {
    validator = new CriteriaValidator()
  })

  describe('validateSalary - Evidence Extraction', () => {
    it('should extract evidence from salary validation', () => {
      const thresholds: SalaryThreshold[] = [
        { amount: 38000, currency: 'EUR', period: 'annual' }
      ]

      const result = validator.validateSalary(
        40000,
        'EUR',
        'annual',
        thresholds,
        undefined,
        undefined,
        undefined,
        'employment_contract.pdf'
      )

      expect(result.evidence).toBeDefined()
      expect(result.evidence).toHaveLength(3)
      expect(result.evidence?.[0]).toContain('40,000')
      expect(result.evidence?.[0]).toContain('EUR')
      expect(result.evidence?.[0]).toContain('annual')
      expect(result.evidence?.[1]).toContain('38,000')
      expect(result.evidence?.[2]).toContain('105.3%') // Percentage of threshold
    })

    it('should set sourceDocument when provided', () => {
      const thresholds: SalaryThreshold[] = [
        { amount: 38000, currency: 'EUR', period: 'annual' }
      ]

      const result = validator.validateSalary(
        40000,
        'EUR',
        'annual',
        thresholds,
        undefined,
        undefined,
        undefined,
        'employment_contract.pdf'
      )

      expect(result.sourceDocument).toBe('employment_contract.pdf')
    })

    it('should set isCritical flag when salary is critical requirement', () => {
      const thresholds: SalaryThreshold[] = [
        { amount: 38000, currency: 'EUR', period: 'annual' }
      ]

      const visaCriteria: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test Visa',
        description: 'Test',
        laborMarketTestRequired: false,
        sponsorRequired: false,
        criticalRequirements: {
          requirements: ['salary'],
          penalties: {
            salary: 35
          }
        }
      }

      const result = validator.validateSalary(
        40000,
        'EUR',
        'annual',
        thresholds,
        undefined,
        undefined,
        visaCriteria
      )

      expect(result.isCritical).toBe(true)
    })

    it('should set isCritical to false when salary is not critical', () => {
      const thresholds: SalaryThreshold[] = [
        { amount: 38000, currency: 'EUR', period: 'annual' }
      ]

      const visaCriteria: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test Visa',
        description: 'Test',
        laborMarketTestRequired: false,
        sponsorRequired: false,
        criticalRequirements: {
          requirements: ['education'],
          penalties: {
            education: 30
          }
        }
      }

      const result = validator.validateSalary(
        40000,
        'EUR',
        'annual',
        thresholds,
        undefined,
        undefined,
        visaCriteria
      )

      expect(result.isCritical).toBe(false)
    })

    it('should set missingReason to not_found when salary data missing', () => {
      const thresholds: SalaryThreshold[] = [
        { amount: 38000, currency: 'EUR', period: 'annual' }
      ]

      const result = validator.validateSalary(
        undefined,
        undefined,
        undefined,
        thresholds
      )

      expect(result.missingReason).toBe('not_found')
      expect(result.met).toBe(false)
      expect(result.evidence).toEqual([])
    })

    it('should set missingReason to insufficient when salary below threshold', () => {
      const thresholds: SalaryThreshold[] = [
        { amount: 38000, currency: 'EUR', period: 'annual' }
      ]

      const result = validator.validateSalary(
        30000,
        'EUR',
        'annual',
        thresholds
      )

      expect(result.missingReason).toBe('insufficient')
      expect(result.met).toBe(false)
    })

    it('should set missingReason to not_applicable when no thresholds defined', () => {
      const result = validator.validateSalary(
        40000,
        'EUR',
        'annual',
        []
      )

      expect(result.missingReason).toBe('not_applicable')
      expect(result.met).toBe(true)
    })

    it('should include threshold conditions in evidence', () => {
      const thresholds: SalaryThreshold[] = [
        { 
          amount: 38000, 
          currency: 'EUR', 
          period: 'annual',
          conditions: 'for critical occupations'
        }
      ]

      const result = validator.validateSalary(
        40000,
        'EUR',
        'annual',
        thresholds
      )

      expect(result.evidence?.[1]).toContain('for critical occupations')
    })
  })

  describe('validateEducation - Evidence Extraction', () => {
    it('should extract evidence from education validation', () => {
      const result = validator.validateEducation(
        'Bachelor of Science',
        'Bachelor',
        undefined,
        undefined,
        undefined,
        'degree_certificate.pdf'
      )

      expect(result.evidence).toBeDefined()
      expect(result.evidence).toHaveLength(2)
      expect(result.evidence?.[0]).toContain('Bachelor')
      expect(result.evidence?.[1]).toContain('Bachelor')
    })

    it('should set sourceDocument when provided', () => {
      const result = validator.validateEducation(
        'Master of Science',
        'Bachelor',
        undefined,
        undefined,
        undefined,
        'degree_certificate.pdf'
      )

      expect(result.sourceDocument).toBe('degree_certificate.pdf')
    })

    it('should set isCritical flag when education is critical requirement', () => {
      const visaCriteria: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test Visa',
        description: 'Test',
        laborMarketTestRequired: false,
        sponsorRequired: false,
        criticalRequirements: {
          requirements: ['education'],
          penalties: {
            education: 30
          }
        }
      }

      const result = validator.validateEducation(
        'Bachelor',
        'Bachelor',
        undefined,
        undefined,
        visaCriteria
      )

      expect(result.isCritical).toBe(true)
    })

    it('should set missingReason to not_found when education data missing', () => {
      const result = validator.validateEducation(
        undefined,
        'Bachelor'
      )

      expect(result.missingReason).toBe('not_found')
      expect(result.met).toBe(false)
      expect(result.evidence).toEqual([])
    })

    it('should set missingReason to insufficient when education below requirement', () => {
      const result = validator.validateEducation(
        'High School',
        'Bachelor'
      )

      expect(result.missingReason).toBe('insufficient')
      expect(result.met).toBe(false)
    })

    it('should set missingReason to not_applicable when no education requirement', () => {
      const result = validator.validateEducation(
        'Bachelor',
        'None'
      )

      expect(result.missingReason).toBe('not_applicable')
      expect(result.met).toBe(true)
    })

    it('should include alternative qualification in evidence when applicable', () => {
      const result = validator.validateEducation(
        'High School',
        'Bachelor',
        '3 years experience per year of education',
        6
      )

      expect(result.evidence).toBeDefined()
      expect(result.evidence?.some(e => e.includes('6 years'))).toBe(true)
      expect(result.evidence?.some(e => e.includes('alternative qualification'))).toBe(true)
    })

    it('should extract degree level from various formats', () => {
      const formats = [
        { input: 'Bachelor of Science', expected: 'Bachelor' },
        { input: 'BSc Computer Science', expected: 'Bachelor' },
        { input: 'Master of Arts', expected: 'Master' },
        { input: 'PhD in Physics', expected: 'PhD' }
      ]

      formats.forEach(({ input, expected }) => {
        const result = validator.validateEducation(input, 'Bachelor')
        expect(result.evidence?.[0]).toContain(expected)
      })
    })
  })

  describe('validateExperience - Evidence Extraction', () => {
    it('should extract evidence from experience validation', () => {
      const result = validator.validateExperience(
        5,
        3,
        undefined,
        'resume.pdf'
      )

      expect(result.evidence).toBeDefined()
      expect(result.evidence).toHaveLength(3)
      expect(result.evidence?.[0]).toContain('5 years')
      expect(result.evidence?.[1]).toContain('3 years')
      expect(result.evidence?.[2]).toContain('Exceeds requirement by 2')
    })

    it('should set sourceDocument when provided', () => {
      const result = validator.validateExperience(
        5,
        3,
        undefined,
        'resume.pdf'
      )

      expect(result.sourceDocument).toBe('resume.pdf')
    })

    it('should set isCritical flag when experience is critical requirement', () => {
      const visaCriteria: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test Visa',
        description: 'Test',
        laborMarketTestRequired: false,
        sponsorRequired: false,
        criticalRequirements: {
          requirements: ['experience'],
          penalties: {
            experience: 25
          }
        }
      }

      const result = validator.validateExperience(
        5,
        3,
        visaCriteria
      )

      expect(result.isCritical).toBe(true)
    })

    it('should set missingReason to not_found when experience data missing', () => {
      const result = validator.validateExperience(
        undefined,
        3
      )

      expect(result.missingReason).toBe('not_found')
      expect(result.met).toBe(false)
      expect(result.evidence).toEqual([])
    })

    it('should set missingReason to insufficient when experience below requirement', () => {
      const result = validator.validateExperience(
        2,
        5
      )

      expect(result.missingReason).toBe('insufficient')
      expect(result.met).toBe(false)
      expect(result.evidence?.[2]).toContain('Short by 3')
    })

    it('should set missingReason to not_applicable when no experience requirement', () => {
      const result = validator.validateExperience(
        5,
        0
      )

      expect(result.missingReason).toBe('not_applicable')
      expect(result.met).toBe(true)
    })

    it('should include shortfall in evidence when below requirement', () => {
      const result = validator.validateExperience(
        2,
        5
      )

      expect(result.evidence).toBeDefined()
      expect(result.evidence?.some(e => e.includes('Short by 3'))).toBe(true)
    })

    it('should include excess years in evidence when exceeding requirement', () => {
      const result = validator.validateExperience(
        8,
        3
      )

      expect(result.evidence).toBeDefined()
      expect(result.evidence?.some(e => e.includes('Exceeds requirement by 5'))).toBe(true)
    })
  })

  describe('validateAllCriteria - Critical Requirements Marking', () => {
    it('should mark validation results as critical based on configuration', () => {
      const applicantData: ApplicantData = {
        name: 'Test User',
        email: 'test@example.com',
        salary: 40000,
        salaryCurrency: 'EUR',
        salaryPeriod: 'annual',
        education: 'Bachelor',
        experienceYears: 3
      }

      const visaCriteria: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test Visa',
        description: 'Test',
        salaryThresholds: [
          { amount: 38000, currency: 'EUR', period: 'annual' }
        ],
        educationLevel: 'Bachelor',
        experienceYears: 2,
        laborMarketTestRequired: false,
        sponsorRequired: false,
        criticalRequirements: {
          requirements: ['salary', 'education'],
          penalties: {
            salary: 35,
            education: 30
          }
        }
      }

      const results = validator.validateAllCriteria(applicantData, visaCriteria)

      const salaryResult = results.find(r => r.criterion === 'Salary')
      const educationResult = results.find(r => r.criterion === 'Education')
      const experienceResult = results.find(r => r.criterion === 'Experience')

      expect(salaryResult?.isCritical).toBe(true)
      expect(educationResult?.isCritical).toBe(true)
      expect(experienceResult?.isCritical).toBe(false)
    })

    it('should include evidence in all validation results', () => {
      const applicantData: ApplicantData = {
        name: 'Test User',
        email: 'test@example.com',
        salary: 40000,
        salaryCurrency: 'EUR',
        salaryPeriod: 'annual',
        education: 'Bachelor',
        experienceYears: 3
      }

      const visaCriteria: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test Visa',
        description: 'Test',
        salaryThresholds: [
          { amount: 38000, currency: 'EUR', period: 'annual' }
        ],
        educationLevel: 'Bachelor',
        experienceYears: 2,
        laborMarketTestRequired: false,
        sponsorRequired: false
      }

      const results = validator.validateAllCriteria(applicantData, visaCriteria)

      results.forEach(result => {
        expect(result.evidence).toBeDefined()
        expect(result.evidence!.length).toBeGreaterThan(0)
      })
    })

    it('should set missingReason for unmet criteria', () => {
      const applicantData: ApplicantData = {
        name: 'Test User',
        email: 'test@example.com',
        salary: 30000,
        salaryCurrency: 'EUR',
        salaryPeriod: 'annual',
        education: 'High School',
        experienceYears: 1
      }

      const visaCriteria: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test Visa',
        description: 'Test',
        salaryThresholds: [
          { amount: 38000, currency: 'EUR', period: 'annual' }
        ],
        educationLevel: 'Bachelor',
        experienceYears: 3,
        laborMarketTestRequired: false,
        sponsorRequired: false
      }

      const results = validator.validateAllCriteria(applicantData, visaCriteria)

      const salaryResult = results.find(r => r.criterion === 'Salary')
      const educationResult = results.find(r => r.criterion === 'Education')
      const experienceResult = results.find(r => r.criterion === 'Experience')

      expect(salaryResult?.missingReason).toBe('insufficient')
      expect(educationResult?.missingReason).toBe('insufficient')
      expect(experienceResult?.missingReason).toBe('insufficient')
    })

    it('should handle missing data with not_found missingReason', () => {
      const applicantData: ApplicantData = {
        name: 'Test User',
        email: 'test@example.com'
      }

      const visaCriteria: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test Visa',
        description: 'Test',
        salaryThresholds: [
          { amount: 38000, currency: 'EUR', period: 'annual' }
        ],
        educationLevel: 'Bachelor',
        experienceYears: 3,
        laborMarketTestRequired: false,
        sponsorRequired: false
      }

      const results = validator.validateAllCriteria(applicantData, visaCriteria)

      results.forEach(result => {
        expect(result.missingReason).toBe('not_found')
        expect(result.met).toBe(false)
      })
    })
  })

  describe('Edge Cases - Evidence and Critical Flags', () => {
    it('should handle zero salary with evidence', () => {
      const thresholds: SalaryThreshold[] = [
        { amount: 38000, currency: 'EUR', period: 'annual' }
      ]

      const result = validator.validateSalary(
        0,
        'EUR',
        'annual',
        thresholds
      )

      expect(result.evidence).toBeDefined()
      expect(result.evidence?.[0]).toContain('0')
      expect(result.missingReason).toBe('insufficient')
    })

    it('should handle fractional experience years in evidence', () => {
      const result = validator.validateExperience(
        2.5,
        2
      )

      expect(result.evidence?.[0]).toContain('2.5 years')
      expect(result.met).toBe(true)
    })

    it('should handle multiple salary thresholds with conditions in evidence', () => {
      const thresholds: SalaryThreshold[] = [
        { 
          amount: 64000, 
          currency: 'EUR', 
          period: 'annual',
          conditions: 'for other occupations'
        },
        { 
          amount: 38000, 
          currency: 'EUR', 
          period: 'annual',
          conditions: 'for critical occupations'
        }
      ]

      const result = validator.validateSalary(
        40000,
        'EUR',
        'annual',
        thresholds
      )

      expect(result.evidence).toBeDefined()
      expect(result.evidence?.some(e => e.includes('for critical occupations'))).toBe(true)
    })
  })
})
