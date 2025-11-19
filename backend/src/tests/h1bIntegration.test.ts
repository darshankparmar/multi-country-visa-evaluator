import { CriteriaValidator, ApplicantData } from '../services/criteriaValidator'
import { ScoringEngine } from '../services/scoringEngine'
import { getVisaCriteria } from '../config/visaCriteria'

describe('H-1B Visa Integration Tests', () => {
  let validator: CriteriaValidator
  let scoringEngine: ScoringEngine

  beforeEach(() => {
    validator = new CriteriaValidator()
    scoringEngine = new ScoringEngine()
  })

  describe('H-1B evaluation scenarios', () => {
    it('should apply 40-point penalty when LCA is missing', () => {
      const visaCriteria = getVisaCriteria('United States', 'H-1B Visa')
      expect(visaCriteria).not.toBeNull()

      const applicantData: ApplicantData = {
        name: 'Test Applicant',
        email: 'test@example.com',
        salary: 80000,
        salaryCurrency: 'USD',
        salaryPeriod: 'annual',
        education: 'Bachelor of Science in Computer Science',
        experienceYears: 3
      }

      // Validate criteria - LCA will be missing
      const validationResults = validator.validateAllCriteria(applicantData, visaCriteria!)

      // Add mock validation for sponsor (met) and LCA (not met)
      validationResults.push({
        criterion: 'Sponsor',
        met: true,
        score: 100,
        maxScore: 100,
        details: 'Employer sponsor confirmed',
        isCritical: true,
        evidence: ['U.S. employer filing LCA']
      })

      validationResults.push({
        criterion: 'LCA',
        met: false,
        score: 0,
        maxScore: 100,
        details: 'Labor Condition Application not found in documents',
        isCritical: true,
        evidence: [],
        missingReason: 'not_found'
      })

      // Calculate score with penalties
      const scoreCalculation = scoringEngine.calculateScore(validationResults, visaCriteria!)

      // Verify 40-point penalty for missing LCA
      const lcaPenalty = scoreCalculation.penalties.find(p => p.requirement === 'lca')
      expect(lcaPenalty).toBeDefined()
      expect(lcaPenalty?.points).toBe(40)
      expect(scoreCalculation.totalPenalty).toBeGreaterThanOrEqual(40)
      
      // Final score should reflect penalty
      expect(scoreCalculation.adjustedScore).toBe(scoreCalculation.baseScore - scoreCalculation.totalPenalty)
    })

    it('should apply 35-point penalty when sponsor is missing', () => {
      const visaCriteria = getVisaCriteria('United States', 'H-1B Visa')
      expect(visaCriteria).not.toBeNull()

      const applicantData: ApplicantData = {
        name: 'Test Applicant',
        email: 'test@example.com',
        salary: 80000,
        salaryCurrency: 'USD',
        salaryPeriod: 'annual',
        education: 'Bachelor of Science',
        experienceYears: 3
      }

      const validationResults = validator.validateAllCriteria(applicantData, visaCriteria!)

      // Add mock validation for LCA (met) and sponsor (not met)
      validationResults.push({
        criterion: 'LCA',
        met: true,
        score: 100,
        maxScore: 100,
        details: 'Labor Condition Application found',
        isCritical: true,
        evidence: ['LCA certified by Department of Labor']
      })

      validationResults.push({
        criterion: 'Sponsor',
        met: false,
        score: 0,
        maxScore: 100,
        details: 'Employer sponsor information not found',
        isCritical: true,
        evidence: [],
        missingReason: 'not_found'
      })

      const scoreCalculation = scoringEngine.calculateScore(validationResults, visaCriteria!)

      // Verify 35-point penalty for missing sponsor
      const sponsorPenalty = scoreCalculation.penalties.find(p => p.requirement === 'sponsor')
      expect(sponsorPenalty).toBeDefined()
      expect(sponsorPenalty?.points).toBe(35)
      expect(scoreCalculation.totalPenalty).toBeGreaterThanOrEqual(35)
    })

    it('should have no penalties when all requirements are met', () => {
      const visaCriteria = getVisaCriteria('United States', 'H-1B Visa')
      expect(visaCriteria).not.toBeNull()

      const applicantData: ApplicantData = {
        name: 'Test Applicant',
        email: 'test@example.com',
        salary: 90000,
        salaryCurrency: 'USD',
        salaryPeriod: 'annual',
        education: 'Master of Science in Computer Science',
        experienceYears: 5
      }

      const validationResults = validator.validateAllCriteria(applicantData, visaCriteria!)

      // Add mock validation for all critical requirements (all met)
      validationResults.push({
        criterion: 'LCA',
        met: true,
        score: 100,
        maxScore: 100,
        details: 'Labor Condition Application certified',
        isCritical: true,
        evidence: ['LCA certified by Department of Labor', 'Prevailing wage met']
      })

      validationResults.push({
        criterion: 'Sponsor',
        met: true,
        score: 100,
        maxScore: 100,
        details: 'U.S. employer sponsor confirmed',
        isCritical: true,
        evidence: ['Employer filing petition', 'Company registered']
      })

      const scoreCalculation = scoringEngine.calculateScore(validationResults, visaCriteria!)

      // Verify no penalties applied
      expect(scoreCalculation.penalties).toHaveLength(0)
      expect(scoreCalculation.totalPenalty).toBe(0)
      expect(scoreCalculation.adjustedScore).toBe(scoreCalculation.baseScore)
    })

    it('should apply multiple penalties and cap at maxTotalPenalty', () => {
      const visaCriteria = getVisaCriteria('United States', 'H-1B Visa')
      expect(visaCriteria).not.toBeNull()

      const applicantData: ApplicantData = {
        name: 'Test Applicant',
        email: 'test@example.com',
        salary: 40000, // Below prevailing wage
        salaryCurrency: 'USD',
        salaryPeriod: 'annual',
        education: 'High School', // Below Bachelor requirement
        experienceYears: 1
      }

      const validationResults = validator.validateAllCriteria(applicantData, visaCriteria!)

      // Add mock validation for all critical requirements (all not met)
      validationResults.push({
        criterion: 'LCA',
        met: false,
        score: 0,
        maxScore: 100,
        details: 'LCA not found',
        isCritical: true,
        evidence: [],
        missingReason: 'not_found'
      })

      validationResults.push({
        criterion: 'Sponsor',
        met: false,
        score: 0,
        maxScore: 100,
        details: 'Sponsor not found',
        isCritical: true,
        evidence: [],
        missingReason: 'not_found'
      })

      const scoreCalculation = scoringEngine.calculateScore(validationResults, visaCriteria!)

      // Verify multiple penalties applied
      expect(scoreCalculation.penalties.length).toBeGreaterThan(0)
      
      // Verify total penalty is capped at maxTotalPenalty (60)
      expect(scoreCalculation.totalPenalty).toBeLessThanOrEqual(60)
      
      // Verify penalties include LCA, sponsor, and potentially salary
      const penaltyRequirements = scoreCalculation.penalties.map(p => p.requirement)
      expect(penaltyRequirements).toContain('lca')
      expect(penaltyRequirements).toContain('sponsor')
    })

    it('should correctly reflect penalties in final score', () => {
      const visaCriteria = getVisaCriteria('United States', 'H-1B Visa')
      expect(visaCriteria).not.toBeNull()

      const applicantData: ApplicantData = {
        name: 'Test Applicant',
        email: 'test@example.com',
        salary: 75000,
        salaryCurrency: 'USD',
        salaryPeriod: 'annual',
        education: 'Bachelor of Science',
        experienceYears: 2
      }

      const validationResults = validator.validateAllCriteria(applicantData, visaCriteria!)

      // Add mock validation - LCA missing, sponsor present
      validationResults.push({
        criterion: 'LCA',
        met: false,
        score: 0,
        maxScore: 100,
        details: 'LCA not found',
        isCritical: true,
        evidence: [],
        missingReason: 'not_found'
      })

      validationResults.push({
        criterion: 'Sponsor',
        met: true,
        score: 100,
        maxScore: 100,
        details: 'Sponsor confirmed',
        isCritical: true,
        evidence: ['U.S. employer']
      })

      const scoreCalculation = scoringEngine.calculateScore(validationResults, visaCriteria!)

      // Calculate expected adjusted score
      const expectedAdjustedScore = Math.max(0, scoreCalculation.baseScore - scoreCalculation.totalPenalty)
      
      // Verify final score calculation
      expect(scoreCalculation.adjustedScore).toBe(expectedAdjustedScore)
      expect(scoreCalculation.finalScore).toBe(scoreCalculation.adjustedScore)
      
      // Verify score is reduced by penalties
      expect(scoreCalculation.adjustedScore).toBeLessThan(scoreCalculation.baseScore)
    })

    it('should handle H-1B with alternative qualification (experience for education)', () => {
      const visaCriteria = getVisaCriteria('United States', 'H-1B Visa')
      expect(visaCriteria).not.toBeNull()

      const applicantData: ApplicantData = {
        name: 'Test Applicant',
        email: 'test@example.com',
        salary: 85000,
        salaryCurrency: 'USD',
        salaryPeriod: 'annual',
        education: 'High School',
        experienceYears: 12 // 3 years per year of education = 12 years for Bachelor equivalent
      }

      const validationResults = validator.validateAllCriteria(applicantData, visaCriteria!)

      // Education validation should consider alternative qualification
      const educationResult = validationResults.find(r => r.criterion === 'Education')
      expect(educationResult).toBeDefined()
      
      // With sufficient experience, should meet requirement via alternative path
      if (educationResult && visaCriteria!.alternativeQualification) {
        expect(educationResult.details).toContain('alternative qualification')
      }
    })
  })
})
