/**
 * Enhanced Prompt Builder Service
 * 
 * Builds AI prompts with visa-specific criteria for more accurate evaluations.
 * Formats visa requirements, mandatory criteria, and creates structured checklists
 * for the AI to evaluate against.
 */

import { VisaCriteriaConfig, SalaryThreshold } from '../config/visaCriteria'
import { ParsedDocument } from './documentParser'
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
}
