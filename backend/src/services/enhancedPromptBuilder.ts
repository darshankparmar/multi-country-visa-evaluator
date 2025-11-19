/**
 * Enhanced Prompt Builder Service
 * 
 * Builds AI prompts with visa-specific criteria for more accurate evaluations.
 * Formats visa requirements, mandatory criteria, and creates structured checklists
 * for the AI to evaluate against.
 */

import { VisaCriteriaConfig, SalaryThreshold } from '../config/visaCriteria'
import { ParsedDocument } from './documentParser'
import { ValidationResult } from './criteriaValidator'
import { ScoreCalculation } from './scoringEngine'
import { logger } from '../config/logger'

/**
 * Service for building visa-specific AI prompts
 */
export class EnhancedPromptBuilder {
  constructor() {
    logger.debug('EnhancedPromptBuilder initialized')
  }

  /**
   * Build evaluation prompt with visa-specific criteria
   * 
   * Creates a comprehensive prompt that includes:
   * - Visa type description and purpose
   * - Mandatory requirements checklist
   * - Formatted criteria with thresholds
   * - Document content for analysis
   * - Specific evaluation instructions
   * 
   * @param country - Country name
   * @param visaType - Visa type name
   * @param visaCriteria - Visa criteria configuration
   * @param parsedDocuments - Array of parsed documents with extracted text
   * @param userInfo - User information (name and email)
   * @returns Formatted prompt string for AI evaluation
   */
  buildVisaSpecificPrompt(
    country: string,
    visaType: string,
    visaCriteria: VisaCriteriaConfig,
    parsedDocuments: ParsedDocument[],
    userInfo: { name: string; email: string }
  ): string {
    logger.debug('Building visa-specific prompt', {
      country,
      visaType,
      documentCount: parsedDocuments.length
    })

    // Build the prompt sections
    const sections: string[] = []

    // Header section
    sections.push(`# Visa Evaluation Request`)
    sections.push(``)
    sections.push(`**Applicant:** ${userInfo.name}`)
    sections.push(`**Email:** ${userInfo.email}`)
    sections.push(`**Target Country:** ${country}`)
    sections.push(`**Visa Type:** ${visaType}`)
    sections.push(``)

    // Visa description section
    sections.push(`## Visa Type Information`)
    sections.push(``)
    sections.push(`**Description:** ${visaCriteria.description}`)
    
    if (visaCriteria.processingTime) {
      sections.push(`**Processing Time:** ${visaCriteria.processingTime}`)
    }
    
    if (visaCriteria.pathToPermanentResidency) {
      sections.push(`**Path to Permanent Residency:** ${visaCriteria.pathToPermanentResidency}`)
    }
    sections.push(``)

    // Mandatory requirements checklist
    sections.push(`## Mandatory Requirements Checklist`)
    sections.push(``)
    sections.push(`Please evaluate the applicant's documents against the following mandatory requirements:`)
    sections.push(``)
    sections.push(this.buildCriteriaChecklist(visaCriteria))
    sections.push(``)

    // Detailed criteria section
    sections.push(`## Detailed Visa Criteria`)
    sections.push(``)
    sections.push(this.formatCriteriaForPrompt(visaCriteria))
    sections.push(``)

    // Documents section
    sections.push(`## Applicant Documents`)
    sections.push(``)
    sections.push(`The following documents have been provided by the applicant:`)
    sections.push(``)

    const successfulDocs = parsedDocuments.filter(d => d.success)
    const failedDocs = parsedDocuments.filter(d => !d.success)

    if (successfulDocs.length > 0) {
      successfulDocs.forEach((doc, index) => {
        sections.push(`### Document ${index + 1}: ${doc.originalName} (${doc.documentType})`)
        sections.push(``)
        sections.push('```')
        sections.push(doc.extractedText)
        sections.push('```')
        sections.push(``)
      })
    }

    if (failedDocs.length > 0) {
      sections.push(`### Failed to Parse:`)
      failedDocs.forEach(doc => {
        sections.push(`- ${doc.originalName}: ${doc.error || 'Unknown error'}`)
      })
      sections.push(``)
    }

    // Evaluation instructions
    sections.push(`## Evaluation Instructions`)
    sections.push(``)
    sections.push(`Please provide a comprehensive evaluation that:`)
    sections.push(``)
    sections.push(`1. **Verifies each mandatory requirement** from the checklist above`)
    sections.push(`2. **Extracts key information** from the documents (salary, education, experience, etc.)`)
    sections.push(`3. **Compares extracted data** against the specific thresholds and requirements`)
    sections.push(`4. **Identifies gaps or deficiencies** in meeting the visa criteria`)
    sections.push(`5. **Provides specific, actionable recommendations** based on actual visa requirements`)
    sections.push(`6. **Assesses overall approval likelihood** based on how well the applicant meets the criteria`)
    sections.push(``)
    sections.push(`Be objective and cite specific requirements. Focus on the legal requirements for ${visaType}.`)
    sections.push(``)
    sections.push(`## Response Format`)
    sections.push(``)
    sections.push(`**IMPORTANT: You MUST respond ONLY with a valid JSON object. Do not include any text before or after the JSON.**`)
    sections.push(``)
    sections.push(`Respond with a JSON object in exactly this format:`)
    sections.push(``)
    sections.push(`{`)
    sections.push(`  "score": <number between 0-100>,`)
    sections.push(`  "summary": "<comprehensive markdown-formatted summary of the evaluation including all requirements verification, detailed criteria evaluation, and assessment>",`)
    sections.push(`  "recommendations": [`)
    sections.push(`    "<specific actionable recommendation 1>",`)
    sections.push(`    "<specific actionable recommendation 2>",`)
    sections.push(`    "<specific actionable recommendation 3>"`)
    sections.push(`  ],`)
    sections.push(`  "conclusion": "<clear statement about application viability, approval likelihood, and next steps>"`)
    sections.push(`}`)
    sections.push(``)
    sections.push(`**Requirements:**`)
    sections.push(`- Score must be between 0-100 based on how well the applicant meets visa requirements`)
    sections.push(`- Summary must be comprehensive and in markdown format with proper sections`)
    sections.push(`- Recommendations must be specific, actionable, and based on actual gaps`)
    sections.push(`- Conclusion must clearly state the approval likelihood`)
    sections.push(`- Response must be ONLY valid JSON, nothing else`)

    const prompt = sections.join('\n')

    logger.debug('Visa-specific prompt built', {
      country,
      visaType,
      promptLength: prompt.length,
      sectionsCount: sections.length
    })

    return prompt
  }

  /**
   * Format visa criteria for AI prompt
   * 
   * Creates a detailed, human-readable description of all visa criteria
   * including salary thresholds, education requirements, experience, and
   * process requirements.
   * 
   * @param criteria - Visa criteria configuration
   * @returns Formatted criteria string
   */
  private formatCriteriaForPrompt(criteria: VisaCriteriaConfig): string {
    const parts: string[] = []

    // Salary requirements
    if (criteria.salaryThresholds && criteria.salaryThresholds.length > 0) {
      parts.push(`### Salary Requirements`)
      parts.push(``)
      
      if (criteria.salaryThresholds.length === 1) {
        const threshold = criteria.salaryThresholds[0]
        parts.push(`- **Minimum Salary:** ${this.formatSalaryThreshold(threshold)}`)
      } else {
        parts.push(`The visa has multiple salary thresholds depending on circumstances:`)
        parts.push(``)
        criteria.salaryThresholds.forEach((threshold, index) => {
          parts.push(`${index + 1}. ${this.formatSalaryThreshold(threshold)}`)
        })
      }
      parts.push(``)
    }

    // Education requirements
    if (criteria.educationLevel && criteria.educationLevel !== 'None') {
      parts.push(`### Education Requirements`)
      parts.push(``)
      parts.push(`- **Required Level:** ${criteria.educationLevel} degree`)
      
      if (criteria.alternativeQualification) {
        parts.push(`- **Alternative Qualification:** ${criteria.alternativeQualification}`)
      }
      parts.push(``)
    } else if (criteria.educationLevel === 'None' && criteria.alternativeQualification) {
      parts.push(`### Qualification Requirements`)
      parts.push(``)
      parts.push(`- **Qualification:** ${criteria.alternativeQualification}`)
      parts.push(``)
    }

    // Experience requirements
    if (criteria.experienceYears !== undefined && criteria.experienceYears > 0) {
      parts.push(`### Experience Requirements`)
      parts.push(``)
      parts.push(`- **Minimum Experience:** ${criteria.experienceYears} year${criteria.experienceYears !== 1 ? 's' : ''} of relevant professional experience`)
      parts.push(``)
    }

    // Labor market test
    parts.push(`### Labor Market Test`)
    parts.push(``)
    if (criteria.laborMarketTestRequired) {
      parts.push(`- **Required:** Yes - Employer must demonstrate that no suitable local workers are available`)
      parts.push(`- This is a mandatory step that the employer must complete before the visa application`)
    } else {
      parts.push(`- **Required:** No - This is an advantage as it simplifies the application process`)
    }
    parts.push(``)

    // Sponsor requirements
    parts.push(`### Sponsor Requirements`)
    parts.push(``)
    if (criteria.sponsorRequired) {
      parts.push(`- **Sponsor Required:** Yes`)
      if (criteria.sponsorType) {
        parts.push(`- **Sponsor Type:** ${criteria.sponsorType}`)
      }
      parts.push(`- The employer must meet specific registration or recognition requirements`)
    } else {
      parts.push(`- **Sponsor Required:** No - Applicant can apply independently`)
    }
    parts.push(``)

    // Family reunification
    if (criteria.familyReunification !== undefined) {
      parts.push(`### Family Reunification`)
      parts.push(``)
      if (criteria.familyReunification) {
        parts.push(`- **Allowed:** Yes - Spouses and dependents can accompany the visa holder`)
      } else {
        parts.push(`- **Allowed:** No - Family members cannot automatically accompany the visa holder`)
      }
      parts.push(``)
    }

    // Unique rules and benefits
    if (criteria.uniqueRules && criteria.uniqueRules.length > 0) {
      parts.push(`### Special Rules and Benefits`)
      parts.push(``)
      criteria.uniqueRules.forEach(rule => {
        parts.push(`- ${rule}`)
      })
      parts.push(``)
    }

    // Criteria weights (for transparency)
    if (criteria.criteriaWeights) {
      parts.push(`### Evaluation Weights`)
      parts.push(``)
      parts.push(`The following weights are used in scoring:`)
      parts.push(`- Salary: ${criteria.criteriaWeights.salary}%`)
      parts.push(`- Education: ${criteria.criteriaWeights.education}%`)
      parts.push(`- Experience: ${criteria.criteriaWeights.experience}%`)
      parts.push(`- Documentation: ${criteria.criteriaWeights.documentation}%`)
      parts.push(`- Other factors: ${criteria.criteriaWeights.other}%`)
      parts.push(``)
    }

    return parts.join('\n')
  }

  /**
   * Build criteria checklist for AI
   * 
   * Creates a concise checklist of mandatory requirements that the AI
   * should verify. This helps ensure the AI addresses all critical criteria.
   * 
   * @param criteria - Visa criteria configuration
   * @returns Formatted checklist string
   */
  private buildCriteriaChecklist(criteria: VisaCriteriaConfig): string {
    const items: string[] = []

    // Salary checklist item
    if (criteria.salaryThresholds && criteria.salaryThresholds.length > 0) {
      if (criteria.salaryThresholds.length === 1) {
        const threshold = criteria.salaryThresholds[0]
        items.push(`- [ ] **Salary:** Meets or exceeds ${this.formatSalaryThreshold(threshold)}`)
      } else {
        items.push(`- [ ] **Salary:** Meets one of the applicable thresholds:`)
        criteria.salaryThresholds.forEach(threshold => {
          items.push(`  - ${this.formatSalaryThreshold(threshold)}`)
        })
      }
    }

    // Education checklist item
    if (criteria.educationLevel && criteria.educationLevel !== 'None') {
      let eduItem = `- [ ] **Education:** ${criteria.educationLevel} degree or higher`
      if (criteria.alternativeQualification) {
        eduItem += ` (or ${criteria.alternativeQualification})`
      }
      items.push(eduItem)
    } else if (criteria.educationLevel === 'None' && criteria.alternativeQualification) {
      items.push(`- [ ] **Qualification:** ${criteria.alternativeQualification}`)
    }

    // Experience checklist item
    if (criteria.experienceYears !== undefined && criteria.experienceYears > 0) {
      items.push(`- [ ] **Experience:** At least ${criteria.experienceYears} year${criteria.experienceYears !== 1 ? 's' : ''} of relevant experience`)
    }

    // Labor market test checklist item
    if (criteria.laborMarketTestRequired) {
      items.push(`- [ ] **Labor Market Test:** Employer must complete labor market test`)
    }

    // Sponsor checklist item
    if (criteria.sponsorRequired) {
      const sponsorDesc = criteria.sponsorType || 'Employer sponsorship'
      items.push(`- [ ] **Sponsor:** ${sponsorDesc} required`)
    }

    // Document completeness
    items.push(`- [ ] **Documentation:** All required supporting documents provided`)

    return items.join('\n')
  }

  /**
   * Format a salary threshold for display
   * 
   * @param threshold - Salary threshold object
   * @returns Formatted string (e.g., "EUR 38,000 annual (for critical occupations)")
   */
  private formatSalaryThreshold(threshold: SalaryThreshold): string {
    const formattedAmount = threshold.amount.toLocaleString()
    let result = `${threshold.currency} ${formattedAmount} ${threshold.period}`
    
    if (threshold.conditions) {
      result += ` (${threshold.conditions})`
    }
    
    return result
  }

  /**
   * Build evaluation prompt with validation results and score calculation
   * 
   * Creates an enhanced prompt that includes:
   * - Visa type description and purpose
   * - Validation results showing which requirements are met/not met
   * - Score calculation with penalties for missing critical requirements
   * - Critical requirements status
   * - Document content for analysis
   * - Specific instructions for structured AI response
   * 
   * @param country - Country name
   * @param visaType - Visa type name
   * @param visaCriteria - Visa criteria configuration
   * @param parsedDocuments - Array of parsed documents with extracted text
   * @param userInfo - User information (name and email)
   * @param validationResults - Array of validation results from criteria validator
   * @param scoreCalculation - Score calculation with penalties
   * @returns Formatted prompt string for AI evaluation
   */
  buildVisaSpecificPromptWithValidation(
    country: string,
    visaType: string,
    visaCriteria: VisaCriteriaConfig,
    parsedDocuments: ParsedDocument[],
    userInfo: { name: string; email: string },
    validationResults: ValidationResult[],
    scoreCalculation: ScoreCalculation
  ): string {
    logger.debug('Building visa-specific prompt with validation results', {
      country,
      visaType,
      documentCount: parsedDocuments.length,
      validationResultsCount: validationResults.length,
      baseScore: scoreCalculation.baseScore,
      totalPenalty: scoreCalculation.totalPenalty,
      adjustedScore: scoreCalculation.adjustedScore
    })

    // Build the prompt sections
    const sections: string[] = []

    // Header section
    sections.push(`# Visa Evaluation with Validation Results`)
    sections.push(``)
    sections.push(`**Applicant:** ${userInfo.name}`)
    sections.push(`**Email:** ${userInfo.email}`)
    sections.push(`**Target Country:** ${country}`)
    sections.push(`**Visa Type:** ${visaType}`)
    sections.push(``)

    // Visa description section
    sections.push(`## Visa Type Information`)
    sections.push(``)
    sections.push(`**Description:** ${visaCriteria.description}`)
    
    if (visaCriteria.processingTime) {
      sections.push(`**Processing Time:** ${visaCriteria.processingTime}`)
    }
    
    if (visaCriteria.pathToPermanentResidency) {
      sections.push(`**Path to Permanent Residency:** ${visaCriteria.pathToPermanentResidency}`)
    }
    sections.push(``)

    // Validation Results Section
    sections.push(`## Validation Results`)
    sections.push(``)
    sections.push(`The following requirements have been validated against the applicant's documents:`)
    sections.push(``)
    
    validationResults.forEach(result => {
      const status = result.met ? '✓ MET' : '✗ NOT MET'
      const critical = result.isCritical ? ' [CRITICAL]' : ''
      sections.push(`### ${result.criterion}${critical}`)
      sections.push(`**Status:** ${status}`)
      sections.push(`**Score:** ${result.score}/${result.maxScore}`)
      sections.push(`**Details:** ${result.details}`)
      
      if (result.evidence && result.evidence.length > 0) {
        sections.push(`**Evidence:**`)
        result.evidence.forEach(ev => {
          sections.push(`- ${ev}`)
        })
      }
      
      if (result.sourceDocument) {
        sections.push(`**Source Document:** ${result.sourceDocument}`)
      }
      
      if (!result.met && result.recommendation) {
        sections.push(`**Recommendation:** ${result.recommendation}`)
      }
      sections.push(``)
    })

    // Score Calculation Section
    sections.push(`## Score Calculation`)
    sections.push(``)
    sections.push(`**Base Score:** ${scoreCalculation.baseScore.toFixed(1)}/100`)
    
    if (scoreCalculation.penalties.length > 0) {
      sections.push(``)
      sections.push(`**Penalties Applied:**`)
      scoreCalculation.penalties.forEach(p => {
        sections.push(`- ${p.requirement}: -${p.points} points (${p.reason})`)
      })
      sections.push(``)
      sections.push(`**Total Penalty:** -${scoreCalculation.totalPenalty.toFixed(1)} points`)
    }
    
    sections.push(``)
    sections.push(`**Adjusted Score:** ${scoreCalculation.adjustedScore.toFixed(1)}/100`)
    sections.push(``)

    // Critical Requirements Status
    if (visaCriteria.criticalRequirements) {
      sections.push(`## Critical Requirements Status`)
      sections.push(``)
      sections.push(`The following are CRITICAL requirements for this visa type. Missing any of these significantly reduces approval likelihood:`)
      sections.push(``)
      
      const criticalReqs = visaCriteria.criticalRequirements.requirements
      criticalReqs.forEach(req => {
        const validation = validationResults.find(v => 
          v.criterion.toLowerCase().includes(req.toLowerCase()) ||
          req.toLowerCase().includes(v.criterion.toLowerCase())
        )
        const status = validation?.met ? '✓ MET' : '✗ NOT MET'
        sections.push(`- **${req}**: ${status}`)
      })
      sections.push(``)
    }

    // Documents section
    sections.push(`## Applicant Documents`)
    sections.push(``)
    sections.push(`The following documents have been provided by the applicant:`)
    sections.push(``)

    const successfulDocs = parsedDocuments.filter(d => d.success)
    const failedDocs = parsedDocuments.filter(d => !d.success)

    if (successfulDocs.length > 0) {
      successfulDocs.forEach((doc, index) => {
        sections.push(`### Document ${index + 1}: ${doc.originalName} (${doc.documentType})`)
        sections.push(``)
        sections.push('```')
        sections.push(doc.extractedText)
        sections.push('```')
        sections.push(``)
      })
    }

    if (failedDocs.length > 0) {
      sections.push(`### Failed to Parse:`)
      failedDocs.forEach(doc => {
        sections.push(`- ${doc.originalName}: ${doc.error || 'Unknown error'}`)
      })
      sections.push(``)
    }

    // AI Instructions
    sections.push(`## Your Task`)
    sections.push(``)
    sections.push(`Based on the validation results above, provide a comprehensive evaluation.`)
    sections.push(``)
    sections.push(`**IMPORTANT INSTRUCTIONS:**`)
    sections.push(``)
    sections.push(`1. **The validation results are AUTHORITATIVE** - Do not contradict them. They represent objective analysis of the documents.`)
    sections.push(`2. **Use the calculated score** (${scoreCalculation.adjustedScore.toFixed(1)}/100) as the final score in your response.`)
    sections.push(`3. **Explain WHY requirements were not met** - Focus on specific gaps and what information is missing or insufficient.`)
    sections.push(`4. **Prioritize recommendations by criticality** - Critical requirements should have CRITICAL priority, other important gaps should be HIGH priority.`)
    sections.push(`5. **Be specific and actionable** - Provide concrete steps the applicant can take to address each gap.`)
    sections.push(`6. **Cite evidence from documents** - Reference specific information found in the documents to support your analysis.`)
    sections.push(``)

    // Response format
    sections.push(`## Response Format`)
    sections.push(``)
    sections.push(`**CRITICAL: You MUST respond ONLY with a valid JSON object. Do not include any text before or after the JSON.**`)
    sections.push(``)
    sections.push(`Respond with a JSON object in exactly this format:`)
    sections.push(``)
    sections.push(`{`)
    sections.push(`  "score": ${scoreCalculation.adjustedScore.toFixed(1)},`)
    sections.push(`  "criteriaAnalysis": [`)
    sections.push(`    {`)
    sections.push(`      "name": "Criterion Name",`)
    sections.push(`      "rating": "STRONG|GOOD|MODERATE|WEAK|CRITICAL_GAP",`)
    sections.push(`      "evidence": ["Evidence 1 from documents", "Evidence 2 from documents"],`)
    sections.push(`      "gaps": ["Gap 1 if any", "Gap 2 if any"],`)
    sections.push(`      "recommendation": "Specific actionable recommendation if gaps exist",`)
    sections.push(`      "isCritical": true|false`)
    sections.push(`    }`)
    sections.push(`  ],`)
    sections.push(`  "prioritizedRecommendations": [`)
    sections.push(`    {`)
    sections.push(`      "priority": "CRITICAL|HIGH|MEDIUM|LOW",`)
    sections.push(`      "text": "Specific actionable recommendation",`)
    sections.push(`      "relatedCriterion": "Name of related criterion"`)
    sections.push(`    }`)
    sections.push(`  ],`)
    sections.push(`  "summary": "Comprehensive markdown-formatted summary explaining the evaluation, validation results, and overall assessment",`)
    sections.push(`  "conclusion": "Clear statement about application viability, approval likelihood, and next steps"`)
    sections.push(`}`)
    sections.push(``)
    sections.push(`**Field Requirements:**`)
    sections.push(``)
    sections.push(`- **score**: Must be ${scoreCalculation.adjustedScore.toFixed(1)} (the calculated adjusted score)`)
    sections.push(`- **criteriaAnalysis**: Array with one entry for each validated criterion`)
    sections.push(`  - **rating**: Use CRITICAL_GAP for unmet critical requirements, WEAK for unmet non-critical, MODERATE for partially met, GOOD for met, STRONG for exceeded`)
    sections.push(`  - **evidence**: List specific facts from documents (salary amounts, degree levels, years of experience, etc.)`)
    sections.push(`  - **gaps**: List specific deficiencies or missing information`)
    sections.push(`  - **isCritical**: Set to true if this is a critical requirement for the visa type`)
    sections.push(`- **prioritizedRecommendations**: Array sorted by priority`)
    sections.push(`  - **priority**: CRITICAL for missing critical requirements, HIGH for important gaps, MEDIUM for improvements, LOW for optional enhancements`)
    sections.push(`  - **text**: Specific action to take (e.g., "Obtain LCA from employer - MANDATORY for H-1B approval")`)
    sections.push(`  - **relatedCriterion**: Name of the criterion this recommendation addresses`)
    sections.push(`- **summary**: Comprehensive explanation in markdown format with sections for each criterion`)
    sections.push(`- **conclusion**: Clear statement of approval likelihood and next steps`)
    sections.push(``)
    sections.push(`**Response must be ONLY valid JSON, nothing else.**`)

    const prompt = sections.join('\n')

    logger.debug('Visa-specific prompt with validation built', {
      country,
      visaType,
      promptLength: prompt.length,
      sectionsCount: sections.length,
      validationResultsIncluded: validationResults.length,
      penaltiesIncluded: scoreCalculation.penalties.length
    })

    return prompt
  }
}
