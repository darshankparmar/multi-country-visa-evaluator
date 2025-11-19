import { EnhancedPromptBuilder } from '../services/enhancedPromptBuilder'
import { VisaCriteriaConfig } from '../config/visaCriteria'
import { ParsedDocument } from '../services/documentParser'
import { ValidationResult } from '../services/criteriaValidator'
import { ScoreCalculation } from '../services/scoringEngine'

describe('EnhancedPromptBuilder - With Validation', () => {
  let promptBuilder: EnhancedPromptBuilder

  beforeEach(() => {
    promptBuilder = new EnhancedPromptBuilder()
  })

  describe('buildVisaSpecificPromptWithValidation', () => {
    const mockVisaCriteria: VisaCriteriaConfig = {
      country: 'Ireland',
      visaType: 'Critical Skills Employment Permit',
      description: 'For highly skilled workers in shortage occupations',
      salaryThresholds: [
        { amount: 38000, currency: 'EUR', period: 'annual' }
      ],
      educationLevel: 'Bachelor',
      experienceYears: 0,
      laborMarketTestRequired: false,
      sponsorRequired: true,
      processingTime: '8-12 weeks',
      pathToPermanentResidency: 'After 2 years',
      criticalRequirements: {
        requirements: ['salary', 'sponsor'],
        penalties: {
          salary: 35,
          sponsor: 30
        },
        maxTotalPenalty: 60
      }
    }

    const mockParsedDocuments: ParsedDocument[] = [
      {
        filename: 'resume.pdf',
        originalName: 'resume.pdf',
        documentType: 'Resume',
        success: true,
        extractedText: 'John Doe\nSoftware Engineer\n5 years experience'
      }
    ]

    const mockUserInfo = {
      name: 'John Doe',
      email: 'john@example.com'
    }

    it('should include validation results section in prompt', () => {
      const validationResults: ValidationResult[] = [
        {
          criterion: 'Salary',
          met: true,
          score: 100,
          maxScore: 100,
          details: 'Meets requirement',
          isCritical: true,
          evidence: ['Salary: EUR 40,000 annual'],
          sourceDocument: 'employment_contract.pdf'
        }
      ]

      const scoreCalculation: ScoreCalculation = {
        baseScore: 100,
        penalties: [],
        totalPenalty: 0,
        adjustedScore: 100,
        finalScore: 100,
        breakdown: [
          { criterion: 'Salary', points: 100, maxPoints: 100, percentage: 100 }
        ]
      }

      const prompt = promptBuilder.buildVisaSpecificPromptWithValidation(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo,
        validationResults,
        scoreCalculation
      )

      expect(prompt).toContain('## Validation Results')
      expect(prompt).toContain('### Salary')
      expect(prompt).toContain('✓ MET')
      expect(prompt).toContain('**Score:** 100/100')
      expect(prompt).toContain('**Details:** Meets requirement')
    })

    it('should include evidence in validation results section', () => {
      const validationResults: ValidationResult[] = [
        {
          criterion: 'Salary',
          met: true,
          score: 100,
          maxScore: 100,
          details: 'Meets requirement',
          isCritical: true,
          evidence: [
            'Offered salary: EUR 40,000 annual',
            'Required threshold: EUR 38,000 annual',
            'Percentage of threshold: 105.3%'
          ],
          sourceDocument: 'employment_contract.pdf'
        }
      ]

      const scoreCalculation: ScoreCalculation = {
        baseScore: 100,
        penalties: [],
        totalPenalty: 0,
        adjustedScore: 100,
        finalScore: 100,
        breakdown: []
      }

      const prompt = promptBuilder.buildVisaSpecificPromptWithValidation(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo,
        validationResults,
        scoreCalculation
      )

      expect(prompt).toContain('**Evidence:**')
      expect(prompt).toContain('Offered salary: EUR 40,000 annual')
      expect(prompt).toContain('Required threshold: EUR 38,000 annual')
      expect(prompt).toContain('Percentage of threshold: 105.3%')
    })

    it('should include source document in validation results', () => {
      const validationResults: ValidationResult[] = [
        {
          criterion: 'Salary',
          met: true,
          score: 100,
          maxScore: 100,
          details: 'Meets requirement',
          evidence: ['Salary: EUR 40,000 annual'],
          sourceDocument: 'employment_contract.pdf'
        }
      ]

      const scoreCalculation: ScoreCalculation = {
        baseScore: 100,
        penalties: [],
        totalPenalty: 0,
        adjustedScore: 100,
        finalScore: 100,
        breakdown: []
      }

      const prompt = promptBuilder.buildVisaSpecificPromptWithValidation(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo,
        validationResults,
        scoreCalculation
      )

      expect(prompt).toContain('**Source Document:** employment_contract.pdf')
    })

    it('should mark critical requirements with [CRITICAL] tag', () => {
      const validationResults: ValidationResult[] = [
        {
          criterion: 'Salary',
          met: false,
          score: 50,
          maxScore: 100,
          details: 'Below threshold',
          isCritical: true,
          evidence: ['Salary: EUR 30,000 annual'],
          missingReason: 'insufficient'
        }
      ]

      const scoreCalculation: ScoreCalculation = {
        baseScore: 50,
        penalties: [
          { requirement: 'salary', points: 35, reason: 'Requirement not met - insufficient qualification' }
        ],
        totalPenalty: 35,
        adjustedScore: 15,
        finalScore: 15,
        breakdown: []
      }

      const prompt = promptBuilder.buildVisaSpecificPromptWithValidation(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo,
        validationResults,
        scoreCalculation
      )

      expect(prompt).toContain('### Salary [CRITICAL]')
      expect(prompt).toContain('✗ NOT MET')
    })

    it('should include score calculation section with base score', () => {
      const validationResults: ValidationResult[] = []

      const scoreCalculation: ScoreCalculation = {
        baseScore: 75.5,
        penalties: [],
        totalPenalty: 0,
        adjustedScore: 75.5,
        finalScore: 75.5,
        breakdown: []
      }

      const prompt = promptBuilder.buildVisaSpecificPromptWithValidation(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo,
        validationResults,
        scoreCalculation
      )

      expect(prompt).toContain('## Score Calculation')
      expect(prompt).toContain('**Base Score:** 75.5/100')
      expect(prompt).toContain('**Adjusted Score:** 75.5/100')
    })

    it('should include penalties in score calculation section', () => {
      const validationResults: ValidationResult[] = []

      const scoreCalculation: ScoreCalculation = {
        baseScore: 80,
        penalties: [
          { requirement: 'salary', points: 35, reason: 'Requirement not met - insufficient qualification' },
          { requirement: 'sponsor', points: 30, reason: 'Required information not found in documents' }
        ],
        totalPenalty: 60,
        adjustedScore: 20,
        finalScore: 20,
        breakdown: []
      }

      const prompt = promptBuilder.buildVisaSpecificPromptWithValidation(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo,
        validationResults,
        scoreCalculation
      )

      expect(prompt).toContain('**Penalties Applied:**')
      expect(prompt).toContain('salary: -35 points (Requirement not met - insufficient qualification)')
      expect(prompt).toContain('sponsor: -30 points (Required information not found in documents)')
      expect(prompt).toContain('**Total Penalty:** -60')
    })

    it('should include critical requirements status section', () => {
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
          criterion: 'Sponsor',
          met: false,
          score: 0,
          maxScore: 100,
          details: 'Not found',
          isCritical: true,
          missingReason: 'not_found'
        }
      ]

      const scoreCalculation: ScoreCalculation = {
        baseScore: 50,
        penalties: [
          { requirement: 'sponsor', points: 30, reason: 'Required information not found in documents' }
        ],
        totalPenalty: 30,
        adjustedScore: 20,
        finalScore: 20,
        breakdown: []
      }

      const prompt = promptBuilder.buildVisaSpecificPromptWithValidation(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo,
        validationResults,
        scoreCalculation
      )

      expect(prompt).toContain('## Critical Requirements Status')
      expect(prompt).toContain('**salary**: ✓ MET')
      expect(prompt).toContain('**sponsor**: ✗ NOT MET')
    })

    it('should include AI instructions emphasizing validation results are authoritative', () => {
      const validationResults: ValidationResult[] = []

      const scoreCalculation: ScoreCalculation = {
        baseScore: 75,
        penalties: [],
        totalPenalty: 0,
        adjustedScore: 75,
        finalScore: 75,
        breakdown: []
      }

      const prompt = promptBuilder.buildVisaSpecificPromptWithValidation(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo,
        validationResults,
        scoreCalculation
      )

      expect(prompt).toContain('**IMPORTANT INSTRUCTIONS:**')
      expect(prompt).toContain('The validation results are AUTHORITATIVE')
      expect(prompt).toContain('Use the calculated score')
      expect(prompt).toContain('Explain WHY requirements were not met')
      expect(prompt).toContain('Prioritize recommendations by criticality')
    })

    it('should include structured response format instructions', () => {
      const validationResults: ValidationResult[] = []

      const scoreCalculation: ScoreCalculation = {
        baseScore: 75,
        penalties: [],
        totalPenalty: 0,
        adjustedScore: 75,
        finalScore: 75,
        breakdown: []
      }

      const prompt = promptBuilder.buildVisaSpecificPromptWithValidation(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo,
        validationResults,
        scoreCalculation
      )

      expect(prompt).toContain('## Response Format')
      expect(prompt).toContain('"criteriaAnalysis"')
      expect(prompt).toContain('"prioritizedRecommendations"')
      expect(prompt).toContain('"rating": "STRONG|GOOD|MODERATE|WEAK|CRITICAL_GAP"')
      expect(prompt).toContain('"priority": "CRITICAL|HIGH|MEDIUM|LOW"')
    })

    it('should specify exact score in response format', () => {
      const validationResults: ValidationResult[] = []

      const scoreCalculation: ScoreCalculation = {
        baseScore: 75.5,
        penalties: [
          { requirement: 'salary', points: 20, reason: 'Below threshold' }
        ],
        totalPenalty: 20,
        adjustedScore: 55.5,
        finalScore: 55.5,
        breakdown: []
      }

      const prompt = promptBuilder.buildVisaSpecificPromptWithValidation(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo,
        validationResults,
        scoreCalculation
      )

      expect(prompt).toContain('"score": 55.5')
      expect(prompt).toContain('**score**: Must be 55.5 (the calculated adjusted score)')
    })

    it('should handle validation results with recommendations', () => {
      const validationResults: ValidationResult[] = [
        {
          criterion: 'Salary',
          met: false,
          score: 70,
          maxScore: 100,
          details: 'Below threshold',
          recommendation: 'Increase salary to EUR 38,000 annual',
          isCritical: true,
          evidence: ['Salary: EUR 35,000 annual'],
          missingReason: 'insufficient'
        }
      ]

      const scoreCalculation: ScoreCalculation = {
        baseScore: 70,
        penalties: [
          { requirement: 'salary', points: 35, reason: 'Requirement not met - insufficient qualification' }
        ],
        totalPenalty: 35,
        adjustedScore: 35,
        finalScore: 35,
        breakdown: []
      }

      const prompt = promptBuilder.buildVisaSpecificPromptWithValidation(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo,
        validationResults,
        scoreCalculation
      )

      expect(prompt).toContain('**Recommendation:** Increase salary to EUR 38,000 annual')
    })

    it('should handle multiple validation results', () => {
      const validationResults: ValidationResult[] = [
        {
          criterion: 'Salary',
          met: true,
          score: 100,
          maxScore: 100,
          details: 'Meets requirement',
          isCritical: true,
          evidence: ['Salary: EUR 40,000 annual']
        },
        {
          criterion: 'Education',
          met: true,
          score: 100,
          maxScore: 100,
          details: 'Bachelor degree',
          isCritical: false,
          evidence: ['Education level: Bachelor']
        },
        {
          criterion: 'Experience',
          met: false,
          score: 50,
          maxScore: 100,
          details: 'Below requirement',
          recommendation: 'Gain 2 more years of experience',
          isCritical: false,
          evidence: ['Experience: 1 year', 'Required: 3 years'],
          missingReason: 'insufficient'
        }
      ]

      const scoreCalculation: ScoreCalculation = {
        baseScore: 83.33,
        penalties: [],
        totalPenalty: 0,
        adjustedScore: 83.33,
        finalScore: 83.33,
        breakdown: []
      }

      const prompt = promptBuilder.buildVisaSpecificPromptWithValidation(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo,
        validationResults,
        scoreCalculation
      )

      expect(prompt).toContain('### Salary [CRITICAL]')
      expect(prompt).toContain('### Education')
      expect(prompt).toContain('### Experience')
      expect(prompt).not.toContain('### Education [CRITICAL]')
    })

    it('should handle empty validation results', () => {
      const validationResults: ValidationResult[] = []

      const scoreCalculation: ScoreCalculation = {
        baseScore: 0,
        penalties: [],
        totalPenalty: 0,
        adjustedScore: 0,
        finalScore: 0,
        breakdown: []
      }

      const prompt = promptBuilder.buildVisaSpecificPromptWithValidation(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo,
        validationResults,
        scoreCalculation
      )

      expect(prompt).toContain('## Validation Results')
      expect(prompt).toContain('The following requirements have been validated')
      expect(prompt).toContain('## Score Calculation')
    })

    it('should handle visa criteria without critical requirements', () => {
      const visaCriteriaWithoutCritical: VisaCriteriaConfig = {
        ...mockVisaCriteria,
        criticalRequirements: undefined
      }

      const validationResults: ValidationResult[] = [
        {
          criterion: 'Salary',
          met: true,
          score: 100,
          maxScore: 100,
          details: 'Meets requirement',
          evidence: ['Salary: EUR 40,000 annual']
        }
      ]

      const scoreCalculation: ScoreCalculation = {
        baseScore: 100,
        penalties: [],
        totalPenalty: 0,
        adjustedScore: 100,
        finalScore: 100,
        breakdown: []
      }

      const prompt = promptBuilder.buildVisaSpecificPromptWithValidation(
        'Ireland',
        'Critical Skills Employment Permit',
        visaCriteriaWithoutCritical,
        mockParsedDocuments,
        mockUserInfo,
        validationResults,
        scoreCalculation
      )

      expect(prompt).not.toContain('## Critical Requirements Status')
      expect(prompt).toContain('## Validation Results')
    })

    it('should include visa description and processing time', () => {
      const validationResults: ValidationResult[] = []

      const scoreCalculation: ScoreCalculation = {
        baseScore: 75,
        penalties: [],
        totalPenalty: 0,
        adjustedScore: 75,
        finalScore: 75,
        breakdown: []
      }

      const prompt = promptBuilder.buildVisaSpecificPromptWithValidation(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo,
        validationResults,
        scoreCalculation
      )

      expect(prompt).toContain('**Description:** For highly skilled workers in shortage occupations')
      expect(prompt).toContain('**Processing Time:** 8-12 weeks')
      expect(prompt).toContain('**Path to Permanent Residency:** After 2 years')
    })
  })
})
