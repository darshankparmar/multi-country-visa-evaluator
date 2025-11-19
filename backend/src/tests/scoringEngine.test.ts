import { ScoringEngine } from '../services/scoringEngine'
import { ValidationResult } from '../services/criteriaValidator'
import { VisaCriteriaConfig } from '../config/visaCriteria'

describe('ScoringEngine', () => {
  let scoringEngine: ScoringEngine

  beforeEach(() => {
    scoringEngine = new ScoringEngine()
  })

  describe('calculateBaseScore', () => {
    it('should calculate base score with equal weighting when no weights configured', () => {
      const validationResults: ValidationResult[] = [
        {
          criterion: 'Salary',
          met: true,
          score: 100,
          maxScore: 100,
          details: 'Meets requirement'
        },
        {
          criterion: 'Education',
          met: true,
          score: 80,
          maxScore: 100,
          details: 'Meets requirement'
        },
        {
          criterion: 'Experience',
          met: false,
          score: 50,
          maxScore: 100,
          details: 'Below requirement'
        }
      ]

      const visaCriteria: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test Visa',
        description: 'Test',
        laborMarketTestRequired: false,
        sponsorRequired: false
      }

      const result = scoringEngine.calculateScore(validationResults, visaCriteria)

      // (100 + 80 + 50) / 300 * 100 = 76.67
      expect(result.baseScore).toBeCloseTo(76.67, 1)
    })

    it('should calculate base score with configured weights', () => {
      const validationResults: ValidationResult[] = [
        {
          criterion: 'Salary',
          met: true,
          score: 100,
          maxScore: 100,
          details: 'Meets requirement'
        },
        {
          criterion: 'Education',
          met: true,
          score: 80,
          maxScore: 100,
          details: 'Meets requirement'
        },
        {
          criterion: 'Experience',
          met: false,
          score: 50,
          maxScore: 100,
          details: 'Below requirement'
        }
      ]

      const visaCriteria: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test Visa',
        description: 'Test',
        laborMarketTestRequired: false,
        sponsorRequired: false,
        criteriaWeights: {
          salary: 40,
          education: 30,
          experience: 20,
          documentation: 5,
          other: 5
        }
      }

      const result = scoringEngine.calculateScore(validationResults, visaCriteria)

      // With configured weights, the calculation is:
      // (100/100 * 100) * (40/90) + (80/100 * 100) * (30/90) + (50/100 * 100) * (20/90)
      // = 100 * 0.444 + 80 * 0.333 + 50 * 0.222 = 44.4 + 26.64 + 11.1 = 82.14
      expect(result.baseScore).toBeCloseTo(82.22, 1)
    })

    it('should handle empty validation results', () => {
      const validationResults: ValidationResult[] = []

      const visaCriteria: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test Visa',
        description: 'Test',
        laborMarketTestRequired: false,
        sponsorRequired: false
      }

      const result = scoringEngine.calculateScore(validationResults, visaCriteria)

      expect(result.baseScore).toBe(0)
    })

    it('should handle validation results with zero maxScore', () => {
      const validationResults: ValidationResult[] = [
        {
          criterion: 'Salary',
          met: false,
          score: 0,
          maxScore: 0,
          details: 'Not applicable'
        }
      ]

      const visaCriteria: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test Visa',
        description: 'Test',
        laborMarketTestRequired: false,
        sponsorRequired: false
      }

      const result = scoringEngine.calculateScore(validationResults, visaCriteria)

      expect(result.baseScore).toBe(0)
    })
  })

  describe('applyPenalties', () => {
    it('should apply penalty for missing critical requirement', () => {
      const validationResults: ValidationResult[] = [
        {
          criterion: 'Salary',
          met: false,
          score: 50,
          maxScore: 100,
          details: 'Below threshold',
          isCritical: true,
          missingReason: 'insufficient'
        },
        {
          criterion: 'Education',
          met: true,
          score: 100,
          maxScore: 100,
          details: 'Meets requirement'
        }
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
          },
          maxTotalPenalty: 60
        }
      }

      const result = scoringEngine.calculateScore(validationResults, visaCriteria)

      expect(result.penalties).toHaveLength(1)
      expect(result.penalties[0].requirement).toBe('salary')
      expect(result.penalties[0].points).toBe(35)
      expect(result.totalPenalty).toBe(35)
    })

    it('should apply multiple penalties for multiple missing critical requirements', () => {
      const validationResults: ValidationResult[] = [
        {
          criterion: 'Salary',
          met: false,
          score: 50,
          maxScore: 100,
          details: 'Below threshold',
          isCritical: true,
          missingReason: 'insufficient'
        },
        {
          criterion: 'Sponsor',
          met: false,
          score: 0,
          maxScore: 100,
          details: 'Not found',
          isCritical: true,
          missingReason: 'not_found'
        },
        {
          criterion: 'Education',
          met: true,
          score: 100,
          maxScore: 100,
          details: 'Meets requirement'
        }
      ]

      const visaCriteria: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test Visa',
        description: 'Test',
        laborMarketTestRequired: false,
        sponsorRequired: true,
        criticalRequirements: {
          requirements: ['salary', 'sponsor'],
          penalties: {
            salary: 35,
            sponsor: 30
          },
          maxTotalPenalty: 60
        }
      }

      const result = scoringEngine.calculateScore(validationResults, visaCriteria)

      expect(result.penalties).toHaveLength(2)
      expect(result.totalPenalty).toBe(60) // Capped at maxTotalPenalty
    })

    it('should cap total penalties at maxTotalPenalty', () => {
      const validationResults: ValidationResult[] = [
        {
          criterion: 'Salary',
          met: false,
          score: 50,
          maxScore: 100,
          details: 'Below threshold',
          isCritical: true,
          missingReason: 'insufficient'
        },
        {
          criterion: 'Sponsor',
          met: false,
          score: 0,
          maxScore: 100,
          details: 'Not found',
          isCritical: true,
          missingReason: 'not_found'
        },
        {
          criterion: 'LCA',
          met: false,
          score: 0,
          maxScore: 100,
          details: 'Not found',
          isCritical: true,
          missingReason: 'not_found'
        }
      ]

      const visaCriteria: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test Visa',
        description: 'Test',
        laborMarketTestRequired: false,
        sponsorRequired: true,
        criticalRequirements: {
          requirements: ['salary', 'sponsor', 'lca'],
          penalties: {
            salary: 35,
            sponsor: 30,
            lca: 40
          },
          maxTotalPenalty: 60
        }
      }

      const result = scoringEngine.calculateScore(validationResults, visaCriteria)

      expect(result.totalPenalty).toBe(60)
      expect(result.penalties).toHaveLength(3)
      // Penalties should be proportionally reduced
      const totalPenaltyPoints = result.penalties.reduce((sum, p) => sum + p.points, 0)
      expect(totalPenaltyPoints).toBe(60)
    })

    it('should not apply penalty when critical requirement is met', () => {
      const validationResults: ValidationResult[] = [
        {
          criterion: 'Salary',
          met: true,
          score: 100,
          maxScore: 100,
          details: 'Meets requirement',
          isCritical: true
        },
        {
          criterion: 'Education',
          met: true,
          score: 100,
          maxScore: 100,
          details: 'Meets requirement'
        }
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
          },
          maxTotalPenalty: 60
        }
      }

      const result = scoringEngine.calculateScore(validationResults, visaCriteria)

      expect(result.penalties).toHaveLength(0)
      expect(result.totalPenalty).toBe(0)
    })

    it('should handle no critical requirements configured', () => {
      const validationResults: ValidationResult[] = [
        {
          criterion: 'Salary',
          met: false,
          score: 50,
          maxScore: 100,
          details: 'Below threshold'
        }
      ]

      const visaCriteria: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test Visa',
        description: 'Test',
        laborMarketTestRequired: false,
        sponsorRequired: false
      }

      const result = scoringEngine.calculateScore(validationResults, visaCriteria)

      expect(result.penalties).toHaveLength(0)
      expect(result.totalPenalty).toBe(0)
    })
  })

  describe('calculateScore', () => {
    it('should calculate complete score with base score and penalties', () => {
      const validationResults: ValidationResult[] = [
        {
          criterion: 'Salary',
          met: false,
          score: 70,
          maxScore: 100,
          details: 'Below threshold',
          isCritical: true,
          missingReason: 'insufficient'
        },
        {
          criterion: 'Education',
          met: true,
          score: 100,
          maxScore: 100,
          details: 'Meets requirement'
        },
        {
          criterion: 'Experience',
          met: true,
          score: 90,
          maxScore: 100,
          details: 'Meets requirement'
        }
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
            salary: 30
          },
          maxTotalPenalty: 60
        }
      }

      const result = scoringEngine.calculateScore(validationResults, visaCriteria)

      // Base score: (70 + 100 + 90) / 300 * 100 = 86.67
      // Penalty: 30
      // Adjusted: 86.67 - 30 = 56.67
      expect(result.baseScore).toBeCloseTo(86.67, 1)
      expect(result.totalPenalty).toBe(30)
      expect(result.adjustedScore).toBeCloseTo(56.67, 1)
      expect(result.finalScore).toBeCloseTo(56.67, 1)
    })

    it('should not allow adjusted score to go below zero', () => {
      const validationResults: ValidationResult[] = [
        {
          criterion: 'Salary',
          met: false,
          score: 10,
          maxScore: 100,
          details: 'Below threshold',
          isCritical: true,
          missingReason: 'insufficient'
        },
        {
          criterion: 'Sponsor',
          met: false,
          score: 0,
          maxScore: 100,
          details: 'Not found',
          isCritical: true,
          missingReason: 'not_found'
        }
      ]

      const visaCriteria: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test Visa',
        description: 'Test',
        laborMarketTestRequired: false,
        sponsorRequired: true,
        criticalRequirements: {
          requirements: ['salary', 'sponsor'],
          penalties: {
            salary: 40,
            sponsor: 35
          },
          maxTotalPenalty: 60
        }
      }

      const result = scoringEngine.calculateScore(validationResults, visaCriteria)

      // Base score: 10 / 200 * 100 = 5
      // Penalty: 60 (capped)
      // Adjusted: max(0, 5 - 60) = 0
      expect(result.adjustedScore).toBe(0)
      expect(result.finalScore).toBe(0)
    })

    it('should generate score breakdown for each criterion', () => {
      const validationResults: ValidationResult[] = [
        {
          criterion: 'Salary',
          met: true,
          score: 100,
          maxScore: 100,
          details: 'Meets requirement'
        },
        {
          criterion: 'Education',
          met: true,
          score: 80,
          maxScore: 100,
          details: 'Meets requirement'
        },
        {
          criterion: 'Experience',
          met: false,
          score: 50,
          maxScore: 100,
          details: 'Below requirement'
        }
      ]

      const visaCriteria: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test Visa',
        description: 'Test',
        laborMarketTestRequired: false,
        sponsorRequired: false
      }

      const result = scoringEngine.calculateScore(validationResults, visaCriteria)

      expect(result.breakdown).toHaveLength(3)
      
      const salaryBreakdown = result.breakdown.find(b => b.criterion === 'Salary')
      expect(salaryBreakdown).toBeDefined()
      expect(salaryBreakdown?.points).toBe(100)
      expect(salaryBreakdown?.maxPoints).toBe(100)
      expect(salaryBreakdown?.percentage).toBe(100)

      const educationBreakdown = result.breakdown.find(b => b.criterion === 'Education')
      expect(educationBreakdown).toBeDefined()
      expect(educationBreakdown?.points).toBe(80)
      expect(educationBreakdown?.maxPoints).toBe(100)
      expect(educationBreakdown?.percentage).toBe(80)

      const experienceBreakdown = result.breakdown.find(b => b.criterion === 'Experience')
      expect(experienceBreakdown).toBeDefined()
      expect(experienceBreakdown?.points).toBe(50)
      expect(experienceBreakdown?.maxPoints).toBe(100)
      expect(experienceBreakdown?.percentage).toBe(50)
    })

    it('should handle H-1B scenario with missing LCA', () => {
      const validationResults: ValidationResult[] = [
        {
          criterion: 'Salary',
          met: true,
          score: 100,
          maxScore: 100,
          details: 'Meets prevailing wage',
          isCritical: true
        },
        {
          criterion: 'Education',
          met: true,
          score: 100,
          maxScore: 100,
          details: 'Bachelor degree'
        },
        {
          criterion: 'LCA',
          met: false,
          score: 0,
          maxScore: 100,
          details: 'LCA not found',
          isCritical: true,
          missingReason: 'not_found'
        },
        {
          criterion: 'Sponsor',
          met: true,
          score: 100,
          maxScore: 100,
          details: 'Employer sponsor confirmed',
          isCritical: true
        }
      ]

      const visaCriteria: VisaCriteriaConfig = {
        country: 'United States',
        visaType: 'H-1B Visa',
        description: 'Test',
        laborMarketTestRequired: true,
        sponsorRequired: true,
        criticalRequirements: {
          requirements: ['lca', 'sponsor', 'salary'],
          penalties: {
            lca: 40,
            sponsor: 35,
            salary: 30
          },
          maxTotalPenalty: 60
        }
      }

      const result = scoringEngine.calculateScore(validationResults, visaCriteria)

      // Base score: 300 / 400 * 100 = 75
      // Penalty: 40 for missing LCA
      // Adjusted: 75 - 40 = 35
      expect(result.baseScore).toBe(75)
      expect(result.penalties).toHaveLength(1)
      expect(result.penalties[0].requirement).toBe('lca')
      expect(result.penalties[0].points).toBe(40)
      expect(result.totalPenalty).toBe(40)
      expect(result.adjustedScore).toBe(35)
    })
  })
})
