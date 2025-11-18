/**
 * Criteria Validator Service
 * 
 * Validates applicant data against visa-specific criteria to determine
 * if mandatory requirements are met and calculate scores for each criterion.
 */

import { VisaCriteriaConfig, SalaryThreshold } from '../config/visaCriteria'
import { logger } from '../config/logger'

/**
 * Result of validating a single criterion
 */
export interface ValidationResult {
  /** Name of the criterion being validated */
  criterion: string
  /** Whether the criterion requirement is met */
  met: boolean
  /** Score awarded for this criterion (0 to maxScore) */
  score: number
  /** Maximum possible score for this criterion */
  maxScore: number
  /** Detailed explanation of the validation result */
  details: string
  /** Optional recommendation for improvement if criterion not met */
  recommendation?: string
}

/**
 * Applicant data extracted from documents
 */
export interface ApplicantData {
  /** Applicant's name */
  name: string
  /** Applicant's email */
  email: string
  /** Offered or current salary (annual or monthly depending on context) */
  salary?: number
  /** Currency of the salary */
  salaryCurrency?: string
  /** Salary period (annual or monthly) */
  salaryPeriod?: 'annual' | 'monthly'
  /** Highest education level attained */
  education?: string
  /** Years of professional experience */
  experienceYears?: number
  /** Job title or occupation */
  occupation?: string
  /** Age of applicant (for age-based thresholds) */
  age?: number
}

/**
 * Service for validating applicant data against visa-specific criteria
 */
export class CriteriaValidator {
  constructor() {
    logger.debug('CriteriaValidator initialized')
  }

  /**
   * Validate salary against visa requirements
   * 
   * Handles multiple salary thresholds with conditions (age-based, occupation-based).
   * Returns a validation result with score and recommendations.
   * 
   * @param offeredSalary - Applicant's offered salary
   * @param salaryCurrency - Currency of the offered salary
   * @param salaryPeriod - Period of the offered salary (annual or monthly)
   * @param thresholds - Array of salary thresholds from visa criteria
   * @param applicantAge - Optional age for age-based thresholds
   * @param occupation - Optional occupation for occupation-based thresholds
   * @returns ValidationResult with score and details
   */
  validateSalary(
    offeredSalary: number | undefined,
    salaryCurrency: string | undefined,
    salaryPeriod: 'annual' | 'monthly' | undefined,
    thresholds: SalaryThreshold[],
    applicantAge?: number,
    occupation?: string
  ): ValidationResult {
    const maxScore = 100

    // If no salary data provided
    if (offeredSalary === undefined || !salaryCurrency || !salaryPeriod) {
      logger.debug('Salary validation: missing salary data')
      return {
        criterion: 'Salary',
        met: false,
        score: 0,
        maxScore,
        details: 'Salary information not found in documents',
        recommendation: 'Please provide a job offer letter or employment contract with clear salary details'
      }
    }

    // If no thresholds defined, salary requirement is not applicable
    if (!thresholds || thresholds.length === 0) {
      logger.debug('Salary validation: no thresholds defined')
      return {
        criterion: 'Salary',
        met: true,
        score: maxScore,
        maxScore,
        details: 'No specific salary requirement for this visa type'
      }
    }

    // Normalize salary to annual for comparison
    const normalizedSalary = salaryPeriod === 'monthly' ? offeredSalary * 12 : offeredSalary

    // Find the most applicable threshold based on conditions
    let applicableThreshold: SalaryThreshold | null = null
    let lowestThreshold: SalaryThreshold | null = null

    for (const threshold of thresholds) {
      // Normalize threshold to annual
      const normalizedThreshold = threshold.period === 'monthly' ? threshold.amount * 12 : threshold.amount
      
      // Track lowest threshold
      if (!lowestThreshold || normalizedThreshold < (lowestThreshold.period === 'monthly' ? lowestThreshold.amount * 12 : lowestThreshold.amount)) {
        lowestThreshold = threshold
      }

      // Check if this threshold applies based on conditions
      if (!threshold.conditions) {
        // No conditions - this is a general threshold
        applicableThreshold = threshold
      } else {
        const conditions = threshold.conditions.toLowerCase()
        
        // Age-based conditions
        if (applicantAge !== undefined) {
          if (conditions.includes('under 30') && applicantAge < 30) {
            applicableThreshold = threshold
            break
          } else if (conditions.includes('30 years or older') && applicantAge >= 30) {
            applicableThreshold = threshold
            break
          }
        }
        
        // Occupation-based conditions
        if (occupation) {
          const occupationLower = occupation.toLowerCase()
          if (conditions.includes('critical') && occupationLower.includes('critical')) {
            applicableThreshold = threshold
            break
          } else if (conditions.includes('shortage') && occupationLower.includes('shortage')) {
            applicableThreshold = threshold
            break
          }
        }
        
        // If no specific match but this is the only threshold, use it
        if (thresholds.length === 1) {
          applicableThreshold = threshold
        }
      }
    }

    // Use the lowest threshold if no specific match found
    if (!applicableThreshold && lowestThreshold) {
      applicableThreshold = lowestThreshold
    }

    if (!applicableThreshold) {
      logger.warn('Salary validation: no applicable threshold found')
      return {
        criterion: 'Salary',
        met: false,
        score: 0,
        maxScore,
        details: 'Unable to determine applicable salary threshold',
        recommendation: 'Please verify visa requirements and provide additional context'
      }
    }

    // Normalize applicable threshold to annual
    const thresholdAmount = applicableThreshold.period === 'monthly' 
      ? applicableThreshold.amount * 12 
      : applicableThreshold.amount

    // Calculate how much the salary meets the threshold
    const percentageOfThreshold = (normalizedSalary / thresholdAmount) * 100

    // Determine if requirement is met
    const met = normalizedSalary >= thresholdAmount

    // Calculate score (full score if met, proportional if close)
    let score: number
    if (met) {
      // Award full score if threshold met
      score = maxScore
    } else {
      // Award proportional score if within 90% of threshold
      score = Math.max(0, Math.min(maxScore * 0.9, (percentageOfThreshold / 100) * maxScore))
    }

    // Format amounts for display
    const formatAmount = (amount: number, currency: string, period: 'annual' | 'monthly') => {
      return `${currency} ${amount.toLocaleString()} ${period}`
    }

    const details = met
      ? `Salary of ${formatAmount(offeredSalary, salaryCurrency, salaryPeriod)} meets the requirement of ${formatAmount(applicableThreshold.amount, applicableThreshold.currency, applicableThreshold.period)}${applicableThreshold.conditions ? ` (${applicableThreshold.conditions})` : ''}. Exceeds threshold by ${(percentageOfThreshold - 100).toFixed(1)}%.`
      : `Salary of ${formatAmount(offeredSalary, salaryCurrency, salaryPeriod)} is below the requirement of ${formatAmount(applicableThreshold.amount, applicableThreshold.currency, applicableThreshold.period)}${applicableThreshold.conditions ? ` (${applicableThreshold.conditions})` : ''}. Currently at ${percentageOfThreshold.toFixed(1)}% of required threshold.`

    const recommendation = met
      ? undefined
      : `Increase salary to at least ${formatAmount(applicableThreshold.amount, applicableThreshold.currency, applicableThreshold.period)} to meet visa requirements${applicableThreshold.conditions ? ` (${applicableThreshold.conditions})` : ''}`

    logger.info('Salary validation complete', {
      criterion: 'Salary',
      offeredSalary,
      salaryCurrency,
      salaryPeriod,
      threshold: thresholdAmount,
      thresholdCurrency: applicableThreshold.currency,
      thresholdPeriod: applicableThreshold.period,
      thresholdConditions: applicableThreshold.conditions,
      met,
      score,
      maxScore,
      percentageOfThreshold: percentageOfThreshold.toFixed(1),
      hasRecommendation: !!recommendation
    })

    return {
      criterion: 'Salary',
      met,
      score,
      maxScore,
      details,
      recommendation
    }
  }

  /**
   * Validate education level against visa requirements
   * 
   * Supports education levels (High School, Bachelor, Master, PhD) and
   * handles alternative qualifications (equivalent experience).
   * 
   * @param applicantEducation - Applicant's education level
   * @param requiredLevel - Required education level from visa criteria
   * @param alternativeQualification - Alternative qualification description
   * @param experienceYears - Years of experience (for alternative qualification)
   * @returns ValidationResult with details
   */
  validateEducation(
    applicantEducation: string | undefined,
    requiredLevel: string | undefined,
    alternativeQualification?: string,
    experienceYears?: number
  ): ValidationResult {
    const maxScore = 100

    // If no education requirement
    if (!requiredLevel || requiredLevel === 'None') {
      logger.debug('Education validation: no education requirement')
      return {
        criterion: 'Education',
        met: true,
        score: maxScore,
        maxScore,
        details: 'No specific education requirement for this visa type'
      }
    }

    // If no education data provided
    if (!applicantEducation) {
      logger.debug('Education validation: missing education data')
      
      // Check if alternative qualification might apply
      if (alternativeQualification && experienceYears !== undefined && experienceYears >= 5) {
        return {
          criterion: 'Education',
          met: true,
          score: maxScore * 0.8, // Slightly lower score for alternative path
          maxScore,
          details: `Education level not specified, but ${experienceYears} years of experience may qualify under alternative qualification: ${alternativeQualification}`,
          recommendation: 'Verify that your experience meets the alternative qualification requirements'
        }
      }

      return {
        criterion: 'Education',
        met: false,
        score: 0,
        maxScore,
        details: 'Education information not found in documents',
        recommendation: `Please provide proof of ${requiredLevel} degree or equivalent qualification`
      }
    }

    // Education level hierarchy
    const educationLevels: Record<string, number> = {
      'None': 0,
      'High School': 1,
      'Bachelor': 2,
      'Master': 3,
      'PhD': 4
    }

    // Normalize education strings for comparison
    const normalizeEducation = (edu: string): string => {
      const eduLower = edu.toLowerCase()
      if (eduLower.includes('phd') || eduLower.includes('doctorate') || eduLower.includes('doctoral')) {
        return 'PhD'
      } else if (eduLower.includes('master') || eduLower.includes('msc') || eduLower.includes('mba') || eduLower.includes('ma ')) {
        return 'Master'
      } else if (eduLower.includes('bachelor') || eduLower.includes('bsc') || eduLower.includes('ba ') || eduLower.includes('undergraduate')) {
        return 'Bachelor'
      } else if (eduLower.includes('high school') || eduLower.includes('secondary') || eduLower.includes('diploma')) {
        return 'High School'
      }
      return edu
    }

    const normalizedApplicant = normalizeEducation(applicantEducation)
    const normalizedRequired = normalizeEducation(requiredLevel)

    const applicantLevel = educationLevels[normalizedApplicant] ?? -1
    const requiredLevelNum = educationLevels[normalizedRequired] ?? 0

    // Check if education meets requirement
    let met = applicantLevel >= requiredLevelNum

    let score: number
    let details: string
    let recommendation: string | undefined

    if (met) {
      // Full score if requirement met or exceeded
      score = maxScore
      
      if (applicantLevel > requiredLevelNum) {
        details = `Education level (${normalizedApplicant}) exceeds the requirement (${normalizedRequired}). Strong qualification.`
      } else {
        details = `Education level (${normalizedApplicant}) meets the requirement (${normalizedRequired}).`
      }
    } else {
      // Check if alternative qualification applies
      if (alternativeQualification && experienceYears !== undefined) {
        // Typically 3-5 years experience can substitute for education
        const yearsNeeded = (requiredLevelNum - applicantLevel) * 3
        
        if (experienceYears >= yearsNeeded) {
          score = maxScore * 0.85 // Slightly lower score for alternative path
          met = true
          details = `Education level (${normalizedApplicant || 'Not specified'}) is below requirement (${normalizedRequired}), but ${experienceYears} years of experience qualifies under alternative qualification: ${alternativeQualification}`
        } else {
          score = Math.max(0, (experienceYears / yearsNeeded) * maxScore * 0.5)
          details = `Education level (${normalizedApplicant || 'Not specified'}) is below requirement (${normalizedRequired}). ${experienceYears} years of experience provided, but ${yearsNeeded} years needed for alternative qualification.`
          recommendation = `Obtain ${normalizedRequired} degree or gain ${yearsNeeded - experienceYears} more years of relevant experience to meet alternative qualification: ${alternativeQualification}`
        }
      } else {
        // No alternative qualification available
        score = applicantLevel > 0 ? (applicantLevel / requiredLevelNum) * maxScore * 0.5 : 0
        details = `Education level (${normalizedApplicant || 'Not specified'}) is below the requirement (${normalizedRequired}).`
        recommendation = `Obtain ${normalizedRequired} degree to meet visa requirements${alternativeQualification ? `, or consider alternative qualification: ${alternativeQualification}` : ''}`
      }
    }

    logger.info('Education validation complete', {
      criterion: 'Education',
      applicantEducation: normalizedApplicant || 'Not specified',
      requiredLevel: normalizedRequired,
      alternativeQualification,
      experienceYears,
      met,
      score,
      maxScore,
      usedAlternativeQualification: alternativeQualification && experienceYears !== undefined && !met,
      hasRecommendation: !!recommendation
    })

    return {
      criterion: 'Education',
      met,
      score,
      maxScore,
      details,
      recommendation
    }
  }

  /**
   * Validate work experience against visa requirements
   * 
   * Checks minimum years requirement and awards bonus points for exceeding minimum.
   * 
   * @param applicantExperience - Years of professional experience
   * @param requiredYears - Minimum years required from visa criteria
   * @returns ValidationResult with recommendation
   */
  validateExperience(
    applicantExperience: number | undefined,
    requiredYears: number | undefined
  ): ValidationResult {
    const maxScore = 100

    // If no experience requirement
    if (requiredYears === undefined || requiredYears === 0) {
      logger.debug('Experience validation: no experience requirement')
      return {
        criterion: 'Experience',
        met: true,
        score: maxScore,
        maxScore,
        details: 'No specific experience requirement for this visa type'
      }
    }

    // If no experience data provided
    if (applicantExperience === undefined) {
      logger.debug('Experience validation: missing experience data')
      return {
        criterion: 'Experience',
        met: false,
        score: 0,
        maxScore,
        details: 'Work experience information not found in documents',
        recommendation: `Please provide proof of at least ${requiredYears} year${requiredYears !== 1 ? 's' : ''} of relevant professional experience`
      }
    }

    // Check if requirement is met
    const met = applicantExperience >= requiredYears

    let score: number
    let details: string
    let recommendation: string | undefined

    if (met) {
      // Base score for meeting requirement
      score = maxScore * 0.8

      // Award bonus points for exceeding minimum (up to 20% bonus)
      const excessYears = applicantExperience - requiredYears
      const bonusPoints = Math.min(maxScore * 0.2, excessYears * 5)
      score = Math.min(maxScore, score + bonusPoints)

      if (excessYears > 0) {
        details = `${applicantExperience} years of experience exceeds the requirement of ${requiredYears} year${requiredYears !== 1 ? 's' : ''} by ${excessYears} year${excessYears !== 1 ? 's' : ''}. Strong qualification.`
      } else {
        details = `${applicantExperience} years of experience meets the requirement of ${requiredYears} year${requiredYears !== 1 ? 's' : ''}.`
      }
    } else {
      // Proportional score if close to requirement
      const percentageOfRequired = (applicantExperience / requiredYears) * 100
      score = Math.max(0, (percentageOfRequired / 100) * maxScore * 0.7)

      const shortfall = requiredYears - applicantExperience
      details = `${applicantExperience} year${applicantExperience !== 1 ? 's' : ''} of experience is below the requirement of ${requiredYears} year${requiredYears !== 1 ? 's' : ''}. Short by ${shortfall.toFixed(1)} year${shortfall !== 1 ? 's' : ''}.`
      recommendation = `Gain at least ${shortfall.toFixed(1)} more year${shortfall !== 1 ? 's' : ''} of relevant professional experience to meet visa requirements`
    }

    logger.info('Experience validation complete', {
      criterion: 'Experience',
      applicantExperience: applicantExperience !== undefined ? applicantExperience : 'Not specified',
      requiredYears,
      met,
      score,
      maxScore,
      excessYears: met ? (applicantExperience! - requiredYears).toFixed(1) : undefined,
      shortfall: !met && applicantExperience !== undefined ? (requiredYears - applicantExperience).toFixed(1) : undefined,
      hasRecommendation: !!recommendation
    })

    return {
      criterion: 'Experience',
      met,
      score,
      maxScore,
      details,
      recommendation
    }
  }

  /**
   * Validate all criteria for a visa type
   * 
   * Validates salary, education, and experience requirements.
   * Returns array of validation results and logs for audit.
   * 
   * @param applicantData - Applicant's data extracted from documents
   * @param visaCriteria - Visa criteria configuration
   * @returns Array of ValidationResult objects
   */
  validateAllCriteria(
    applicantData: ApplicantData,
    visaCriteria: VisaCriteriaConfig
  ): ValidationResult[] {
    logger.info('Starting comprehensive criteria validation', {
      country: visaCriteria.country,
      visaType: visaCriteria.visaType,
      applicant: applicantData.name
    })

    const results: ValidationResult[] = []

    // Validate salary if thresholds are defined
    if (visaCriteria.salaryThresholds && visaCriteria.salaryThresholds.length > 0) {
      const salaryResult = this.validateSalary(
        applicantData.salary,
        applicantData.salaryCurrency,
        applicantData.salaryPeriod,
        visaCriteria.salaryThresholds,
        applicantData.age,
        applicantData.occupation
      )
      results.push(salaryResult)
      
      logger.info('Salary validation result', {
        criterion: 'Salary',
        met: salaryResult.met,
        score: salaryResult.score,
        maxScore: salaryResult.maxScore
      })
    }

    // Validate education if requirement is defined
    if (visaCriteria.educationLevel) {
      const educationResult = this.validateEducation(
        applicantData.education,
        visaCriteria.educationLevel,
        visaCriteria.alternativeQualification,
        applicantData.experienceYears
      )
      results.push(educationResult)
      
      logger.info('Education validation result', {
        criterion: 'Education',
        met: educationResult.met,
        score: educationResult.score,
        maxScore: educationResult.maxScore
      })
    }

    // Validate experience if requirement is defined
    if (visaCriteria.experienceYears !== undefined && visaCriteria.experienceYears > 0) {
      const experienceResult = this.validateExperience(
        applicantData.experienceYears,
        visaCriteria.experienceYears
      )
      results.push(experienceResult)
      
      logger.info('Experience validation result', {
        criterion: 'Experience',
        met: experienceResult.met,
        score: experienceResult.score,
        maxScore: experienceResult.maxScore
      })
    }

    // Log summary of validation
    const metCount = results.filter(r => r.met).length
    const totalScore = results.reduce((sum, r) => sum + r.score, 0)
    const maxTotalScore = results.reduce((sum, r) => sum + r.maxScore, 0)
    const averageScore = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0

    logger.info('Comprehensive validation complete', {
      country: visaCriteria.country,
      visaType: visaCriteria.visaType,
      totalCriteria: results.length,
      criteriaMet: metCount,
      averageScore: averageScore.toFixed(1),
      results: results.map(r => ({
        criterion: r.criterion,
        met: r.met,
        score: r.score
      }))
    })

    return results
  }
}
