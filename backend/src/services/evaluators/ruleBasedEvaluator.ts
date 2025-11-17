import { IEvaluator, EvaluateParams, EvaluationResult } from './evaluatorInterface';

/**
 * Rule-based evaluator implementation
 * Uses predefined scoring rules based on document count, visa type, and country
 */
export class RuleBasedEvaluator implements IEvaluator {
  /**
   * Evaluate visa application using rule-based scoring logic
   */
  async evaluate(params: EvaluateParams): Promise<EvaluationResult> {
    const { country, visaType, documents } = params;

    // Start with base score
    let score = 50;

    // Add points based on document count (10 points per document, max 40 points)
    const documentPoints = Math.min(documents.length * 10, 40);
    score += documentPoints;

    // Apply country-specific rules
    score += this.getCountryBonus(country, visaType, documents);

    // Apply visa type-specific rules
    score += this.getVisaTypeBonus(visaType, documents);

    // Ensure score is within valid range
    score = Math.max(0, Math.min(score, 100));

    // Generate summary
    const summary = this.generateSummary(score, country, visaType, documents);

    return { score, summary };
  }

  /**
   * Calculate country-specific bonus points
   */
  private getCountryBonus(country: string, visaType: string, documents: any[]): number {
    let bonus = 0;

    switch (country.toLowerCase()) {
      case 'united states':
        // US O-1A visa gets bonus for comprehensive documentation
        if (visaType === 'O-1A' && documents.length >= 4) {
          bonus += 15;
        }
        break;

      case 'ireland':
        // Ireland Critical Skills gets bonus for employment contract
        if (visaType.includes('Critical Skills')) {
          const hasEmploymentDoc = documents.some(doc => 
            doc.originalName.toLowerCase().includes('employment') ||
            doc.originalName.toLowerCase().includes('contract')
          );
          if (hasEmploymentDoc) {
            bonus += 10;
          }
        }
        break;

      case 'germany':
        // Germany EU Blue Card gets bonus for education certificates
        if (visaType.includes('Blue Card')) {
          const hasEducationDoc = documents.some(doc =>
            doc.originalName.toLowerCase().includes('education') ||
            doc.originalName.toLowerCase().includes('certificate') ||
            doc.originalName.toLowerCase().includes('degree')
          );
          if (hasEducationDoc) {
            bonus += 10;
          }
        }
        break;

      case 'france':
        // France Talent Passport gets bonus for reference letters
        if (visaType.includes('Talent Passport')) {
          const hasReferenceDoc = documents.some(doc =>
            doc.originalName.toLowerCase().includes('reference') ||
            doc.originalName.toLowerCase().includes('letter')
          );
          if (hasReferenceDoc) {
            bonus += 10;
          }
        }
        break;

      case 'netherlands':
        // Netherlands Knowledge Migrant gets bonus for complete documentation
        if (visaType.includes('Knowledge Migrant') && documents.length >= 5) {
          bonus += 12;
        }
        break;

      case 'poland':
        // Poland Work Permit gets bonus for police report
        if (visaType.includes('Work Permit')) {
          const hasPoliceReport = documents.some(doc =>
            doc.originalName.toLowerCase().includes('police') ||
            doc.originalName.toLowerCase().includes('criminal')
          );
          if (hasPoliceReport) {
            bonus += 8;
          }
        }
        break;
    }

    return bonus;
  }

  /**
   * Calculate visa type-specific bonus points
   */
  private getVisaTypeBonus(visaType: string, documents: any[]): number {
    let bonus = 0;

    // Work-related visas benefit from employment documentation
    if (visaType.toLowerCase().includes('work') || 
        visaType.toLowerCase().includes('employment')) {
      const hasEmploymentDoc = documents.some(doc =>
        doc.originalName.toLowerCase().includes('employment') ||
        doc.originalName.toLowerCase().includes('contract') ||
        doc.originalName.toLowerCase().includes('offer')
      );
      if (hasEmploymentDoc) {
        bonus += 5;
      }
    }

    // Skill-based visas benefit from resume/CV
    if (visaType.toLowerCase().includes('skill') ||
        visaType.toLowerCase().includes('talent')) {
      const hasResume = documents.some(doc =>
        doc.originalName.toLowerCase().includes('resume') ||
        doc.originalName.toLowerCase().includes('cv')
      );
      if (hasResume) {
        bonus += 5;
      }
    }

    return bonus;
  }

  /**
   * Generate evaluation summary text
   */
  private generateSummary(
    score: number,
    country: string,
    visaType: string,
    documents: any[]
  ): string {
    const documentCount = documents.length;
    
    let summary = `Evaluation complete for ${country} - ${visaType}. `;
    summary += `Reviewed ${documentCount} document${documentCount !== 1 ? 's' : ''}. `;

    if (score >= 80) {
      summary += 'Strong application with comprehensive documentation. ';
      summary += 'Your profile shows excellent alignment with visa requirements. ';
      summary += 'Recommendation: Proceed with application submission.';
    } else if (score >= 60) {
      summary += 'Good application with solid documentation. ';
      summary += 'Your profile meets most visa requirements. ';
      summary += 'Recommendation: Consider adding supporting documents to strengthen your case.';
    } else if (score >= 40) {
      summary += 'Moderate application with basic documentation. ';
      summary += 'Your profile meets some visa requirements but could be improved. ';
      summary += 'Recommendation: Add more supporting documents and ensure all required materials are included.';
    } else {
      summary += 'Application needs significant improvement. ';
      summary += 'Additional documentation and preparation are strongly recommended. ';
      summary += 'Recommendation: Consult with an immigration specialist before proceeding.';
    }

    return summary;
  }
}
