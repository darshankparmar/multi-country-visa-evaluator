import { CriteriaValidator, ApplicantData } from '../services/criteriaValidator'
import { ScoringEngine } from '../services/scoringEngine'
import { getVisaCriteria } from '../config/visaCriteria'

describe('Other Visa Types Integration Tests', () => {
  let validator: CriteriaValidator
  let scoringEngine: ScoringEngine

  beforeEach(() => {
    validator = new CriteriaValidator()
    scoringEngine = new ScoringEngine()
  })

  describe('Ireland Critical Skills Employment Permit', () => {
    it('should meet requirements with salary above threshold', () => {
      const visaCriteria = getVisaCriteria('Ireland', 'Critical Skills Employment Permit')
      expect(visaCriteria).not.toBeNull()

      const applicantData: ApplicantData = {
        name: 'Test Applicant',
        email: 'test@example.com',
        salary: 42000,
        salaryCurrency: 'EUR',
        salaryPeriod: 'annual',
        education: 'Bachelor of Science',
        experienceYears: 2
      }

      const validationResults = validator.validateAllCriteria(applicantData, visaCriteria!)

      // Add sponsor validation (met)
      validationResults.push({
        criterion: 'Sponsor',
        met: true,
        score: 100,
        maxScore: 100,
        details: 'Registered Irish employer confirmed',
        isCritical: true,
        evidence: ['Irish employer registration']
      })

      const scoreCalculation = scoringEngine.calculateScore(validationResults, visaCriteria!)

      // Salary should meet the 38,000 EUR threshold
      const salaryResult = validationResults.find(r => r.criterion === 'Salary')
      expect(salaryResult?.met).toBe(true)

      // No penalties should be applied
      expect(scoreCalculation.penalties).toHaveLength(0)
      expect(scoreCalculation.totalPenalty).toBe(0)
    })

    it('should apply penalty when salary below threshold', () => {
      const visaCriteria = getVisaCriteria('Ireland', 'Critical Skills Employment Permit')
      expect(visaCriteria).not.toBeNull()

      const applicantData: ApplicantData = {
        name: 'Test Applicant',
        email: 'test@example.com',
        salary: 35000,
        salaryCurrency: 'EUR',
        salaryPeriod: 'annual',
        education: 'Bachelor of Science',
        experienceYears: 2
      }

      const validationResults = validator.validateAllCriteria(applicantData, visaCriteria!)

      // Add sponsor validation (met)
      validationResults.push({
        criterion: 'Sponsor',
        met: true,
        score: 100,
        maxScore: 100,
        details: 'Registered Irish employer confirmed',
        isCritical: true,
        evidence: ['Irish employer registration']
      })

      const scoreCalculation = scoringEngine.calculateScore(validationResults, visaCriteria!)

      // Salary should not meet the 38,000 EUR threshold
      const salaryResult = validationResults.find(r => r.criterion === 'Salary')
      expect(salaryResult?.met).toBe(false)

      // Penalty should be applied for salary
      const salaryPenalty = scoreCalculation.penalties.find(p => p.requirement === 'salary')
      expect(salaryPenalty).toBeDefined()
      expect(salaryPenalty?.points).toBe(35)
    })
  })

  describe('Netherlands Knowledge Migrant Permit', () => {
    it('should apply correct age-based threshold for applicant under 30', () => {
      const visaCriteria = getVisaCriteria('Netherlands', 'Knowledge Migrant Permit')
      expect(visaCriteria).not.toBeNull()

      const applicantData: ApplicantData = {
        name: 'Test Applicant',
        email: 'test@example.com',
        salary: 4500,
        salaryCurrency: 'EUR',
        salaryPeriod: 'monthly',
        education: 'Bachelor of Science',
        experienceYears: 2,
        age: 27
      }

      const validationResults = validator.validateAllCriteria(applicantData, visaCriteria!)

      // Add sponsor validation (met)
      validationResults.push({
        criterion: 'Sponsor',
        met: true,
        score: 100,
        maxScore: 100,
        details: 'Recognized sponsor employer confirmed',
        isCritical: true,
        evidence: ['Recognized sponsor status']
      })

      const scoreCalculation = scoringEngine.calculateScore(validationResults, visaCriteria!)

      // Salary should meet the 4,171 EUR/month threshold for under 30
      const salaryResult = validationResults.find(r => r.criterion === 'Salary')
      expect(salaryResult?.met).toBe(true)
      expect(salaryResult?.details).toContain('4,171')

      // No penalties should be applied
      expect(scoreCalculation.penalties).toHaveLength(0)
    })

    it('should apply correct age-based threshold for applicant 30 or older', () => {
      const visaCriteria = getVisaCriteria('Netherlands', 'Knowledge Migrant Permit')
      expect(visaCriteria).not.toBeNull()

      const applicantData: ApplicantData = {
        name: 'Test Applicant',
        email: 'test@example.com',
        salary: 6000,
        salaryCurrency: 'EUR',
        salaryPeriod: 'monthly',
        education: 'Master of Science',
        experienceYears: 5,
        age: 32
      }

      const validationResults = validator.validateAllCriteria(applicantData, visaCriteria!)

      // Add sponsor validation (met)
      validationResults.push({
        criterion: 'Sponsor',
        met: true,
        score: 100,
        maxScore: 100,
        details: 'Recognized sponsor employer confirmed',
        isCritical: true,
        evidence: ['Recognized sponsor status']
      })

      const scoreCalculation = scoringEngine.calculateScore(validationResults, visaCriteria!)

      // Salary should meet the 5,688 EUR/month threshold for 30+
      const salaryResult = validationResults.find(r => r.criterion === 'Salary')
      expect(salaryResult?.met).toBe(true)
      expect(salaryResult?.details).toContain('5,688')

      // No penalties should be applied
      expect(scoreCalculation.penalties).toHaveLength(0)
    })

    it('should apply penalty when salary below age-based threshold', () => {
      const visaCriteria = getVisaCriteria('Netherlands', 'Knowledge Migrant Permit')
      expect(visaCriteria).not.toBeNull()

      const applicantData: ApplicantData = {
        name: 'Test Applicant',
        email: 'test@example.com',
        salary: 5000,
        salaryCurrency: 'EUR',
        salaryPeriod: 'monthly',
        education: 'Bachelor of Science',
        experienceYears: 3,
        age: 35
      }

      const validationResults = validator.validateAllCriteria(applicantData, visaCriteria!)

      // Add sponsor validation (met)
      validationResults.push({
        criterion: 'Sponsor',
        met: true,
        score: 100,
        maxScore: 100,
        details: 'Recognized sponsor employer confirmed',
        isCritical: true,
        evidence: ['Recognized sponsor status']
      })

      const scoreCalculation = scoringEngine.calculateScore(validationResults, visaCriteria!)

      // Salary should not meet the 5,688 EUR/month threshold for 30+
      const salaryResult = validationResults.find(r => r.criterion === 'Salary')
      expect(salaryResult?.met).toBe(false)

      // Penalty should be applied for salary
      const salaryPenalty = scoreCalculation.penalties.find(p => p.requirement === 'salary')
      expect(salaryPenalty).toBeDefined()
      expect(salaryPenalty?.points).toBe(40)
    })
  })

  describe('Germany EU Blue Card', () => {
    it('should meet requirements with Bachelor degree and sufficient salary', () => {
      const visaCriteria = getVisaCriteria('Germany', 'EU Blue Card')
      expect(visaCriteria).not.toBeNull()

      const applicantData: ApplicantData = {
        name: 'Test Applicant',
        email: 'test@example.com',
        salary: 50000,
        salaryCurrency: 'EUR',
        salaryPeriod: 'annual',
        education: 'Bachelor of Engineering',
        experienceYears: 3
      }

      const validationResults = validator.validateAllCriteria(applicantData, visaCriteria!)

      const scoreCalculation = scoringEngine.calculateScore(validationResults, visaCriteria!)

      // Education should meet Bachelor requirement
      const educationResult = validationResults.find(r => r.criterion === 'Education')
      expect(educationResult?.met).toBe(true)

      // Salary should meet the 48,300 EUR threshold
      const salaryResult = validationResults.find(r => r.criterion === 'Salary')
      expect(salaryResult?.met).toBe(true)

      // No penalties should be applied
      expect(scoreCalculation.penalties).toHaveLength(0)
    })

    it('should apply penalty when education requirement not met', () => {
      const visaCriteria = getVisaCriteria('Germany', 'EU Blue Card')
      expect(visaCriteria).not.toBeNull()

      const applicantData: ApplicantData = {
        name: 'Test Applicant',
        email: 'test@example.com',
        salary: 50000,
        salaryCurrency: 'EUR',
        salaryPeriod: 'annual',
        education: 'High School',
        experienceYears: 2 // Not enough for alternative qualification
      }

      const validationResults = validator.validateAllCriteria(applicantData, visaCriteria!)

      const scoreCalculation = scoringEngine.calculateScore(validationResults, visaCriteria!)

      // Education should not meet Bachelor requirement (not enough experience for alternative)
      const educationResult = validationResults.find(r => r.criterion === 'Education')
      expect(educationResult?.met).toBe(false)

      // Penalty should be applied for education
      const educationPenalty = scoreCalculation.penalties.find(p => p.requirement === 'education')
      expect(educationPenalty).toBeDefined()
      expect(educationPenalty?.points).toBe(30)
    })

    it('should handle lower salary threshold for shortage occupations', () => {
      const visaCriteria = getVisaCriteria('Germany', 'EU Blue Card')
      expect(visaCriteria).not.toBeNull()

      const applicantData: ApplicantData = {
        name: 'Test Applicant',
        email: 'test@example.com',
        salary: 45000,
        salaryCurrency: 'EUR',
        salaryPeriod: 'annual',
        education: 'Bachelor of Science in Computer Science',
        experienceYears: 2,
        occupation: 'Software Engineer' // STEM occupation
      }

      const validationResults = validator.validateAllCriteria(applicantData, visaCriteria!)

      const scoreCalculation = scoringEngine.calculateScore(validationResults, visaCriteria!)

      // Salary should meet the lower 43,760 EUR threshold for shortage occupations
      const salaryResult = validationResults.find(r => r.criterion === 'Salary')
      expect(salaryResult?.met).toBe(true)

      // No penalties should be applied
      expect(scoreCalculation.penalties).toHaveLength(0)
    })

    it('should apply both salary and education penalties when both missing', () => {
      const visaCriteria = getVisaCriteria('Germany', 'EU Blue Card')
      expect(visaCriteria).not.toBeNull()

      const applicantData: ApplicantData = {
        name: 'Test Applicant',
        email: 'test@example.com',
        salary: 40000,
        salaryCurrency: 'EUR',
        salaryPeriod: 'annual',
        education: 'High School',
        experienceYears: 2 // Not enough for alternative qualification
      }

      const validationResults = validator.validateAllCriteria(applicantData, visaCriteria!)

      const scoreCalculation = scoringEngine.calculateScore(validationResults, visaCriteria!)

      // Both salary and education should not meet requirements
      const salaryResult = validationResults.find(r => r.criterion === 'Salary')
      const educationResult = validationResults.find(r => r.criterion === 'Education')
      expect(salaryResult?.met).toBe(false)
      expect(educationResult?.met).toBe(false)

      // Both penalties should be applied
      expect(scoreCalculation.penalties.length).toBeGreaterThanOrEqual(2)
      
      const salaryPenalty = scoreCalculation.penalties.find(p => p.requirement === 'salary')
      const educationPenalty = scoreCalculation.penalties.find(p => p.requirement === 'education')
      expect(salaryPenalty).toBeDefined()
      expect(educationPenalty).toBeDefined()

      // Total penalty should be capped at maxTotalPenalty
      expect(scoreCalculation.totalPenalty).toBeLessThanOrEqual(60)
    })
  })
})
