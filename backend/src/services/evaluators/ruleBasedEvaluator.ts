import { IEvaluator, EvaluateParams, EvaluationResult } from './evaluatorInterface';
import { getVisaCriteria, VisaCriteriaConfig } from '../../config/visaCriteria';
import { logger } from '../../config/logger';

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

    // Check for visa-specific criteria
    const visaCriteria = getVisaCriteria(country, visaType);
    
    if (visaCriteria) {
      logger.info('Using visa-specific evaluation for rule-based evaluator', {
        country,
        visaType,
        documentCount: documents.length,
        criteriaConfiguration: {
          visaType: visaCriteria.visaType,
          description: visaCriteria.description,
          hasSalaryThresholds: !!visaCriteria.salaryThresholds && visaCriteria.salaryThresholds.length > 0,
          educationLevel: visaCriteria.educationLevel,
          experienceYears: visaCriteria.experienceYears,
          laborMarketTestRequired: visaCriteria.laborMarketTestRequired,
          sponsorRequired: visaCriteria.sponsorRequired,
          criteriaWeights: visaCriteria.criteriaWeights
        }
      });
      return this.evaluateWithVisaCriteria(params, visaCriteria);
    } else {
      logger.info('Using generic evaluation for rule-based evaluator (no visa-specific criteria found)', {
        country,
        visaType,
        documentCount: documents.length,
        fallbackReason: 'No matching visa criteria configuration found',
        fallbackType: 'generic_rule_based_evaluation'
      });
      return this.evaluateGeneric(params);
    }
  }

  /**
   * Generic evaluation (existing logic)
   */
  private async evaluateGeneric(params: EvaluateParams): Promise<EvaluationResult> {
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
   * Evaluate with visa-specific criteria
   * Uses visa criteria configuration to validate requirements and calculate weighted score
   */
  private async evaluateWithVisaCriteria(
    params: EvaluateParams,
    visaCriteria: VisaCriteriaConfig
  ): Promise<EvaluationResult> {
    const { country, visaType, documents } = params;
    const feedback: string[] = [];

    logger.info('Starting visa-specific rule-based evaluation', {
      country,
      visaType,
      documentCount: documents.length,
      criteriaUsed: visaCriteria.visaType
    });

    // Get criteria weights (use defaults if not specified)
    const weights = visaCriteria.criteriaWeights || {
      salary: 30,
      education: 25,
      experience: 20,
      documentation: 20,
      other: 5
    };

    logger.info('Using criteria weights for scoring', {
      visaType: visaCriteria.visaType,
      weights,
      weightsSource: visaCriteria.criteriaWeights ? 'visa_specific' : 'default'
    });

    let totalScore = 0;
    const scoreContributions: Array<{
      criterion: string;
      rawScore: number;
      weight: number;
      weightedScore: number;
      contribution: string;
    }> = [];

    // Validate salary against thresholds
    if (visaCriteria.salaryThresholds && visaCriteria.salaryThresholds.length > 0) {
      const salaryResult = this.validateSalaryRuleBased(documents, visaCriteria);
      const weightedScore = (salaryResult.score / 100) * weights.salary;
      totalScore += weightedScore;
      feedback.push(salaryResult.feedback);
      
      scoreContributions.push({
        criterion: 'Salary',
        rawScore: salaryResult.score,
        weight: weights.salary,
        weightedScore: parseFloat(weightedScore.toFixed(2)),
        contribution: `Salary: ${salaryResult.score}% × ${weights.salary}% weight = ${weightedScore.toFixed(2)} points`
      });
      
      logger.info('Salary validation complete', {
        criterion: 'Salary',
        rawScore: salaryResult.score,
        weight: weights.salary,
        weightedScore: weightedScore.toFixed(2),
        feedback: salaryResult.feedback
      });
    } else {
      // No salary requirement - award full points for this criterion
      totalScore += weights.salary;
      feedback.push('No specific salary requirement for this visa type.');
      
      scoreContributions.push({
        criterion: 'Salary',
        rawScore: 100,
        weight: weights.salary,
        weightedScore: weights.salary,
        contribution: `Salary: 100% (no requirement) × ${weights.salary}% weight = ${weights.salary} points`
      });
      
      logger.info('Salary validation skipped (no requirement)', {
        criterion: 'Salary',
        weight: weights.salary,
        weightedScore: weights.salary
      });
    }

    // Validate education requirements
    if (visaCriteria.educationLevel && visaCriteria.educationLevel !== 'None') {
      const educationResult = this.validateEducationRuleBased(documents, visaCriteria);
      const weightedScore = (educationResult.score / 100) * weights.education;
      totalScore += weightedScore;
      feedback.push(educationResult.feedback);
      
      scoreContributions.push({
        criterion: 'Education',
        rawScore: educationResult.score,
        weight: weights.education,
        weightedScore: parseFloat(weightedScore.toFixed(2)),
        contribution: `Education: ${educationResult.score}% × ${weights.education}% weight = ${weightedScore.toFixed(2)} points`
      });
      
      logger.info('Education validation complete', {
        criterion: 'Education',
        rawScore: educationResult.score,
        weight: weights.education,
        weightedScore: weightedScore.toFixed(2),
        feedback: educationResult.feedback
      });
    } else {
      // No education requirement - award full points for this criterion
      totalScore += weights.education;
      feedback.push('No specific education requirement for this visa type.');
      
      scoreContributions.push({
        criterion: 'Education',
        rawScore: 100,
        weight: weights.education,
        weightedScore: weights.education,
        contribution: `Education: 100% (no requirement) × ${weights.education}% weight = ${weights.education} points`
      });
      
      logger.info('Education validation skipped (no requirement)', {
        criterion: 'Education',
        weight: weights.education,
        weightedScore: weights.education
      });
    }

    // Validate experience requirements
    if (visaCriteria.experienceYears && visaCriteria.experienceYears > 0) {
      const experienceResult = this.validateExperienceRuleBased(documents, visaCriteria);
      const weightedScore = (experienceResult.score / 100) * weights.experience;
      totalScore += weightedScore;
      feedback.push(experienceResult.feedback);
      
      scoreContributions.push({
        criterion: 'Experience',
        rawScore: experienceResult.score,
        weight: weights.experience,
        weightedScore: parseFloat(weightedScore.toFixed(2)),
        contribution: `Experience: ${experienceResult.score}% × ${weights.experience}% weight = ${weightedScore.toFixed(2)} points`
      });
      
      logger.info('Experience validation complete', {
        criterion: 'Experience',
        rawScore: experienceResult.score,
        weight: weights.experience,
        weightedScore: weightedScore.toFixed(2),
        feedback: experienceResult.feedback
      });
    } else {
      // No experience requirement - award full points for this criterion
      totalScore += weights.experience;
      feedback.push('No specific experience requirement for this visa type.');
      
      scoreContributions.push({
        criterion: 'Experience',
        rawScore: 100,
        weight: weights.experience,
        weightedScore: weights.experience,
        contribution: `Experience: 100% (no requirement) × ${weights.experience}% weight = ${weights.experience} points`
      });
      
      logger.info('Experience validation skipped (no requirement)', {
        criterion: 'Experience',
        weight: weights.experience,
        weightedScore: weights.experience
      });
    }

    // Score document completeness
    const docCompletenessResult = this.scoreDocumentCompleteness(documents, visaCriteria);
    const docWeightedScore = (docCompletenessResult.score / 100) * weights.documentation;
    totalScore += docWeightedScore;
    feedback.push(docCompletenessResult.feedback);
    
    scoreContributions.push({
      criterion: 'Documentation',
      rawScore: docCompletenessResult.score,
      weight: weights.documentation,
      weightedScore: parseFloat(docWeightedScore.toFixed(2)),
      contribution: `Documentation: ${docCompletenessResult.score.toFixed(1)}% × ${weights.documentation}% weight = ${docWeightedScore.toFixed(2)} points`
    });
    
    logger.info('Document completeness scored', {
      criterion: 'Documentation',
      rawScore: docCompletenessResult.score,
      weight: weights.documentation,
      weightedScore: docWeightedScore.toFixed(2),
      feedback: docCompletenessResult.feedback
    });

    // Add "other" points based on document count (bonus for comprehensive submission)
    const documentBonus = Math.min(documents.length / 5, 1) * weights.other;
    totalScore += documentBonus;
    
    scoreContributions.push({
      criterion: 'Other (Document Count Bonus)',
      rawScore: (Math.min(documents.length / 5, 1) * 100),
      weight: weights.other,
      weightedScore: parseFloat(documentBonus.toFixed(2)),
      contribution: `Other: ${(Math.min(documents.length / 5, 1) * 100).toFixed(1)}% × ${weights.other}% weight = ${documentBonus.toFixed(2)} points`
    });
    
    logger.info('Document count bonus applied', {
      criterion: 'Other',
      documentCount: documents.length,
      bonusPercentage: (Math.min(documents.length / 5, 1) * 100).toFixed(1),
      weight: weights.other,
      weightedScore: documentBonus.toFixed(2)
    });

    // Ensure score is within valid range
    const finalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

    // Log comprehensive score calculation summary
    logger.info('Visa-specific rule-based evaluation complete', {
      country,
      visaType,
      criteriaUsed: visaCriteria.visaType,
      evaluationType: 'visa_specific_rule_based',
      finalScore,
      rawScore: totalScore.toFixed(2),
      scoreBreakdown: scoreContributions,
      totalWeightUsed: Object.values(weights).reduce((sum, w) => sum + w, 0),
      feedbackCount: feedback.length
    });

    // Generate visa-specific summary
    const summary = this.generateVisaSpecificSummary(
      finalScore,
      country,
      visaType,
      visaCriteria,
      feedback
    );

    // Generate visa-specific recommendations
    const recommendations = this.generateVisaSpecificRecommendations(
      feedback,
      visaCriteria
    );

    return {
      score: finalScore,
      summary,
      recommendations
    };
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

  /**
   * Validate salary for rule-based scoring
   * Extracts salary from documents and scores against thresholds
   */
  private validateSalaryRuleBased(
    documents: any[],
    visaCriteria: VisaCriteriaConfig
  ): { score: number; feedback: string } {
    // If no salary thresholds defined, return full score
    if (!visaCriteria.salaryThresholds || visaCriteria.salaryThresholds.length === 0) {
      return {
        score: 100,
        feedback: 'No specific salary requirement for this visa type.'
      };
    }

    // Try to extract salary from document names (simplified heuristic)
    // In a real implementation, this would parse document content
    let salaryFound = false;

    for (const doc of documents) {
      const filename = doc.originalName.toLowerCase();
      
      // Look for salary-related documents
      if (filename.includes('contract') || filename.includes('offer') || filename.includes('employment')) {
        salaryFound = true;
        // Assume salary is adequate if employment contract is present
        // This is a simplified heuristic for rule-based evaluation
        break;
      }
    }

    // Get the lowest threshold as baseline
    const lowestThreshold = visaCriteria.salaryThresholds.reduce((min, threshold) => {
      const amount = threshold.period === 'monthly' ? threshold.amount * 12 : threshold.amount;
      const minAmount = min.period === 'monthly' ? min.amount * 12 : min.amount;
      return amount < minAmount ? threshold : min;
    });

    if (salaryFound) {
      // Award points based on presence of employment documentation
      return {
        score: 85,
        feedback: `Employment contract found. Verify salary meets minimum requirement of ${lowestThreshold.currency} ${lowestThreshold.amount} ${lowestThreshold.period}${lowestThreshold.conditions ? ` (${lowestThreshold.conditions})` : ''}.`
      };
    } else {
      return {
        score: 30,
        feedback: `No employment contract or offer letter found. Please provide documentation showing salary of at least ${lowestThreshold.currency} ${lowestThreshold.amount} ${lowestThreshold.period}${lowestThreshold.conditions ? ` (${lowestThreshold.conditions})` : ''}.`
      };
    }
  }

  /**
   * Validate education for rule-based scoring
   * Checks for education-related documents
   */
  private validateEducationRuleBased(
    documents: any[],
    visaCriteria: VisaCriteriaConfig
  ): { score: number; feedback: string } {
    // If no education requirement
    if (!visaCriteria.educationLevel || visaCriteria.educationLevel === 'None') {
      return {
        score: 100,
        feedback: 'No specific education requirement for this visa type.'
      };
    }

    // Look for education-related documents
    let educationDocFound = false;

    for (const doc of documents) {
      const filename = doc.originalName.toLowerCase();
      
      if (filename.includes('degree') || 
          filename.includes('diploma') || 
          filename.includes('certificate') ||
          filename.includes('education') ||
          filename.includes('transcript')) {
        educationDocFound = true;
        break;
      }
    }

    if (educationDocFound) {
      return {
        score: 90,
        feedback: `Education documentation found. Verify it meets ${visaCriteria.educationLevel} degree requirement${visaCriteria.alternativeQualification ? ` or alternative: ${visaCriteria.alternativeQualification}` : ''}.`
      };
    } else {
      return {
        score: 40,
        feedback: `No education documentation found. Please provide proof of ${visaCriteria.educationLevel} degree${visaCriteria.alternativeQualification ? ` or ${visaCriteria.alternativeQualification}` : ''}.`
      };
    }
  }

  /**
   * Validate experience for rule-based scoring
   * Checks for experience-related documents
   */
  private validateExperienceRuleBased(
    documents: any[],
    visaCriteria: VisaCriteriaConfig
  ): { score: number; feedback: string } {
    // If no experience requirement
    if (!visaCriteria.experienceYears || visaCriteria.experienceYears === 0) {
      return {
        score: 100,
        feedback: 'No specific experience requirement for this visa type.'
      };
    }

    // Look for experience-related documents
    let experienceDocFound = false;

    for (const doc of documents) {
      const filename = doc.originalName.toLowerCase();
      
      if (filename.includes('resume') || 
          filename.includes('cv') || 
          filename.includes('experience') ||
          filename.includes('reference') ||
          filename.includes('employment history')) {
        experienceDocFound = true;
        break;
      }
    }

    if (experienceDocFound) {
      return {
        score: 85,
        feedback: `Experience documentation found. Verify it shows at least ${visaCriteria.experienceYears} year${visaCriteria.experienceYears !== 1 ? 's' : ''} of relevant professional experience.`
      };
    } else {
      return {
        score: 35,
        feedback: `No experience documentation found. Please provide resume/CV showing at least ${visaCriteria.experienceYears} year${visaCriteria.experienceYears !== 1 ? 's' : ''} of relevant experience.`
      };
    }
  }

  /**
   * Score document completeness based on visa requirements
   */
  private scoreDocumentCompleteness(
    documents: any[],
    visaCriteria: VisaCriteriaConfig
  ): { score: number; feedback: string } {
    const requiredDocTypes = new Set<string>();
    const foundDocTypes = new Set<string>();

    // Determine required document types based on visa criteria
    if (visaCriteria.salaryThresholds && visaCriteria.salaryThresholds.length > 0) {
      requiredDocTypes.add('employment');
    }
    if (visaCriteria.educationLevel && visaCriteria.educationLevel !== 'None') {
      requiredDocTypes.add('education');
    }
    if (visaCriteria.experienceYears && visaCriteria.experienceYears > 0) {
      requiredDocTypes.add('experience');
    }
    if (visaCriteria.laborMarketTestRequired) {
      requiredDocTypes.add('labor_test');
    }
    if (visaCriteria.sponsorRequired) {
      requiredDocTypes.add('sponsor');
    }

    // Always expect passport/ID
    requiredDocTypes.add('identification');

    // Check which document types are present
    for (const doc of documents) {
      const filename = doc.originalName.toLowerCase();
      
      if (filename.includes('passport') || filename.includes('id')) {
        foundDocTypes.add('identification');
      }
      if (filename.includes('contract') || filename.includes('offer') || filename.includes('employment')) {
        foundDocTypes.add('employment');
      }
      if (filename.includes('degree') || filename.includes('diploma') || filename.includes('certificate') || filename.includes('education')) {
        foundDocTypes.add('education');
      }
      if (filename.includes('resume') || filename.includes('cv') || filename.includes('experience')) {
        foundDocTypes.add('experience');
      }
      if (filename.includes('labor') || filename.includes('market test')) {
        foundDocTypes.add('labor_test');
      }
      if (filename.includes('sponsor') || filename.includes('registration')) {
        foundDocTypes.add('sponsor');
      }
    }

    // Calculate completeness score
    const completeness = requiredDocTypes.size > 0 
      ? (foundDocTypes.size / requiredDocTypes.size) * 100 
      : 100;

    // Identify missing document types
    const missingTypes: string[] = [];
    for (const type of requiredDocTypes) {
      if (!foundDocTypes.has(type)) {
        missingTypes.push(type);
      }
    }

    let feedback = '';
    if (completeness === 100) {
      feedback = 'All required document types appear to be present.';
    } else {
      const missingLabels = missingTypes.map(type => {
        switch (type) {
          case 'identification': return 'passport/ID';
          case 'employment': return 'employment contract/offer letter';
          case 'education': return 'education certificates';
          case 'experience': return 'resume/CV';
          case 'labor_test': return 'labor market test documentation';
          case 'sponsor': return 'sponsor registration documents';
          default: return type;
        }
      });
      feedback = `Missing document types: ${missingLabels.join(', ')}. Please ensure all required documents are included.`;
    }

    return {
      score: completeness,
      feedback
    };
  }

  /**
   * Generate visa-specific summary based on score and criteria
   */
  private generateVisaSpecificSummary(
    score: number,
    country: string,
    visaType: string,
    visaCriteria: VisaCriteriaConfig,
    feedback: string[]
  ): string {
    let summary = `Evaluation complete for ${country} - ${visaType}.\n\n`;
    
    // Add visa description
    summary += `${visaCriteria.description}\n\n`;

    // Overall assessment based on score
    if (score >= 80) {
      summary += '**Strong Application**: Your profile shows excellent alignment with visa requirements. ';
      summary += 'You meet or exceed the mandatory criteria for this visa type.\n\n';
    } else if (score >= 60) {
      summary += '**Good Application**: Your profile meets most visa requirements. ';
      summary += 'Some areas could be strengthened to improve your chances.\n\n';
    } else if (score >= 40) {
      summary += '**Moderate Application**: Your profile meets some visa requirements but has notable gaps. ';
      summary += 'Significant improvements are recommended before submission.\n\n';
    } else {
      summary += '**Needs Improvement**: Your application currently does not meet several mandatory requirements. ';
      summary += 'Substantial preparation is needed before proceeding.\n\n';
    }

    // Add key requirements summary
    summary += '**Key Requirements:**\n';
    
    if (visaCriteria.salaryThresholds && visaCriteria.salaryThresholds.length > 0) {
      const threshold = visaCriteria.salaryThresholds[0];
      summary += `- Salary: ${threshold.currency} ${threshold.amount} ${threshold.period}`;
      if (threshold.conditions) {
        summary += ` (${threshold.conditions})`;
      }
      summary += '\n';
    }
    
    if (visaCriteria.educationLevel && visaCriteria.educationLevel !== 'None') {
      summary += `- Education: ${visaCriteria.educationLevel} degree required`;
      if (visaCriteria.alternativeQualification) {
        summary += ` (or ${visaCriteria.alternativeQualification})`;
      }
      summary += '\n';
    }
    
    if (visaCriteria.experienceYears && visaCriteria.experienceYears > 0) {
      summary += `- Experience: Minimum ${visaCriteria.experienceYears} year${visaCriteria.experienceYears !== 1 ? 's' : ''}\n`;
    }
    
    if (visaCriteria.laborMarketTestRequired) {
      summary += '- Labor Market Test: Required\n';
    } else {
      summary += '- Labor Market Test: Not required ✓\n';
    }
    
    if (visaCriteria.sponsorRequired) {
      summary += `- Sponsor: ${visaCriteria.sponsorType || 'Required'}\n`;
    }

    // Add unique benefits
    if (visaCriteria.uniqueRules && visaCriteria.uniqueRules.length > 0) {
      summary += '\n**Visa Benefits:**\n';
      visaCriteria.uniqueRules.slice(0, 3).forEach(rule => {
        summary += `- ${rule}\n`;
      });
    }

    // Add processing information
    if (visaCriteria.processingTime) {
      summary += `\n**Processing Time:** ${visaCriteria.processingTime}\n`;
    }

    if (visaCriteria.pathToPermanentResidency) {
      summary += `**Path to Permanent Residency:** ${visaCriteria.pathToPermanentResidency}\n`;
    }

    // Add detailed feedback
    if (feedback.length > 0) {
      summary += '\n**Detailed Assessment:**\n';
      feedback.forEach(item => {
        summary += `- ${item}\n`;
      });
    }

    return summary;
  }

  /**
   * Generate visa-specific recommendations for improvement
   */
  private generateVisaSpecificRecommendations(
    feedback: string[],
    visaCriteria: VisaCriteriaConfig
  ): string[] {
    const recommendations: string[] = [];

    // Extract critical gaps from feedback
    const criticalGaps: string[] = [];
    const minorGaps: string[] = [];

    for (const item of feedback) {
      if (item.toLowerCase().includes('missing') || 
          item.toLowerCase().includes('not found') ||
          item.toLowerCase().includes('below')) {
        criticalGaps.push(item);
      } else if (item.toLowerCase().includes('verify')) {
        minorGaps.push(item);
      }
    }

    // Prioritize critical gaps (salary, education)
    if (criticalGaps.length > 0) {
      // Salary recommendations
      const salaryGap = criticalGaps.find(g => g.toLowerCase().includes('salary') || g.toLowerCase().includes('employment'));
      if (salaryGap && visaCriteria.salaryThresholds && visaCriteria.salaryThresholds.length > 0) {
        const threshold = visaCriteria.salaryThresholds[0];
        recommendations.push(
          `Obtain employment contract or offer letter showing salary of at least ${threshold.currency} ${threshold.amount} ${threshold.period}${threshold.conditions ? ` (${threshold.conditions})` : ''}`
        );
      }

      // Education recommendations
      const educationGap = criticalGaps.find(g => g.toLowerCase().includes('education') || g.toLowerCase().includes('degree'));
      if (educationGap && visaCriteria.educationLevel && visaCriteria.educationLevel !== 'None') {
        recommendations.push(
          `Provide proof of ${visaCriteria.educationLevel} degree${visaCriteria.alternativeQualification ? ` or ${visaCriteria.alternativeQualification}` : ''}`
        );
      }

      // Experience recommendations
      const experienceGap = criticalGaps.find(g => g.toLowerCase().includes('experience') || g.toLowerCase().includes('resume'));
      if (experienceGap && visaCriteria.experienceYears && visaCriteria.experienceYears > 0) {
        recommendations.push(
          `Submit resume/CV demonstrating at least ${visaCriteria.experienceYears} year${visaCriteria.experienceYears !== 1 ? 's' : ''} of relevant professional experience`
        );
      }

      // Document completeness
      const docGap = criticalGaps.find(g => g.toLowerCase().includes('missing document'));
      if (docGap) {
        recommendations.push(docGap);
      }
    }

    // Add verification recommendations
    if (minorGaps.length > 0) {
      minorGaps.forEach((gap) => {
        recommendations.push(gap);
      });
    }

    // Add visa-specific improvement suggestions
    if (visaCriteria.laborMarketTestRequired) {
      recommendations.push('Ensure your employer has completed or is prepared to complete the labor market test');
    }

    if (visaCriteria.sponsorRequired) {
      recommendations.push(`Verify your employer is registered as ${visaCriteria.sponsorType || 'a sponsor'}`);
    }

    if (visaCriteria.familyReunification) {
      recommendations.push('Consider preparing family reunification documents if applicable');
    }

    // Add general recommendations
    recommendations.push('Review all documents for accuracy, completeness, and proper certification/translation');
    recommendations.push('Consider consulting with an immigration specialist for personalized guidance');

    return recommendations;
  }
}
