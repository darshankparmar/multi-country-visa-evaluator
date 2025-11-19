/**
 * Markdown Generator Service
 * 
 * Generates professional Markdown reports for visa evaluations
 */

import { IEvaluation } from '../types/evaluation.types'
import { logger } from '../config/logger'

export class MarkdownGenerator {
  /**
   * Generate a Markdown report for an evaluation
   * 
   * @param evaluation - Evaluation document
   * @returns Markdown string
   */
  generateEvaluationReport(evaluation: IEvaluation): string {
    try {
      const sections: string[] = []

      // Header
      sections.push(this.generateHeader(evaluation))
      
      // Evaluation details
      sections.push(this.generateEvaluationDetails(evaluation))
      
      // Score section
      sections.push(this.generateScoreSection(evaluation))
      
      // Summary section
      if (evaluation.results?.summary) {
        sections.push(this.generateSummarySection(evaluation.results.summary))
      }
      
      // Criteria Analysis (if available)
      if (evaluation.results?.criteriaAnalysis && evaluation.results.criteriaAnalysis.length > 0) {
        sections.push(this.generateCriteriaAnalysis(evaluation.results.criteriaAnalysis))
      }
      
      // Recommendations section
      if (evaluation.results?.prioritizedRecommendations && evaluation.results.prioritizedRecommendations.length > 0) {
        sections.push(this.generatePrioritizedRecommendations(evaluation.results.prioritizedRecommendations))
      } else if (evaluation.results?.recommendations && evaluation.results.recommendations.length > 0) {
        sections.push(this.generateRecommendations(evaluation.results.recommendations))
      }
      
      // Conclusion section
      if (evaluation.results?.conclusion) {
        sections.push(this.generateConclusionSection(evaluation.results.conclusion))
      }
      
      // Footer
      sections.push(this.generateFooter())
      
      const markdown = sections.join('\n\n---\n\n')
      
      logger.info('Markdown report generated successfully', {
        evaluationId: evaluation.evaluationId,
        length: markdown.length
      })
      
      return markdown
    } catch (error) {
      logger.error('Failed to generate Markdown report', {
        error: error instanceof Error ? error.message : 'Unknown error',
        evaluationId: evaluation.evaluationId
      })
      throw error
    }
  }

  /**
   * Generate header section
   */
  private generateHeader(evaluation: IEvaluation): string {
    return `# 🌍 Visa Evaluator

## Visa Evaluation Report

**Target Country:** ${evaluation.visaApplication.country}  
**Visa Type:** ${evaluation.visaApplication.visaType}`
  }

  /**
   * Generate evaluation details section
   */
  private generateEvaluationDetails(evaluation: IEvaluation): string {
    const evaluatedDate = evaluation.results?.evaluatedAt 
      ? new Date(evaluation.results.evaluatedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'N/A'

    return `## 📋 Evaluation Details

| Field | Value |
|-------|-------|
| **Applicant Name** | ${evaluation.userInfo.name} |
| **Email** | ${evaluation.userInfo.email} |
| **Target Country** | ${evaluation.visaApplication.country} |
| **Visa Type** | ${evaluation.visaApplication.visaType} |
| **Evaluation ID** | \`${evaluation.evaluationId}\` |
| **Evaluated On** | ${evaluatedDate} |`
  }

  /**
   * Generate score section
   */
  private generateScoreSection(evaluation: IEvaluation): string {
    if (!evaluation.results) return ''
    
    const score = evaluation.results.score
    const scoreLabel = this.getScoreLabel(score)
    const scoreEmoji = this.getScoreEmoji(score)
    
    let section = `## ${scoreEmoji} Evaluation Score

### ${score}/100 - ${scoreLabel}`

    if (evaluation.results.approvalLikelihood) {
      section += `\n\n**Approval Likelihood:** ${evaluation.results.approvalLikelihood}`
    }

    // Add score breakdown if available
    if (evaluation.results.scoreBreakdown) {
      section += '\n\n### Score Breakdown\n'
      
      if (evaluation.results.scoreBreakdown.baseScore !== undefined) {
        section += `\n- **Base Score:** ${evaluation.results.scoreBreakdown.baseScore.toFixed(1)}/100`
      }
      
      if (evaluation.results.scoreBreakdown.penalties && evaluation.results.scoreBreakdown.penalties.length > 0) {
        section += '\n\n**Penalties Applied:**\n'
        evaluation.results.scoreBreakdown.penalties.forEach(penalty => {
          section += `\n- ⚠️ **${penalty.requirement}:** -${penalty.points} points`
          section += `\n  - *${penalty.reason}*`
        })
        
        if (evaluation.results.scoreBreakdown.totalPenalty) {
          section += `\n\n- **Total Penalty:** -${evaluation.results.scoreBreakdown.totalPenalty.toFixed(1)} points`
        }
      }
      
      if (evaluation.results.scoreBreakdown.adjustedScore !== undefined) {
        section += `\n- **Final Score:** ${evaluation.results.scoreBreakdown.adjustedScore.toFixed(1)}/100`
      }
    }

    return section
  }

  /**
   * Generate summary section
   */
  private generateSummarySection(summary: string): string {
    return `## 📝 Evaluation Summary

${summary}`
  }

  /**
   * Generate criteria analysis section
   */
  private generateCriteriaAnalysis(criteriaAnalysis: any[]): string {
    let section = '## 🔍 Criteria Analysis\n'
    
    criteriaAnalysis.forEach((criterion, index) => {
      const ratingEmoji = this.getRatingEmoji(criterion.rating)
      const criticalBadge = criterion.isCritical ? ' 🔴 **CRITICAL**' : ''
      
      section += `\n### ${index + 1}. ${criterion.name}${criticalBadge}\n`
      section += `\n**Rating:** ${ratingEmoji} ${criterion.rating}\n`
      
      // Evidence
      if (criterion.evidence && criterion.evidence.length > 0) {
        section += '\n**✅ Evidence:**\n'
        criterion.evidence.forEach((ev: string) => {
          section += `- ${ev}\n`
        })
      }
      
      // Gaps
      if (criterion.gaps && criterion.gaps.length > 0) {
        section += '\n**❌ Gaps:**\n'
        criterion.gaps.forEach((gap: string) => {
          section += `- ${gap}\n`
        })
      }
      
      // Recommendation
      if (criterion.recommendation) {
        section += `\n**💡 Recommendation:** ${criterion.recommendation}\n`
      }
    })
    
    return section
  }

  /**
   * Generate prioritized recommendations section
   */
  private generatePrioritizedRecommendations(recommendations: any[]): string {
    let section = '## 💡 Recommendations\n'
    
    // Group by priority
    const critical = recommendations.filter(r => r.priority === 'CRITICAL')
    const high = recommendations.filter(r => r.priority === 'HIGH')
    const medium = recommendations.filter(r => r.priority === 'MEDIUM')
    const low = recommendations.filter(r => r.priority === 'LOW')
    
    if (critical.length > 0) {
      section += '\n### 🔴 Critical Priority\n'
      critical.forEach((rec, idx) => {
        section += `\n${idx + 1}. **${rec.text}**`
        if (rec.relatedCriterion) {
          section += `\n   - *Related to: ${rec.relatedCriterion}*`
        }
        section += '\n'
      })
    }
    
    if (high.length > 0) {
      section += '\n### 🟠 High Priority\n'
      high.forEach((rec, idx) => {
        section += `\n${idx + 1}. **${rec.text}**`
        if (rec.relatedCriterion) {
          section += `\n   - *Related to: ${rec.relatedCriterion}*`
        }
        section += '\n'
      })
    }
    
    if (medium.length > 0) {
      section += '\n### 🟡 Medium Priority\n'
      medium.forEach((rec, idx) => {
        section += `\n${idx + 1}. ${rec.text}`
        if (rec.relatedCriterion) {
          section += `\n   - *Related to: ${rec.relatedCriterion}*`
        }
        section += '\n'
      })
    }
    
    if (low.length > 0) {
      section += '\n### 🔵 Low Priority\n'
      low.forEach((rec, idx) => {
        section += `\n${idx + 1}. ${rec.text}`
        if (rec.relatedCriterion) {
          section += `\n   - *Related to: ${rec.relatedCriterion}*`
        }
        section += '\n'
      })
    }
    
    return section
  }

  /**
   * Generate regular recommendations section
   */
  private generateRecommendations(recommendations: string[]): string {
    let section = '## 💡 Recommendations\n'
    
    recommendations.forEach((rec, index) => {
      section += `\n${index + 1}. ${rec}`
    })
    
    return section
  }

  /**
   * Generate conclusion section
   */
  private generateConclusionSection(conclusion: string): string {
    return `## 🎯 Conclusion

${conclusion}`
  }

  /**
   * Generate footer
   */
  private generateFooter(): string {
    return `## ⚠️ Important Notice

> **Note:** We are a technology company that provides visa application assistance. We are not a law firm and do not provide legal advice. For legal counsel, please consult with a licensed immigration attorney.

---

*Thank you for using Visa Evaluator*  
*© 2025 Visa Evaluator. All rights reserved.*`
  }

  /**
   * Get score label
   */
  private getScoreLabel(score: number): string {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    if (score >= 20) return 'Needs Work'
    return 'Poor'
  }

  /**
   * Get score emoji
   */
  private getScoreEmoji(score: number): string {
    if (score >= 80) return '🌟'
    if (score >= 60) return '✅'
    if (score >= 40) return '⚠️'
    if (score >= 20) return '⚡'
    return '❌'
  }

  /**
   * Get rating emoji
   */
  private getRatingEmoji(rating: string): string {
    switch (rating) {
      case 'STRONG':
        return '💪'
      case 'GOOD':
        return '✅'
      case 'MODERATE':
        return '⚠️'
      case 'WEAK':
        return '⚡'
      case 'CRITICAL_GAP':
        return '❌'
      default:
        return '📊'
    }
  }
}
