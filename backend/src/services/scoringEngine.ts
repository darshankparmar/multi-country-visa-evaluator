/**
 * Scoring Engine Service
 * 
 * Calculates final scores from validation results with penalty system for
 * missing critical requirements. Provides transparent score breakdown.
 */

import { ValidationResult } from './criteriaValidator'
import { VisaCriteriaConfig } from '../config/visaCriteria'
import { logger } from '../config/logger'

/**
 * Details of a penalty applied for missing critical requirement
 */
export interface Penalty {
  /** Name of the critical requirement that was not met */
  requirement: string
  /** Penalty points deducted */
  points: number
  /** Reason for the penalty */
  reason: string
}

/**
 * Breakdown of a single criterion's contribution to the score
 */
export interface CriterionBreakdown {
  /** Name of the criterion */
  criterion: string
  /** Points awarded for this criterion */
  points: number
  /** Maximum possible points for this criterion */
  maxPoints: number
  /** Percentage score for this criterion */
  percentage: number
}

/**
 * Complete score calculation with breakdown and penalties
 */
export interface ScoreCalculation {
  /** Base score calculated from validation results (0-100) */
  baseScore: number
  /** Array of penalties applied for missing critical requirements */
  penalties: Penalty[]
  /** Total penalty points deducted */
  totalPenalty: number
  /** Score after applying penalties (baseScore - totalPenalty) */
  adjustedScore: number
  /** Final score (same as adjustedScore, kept for compatibility) */
  finalScore: number
  /** Detailed breakdown showing each criterion's contribution */
  breakdown: CriterionBreakdown[]
}

/**
 * Service for calculating scores from validation results with penalty system
 */
export class ScoringEngine {
  constructor() {
    logger.debug('ScoringEngine initialized')
  }

  /**
   * Calculate base score from validation results using weighted average
   * 
   * Uses criteriaWeights from visa configuration if available, otherwise
   * uses equal weighting. Handles missing validation results gracefully.
   * 
   * @param validationResults - Array of validation results from criteria validator
   * @param visaCriteria - Visa criteria configuration with optional weights
   * @returns Base score (0-100)
   */
  private calculateBaseScore(
    validationResults: ValidationResult[],
    visaCriteria: VisaCriteriaConfig
  ): number {
    if (!validationResults || validationResults.length === 0) {
      logger.warn('No validation results provided for base score calculation')
      return 0
    }

    // Get criteria weights from config or use equal weighting
    const weights = visaCriteria.criteriaWeights

    if (weights) {
      // Use configured weights
      logger.debug('Using configured criteria weights', { weights })
      
      let weightedScore = 0
      let totalWeight = 0

      for (const result of validationResults) {
        const criterionName = result.criterion.toLowerCase()
        let weight = 0

        // Map criterion to weight category
        if (criterionName.includes('salary')) {
          weight = weights.salary
        } else if (criterionName.includes('education')) {
          weight = weights.education
        } else if (criterionName.includes('experience')) {
          weight = weights.experience
        } else if (criterionName.includes('document')) {
          weight = weights.documentation
        } else {
          weight = weights.other
        }

        // Calculate percentage score for this criterion
        const percentage = result.maxScore > 0 ? (result.score / result.maxScore) * 100 : 0
        
        weightedScore += percentage * (weight / 100)
        totalWeight += weight

        logger.debug('Criterion contribution to base score', {
          criterion: result.criterion,
          score: result.score,
          maxScore: result.maxScore,
          percentage: percentage.toFixed(2),
          weight,
          contribution: (percentage * (weight / 100)).toFixed(2)
        })
      }

      // Normalize if weights don't sum to 100 (shouldn't happen with valid config)
      const baseScore = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0

      logger.info('Base score calculated with configured weights', {
        baseScore: baseScore.toFixed(2),
        totalWeight,
        validationResultsCount: validationResults.length
      })

      return Math.round(baseScore * 100) / 100 // Round to 2 decimal places
    } else {
      // Use equal weighting
      logger.debug('Using equal weighting for criteria')
      
      let totalScore = 0
      let totalMaxScore = 0

      for (const result of validationResults) {
        totalScore += result.score
        totalMaxScore += result.maxScore

        logger.debug('Criterion contribution to base score', {
          criterion: result.criterion,
          score: result.score,
          maxScore: result.maxScore
        })
      }

      const baseScore = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0

      logger.info('Base score calculated with equal weighting', {
        baseScore: baseScore.toFixed(2),
        totalScore,
        totalMaxScore,
        validationResultsCount: validationResults.length
      })

      return Math.round(baseScore * 100) / 100 // Round to 2 decimal places
    }
  }

  /**
   * Apply penalties for missing critical requirements
   * 
   * Checks each critical requirement against validation results and applies
   * penalty points for unmet requirements. Tracks penalty details and caps
   * total penalties at maxTotalPenalty.
   * 
   * @param validationResults - Array of validation results
   * @param visaCriteria - Visa criteria configuration with critical requirements
   * @returns Object with penalties array and total penalty amount
   */
  private applyPenalties(
    validationResults: ValidationResult[],
    visaCriteria: VisaCriteriaConfig
  ): { penalties: Penalty[]; totalPenalty: number } {
    const penalties: Penalty[] = []
    let totalPenalty = 0

    // Check if critical requirements are configured
    if (!visaCriteria.criticalRequirements) {
      logger.debug('No critical requirements configured for this visa type')
      return { penalties, totalPenalty }
    }

    const criticalConfig = visaCriteria.criticalRequirements
    const maxTotalPenalty = criticalConfig.maxTotalPenalty ?? 60

    logger.debug('Checking critical requirements', {
      requirements: criticalConfig.requirements,
      maxTotalPenalty
    })

    // Check each critical requirement
    for (const requirement of criticalConfig.requirements) {
      const penaltyPoints = criticalConfig.penalties[requirement]

      if (penaltyPoints === undefined) {
        logger.warn('No penalty defined for critical requirement', { requirement })
        continue
      }

      // Find corresponding validation result
      // Match by checking if criterion name contains the requirement keyword
      const validationResult = validationResults.find(result => 
        result.criterion.toLowerCase().includes(requirement.toLowerCase()) ||
        requirement.toLowerCase().includes(result.criterion.toLowerCase())
      )

      if (!validationResult) {
        // Requirement not validated - apply penalty
        const penalty: Penalty = {
          requirement,
          points: penaltyPoints,
          reason: 'Requirement not validated - information not found in documents'
        }
        penalties.push(penalty)
        totalPenalty += penaltyPoints

        logger.info('Penalty applied for missing validation', {
          requirement,
          penaltyPoints,
          reason: penalty.reason
        })
      } else if (!validationResult.met) {
        // Requirement validated but not met - apply penalty
        const penalty: Penalty = {
          requirement,
          points: penaltyPoints,
          reason: validationResult.missingReason === 'not_found'
            ? 'Required information not found in documents'
            : validationResult.missingReason === 'insufficient'
            ? 'Requirement not met - insufficient qualification'
            : 'Requirement not met'
        }
        penalties.push(penalty)
        totalPenalty += penaltyPoints

        logger.info('Penalty applied for unmet requirement', {
          requirement,
          criterion: validationResult.criterion,
          penaltyPoints,
          reason: penalty.reason,
          details: validationResult.details
        })
      } else {
        // Requirement met - no penalty
        logger.debug('Critical requirement met - no penalty', {
          requirement,
          criterion: validationResult.criterion
        })
      }
    }

    // Cap total penalties at maxTotalPenalty
    if (totalPenalty > maxTotalPenalty) {
      logger.warn('Total penalties exceed maximum, capping at maxTotalPenalty', {
        calculatedPenalty: totalPenalty,
        maxTotalPenalty,
        penaltiesCount: penalties.length
      })

      // Proportionally reduce penalties to fit within cap
      const scaleFactor = maxTotalPenalty / totalPenalty
      penalties.forEach(penalty => {
        penalty.points = Math.round(penalty.points * scaleFactor)
      })
      totalPenalty = maxTotalPenalty
    }

    logger.info('Penalties calculation complete', {
      totalPenalties: penalties.length,
      totalPenaltyPoints: totalPenalty,
      maxTotalPenalty,
      penalties: penalties.map(p => ({
        requirement: p.requirement,
        points: p.points
      }))
    })

    return { penalties, totalPenalty }
  }

  /**
   * Calculate complete score from validation results with penalties
   * 
   * This is the main public method that orchestrates the scoring process:
   * 1. Calculate base score from validation results
   * 2. Apply penalties for missing critical requirements
   * 3. Calculate adjusted score (baseScore - totalPenalty)
   * 4. Generate breakdown showing each criterion's contribution
   * 
   * @param validationResults - Array of validation results from criteria validator
   * @param visaCriteria - Visa criteria configuration
   * @returns Complete ScoreCalculation object with breakdown and penalties
   */
  calculateScore(
    validationResults: ValidationResult[],
    visaCriteria: VisaCriteriaConfig
  ): ScoreCalculation {
    logger.info('Starting score calculation', {
      country: visaCriteria.country,
      visaType: visaCriteria.visaType,
      validationResultsCount: validationResults.length,
      hasCriticalRequirements: !!visaCriteria.criticalRequirements
    })

    // Step 1: Calculate base score from validation results
    const baseScore = this.calculateBaseScore(validationResults, visaCriteria)

    // Step 2: Apply penalties for missing critical requirements
    const { penalties, totalPenalty } = this.applyPenalties(validationResults, visaCriteria)

    // Step 3: Calculate adjusted score (ensure it doesn't go below 0)
    const adjustedScore = Math.max(0, baseScore - totalPenalty)
    const finalScore = adjustedScore

    // Step 4: Generate breakdown showing each criterion's contribution
    const breakdown: CriterionBreakdown[] = validationResults.map(result => {
      const percentage = result.maxScore > 0 
        ? Math.round((result.score / result.maxScore) * 100 * 100) / 100 
        : 0

      return {
        criterion: result.criterion,
        points: result.score,
        maxPoints: result.maxScore,
        percentage
      }
    })

    const scoreCalculation: ScoreCalculation = {
      baseScore,
      penalties,
      totalPenalty,
      adjustedScore,
      finalScore,
      breakdown
    }

    logger.info('Score calculation complete', {
      baseScore: baseScore.toFixed(2),
      totalPenalty: totalPenalty.toFixed(2),
      adjustedScore: adjustedScore.toFixed(2),
      finalScore: finalScore.toFixed(2),
      penaltiesApplied: penalties.length,
      criteriaEvaluated: breakdown.length
    })

    // Log detailed breakdown
    logger.debug('Score breakdown details', {
      breakdown: breakdown.map(b => ({
        criterion: b.criterion,
        points: b.points,
        maxPoints: b.maxPoints,
        percentage: b.percentage
      })),
      penalties: penalties.map(p => ({
        requirement: p.requirement,
        points: p.points,
        reason: p.reason
      }))
    })

    return scoreCalculation
  }
}
