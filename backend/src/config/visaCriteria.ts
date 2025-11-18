/**
 * Visa Criteria Configuration System
 * 
 * This module defines country-specific and visa-specific criteria for visa evaluations.
 * Each visa type has detailed requirements including salary thresholds, education levels,
 * experience requirements, and other mandatory criteria based on actual immigration laws.
 */

import { logger } from './logger'

/**
 * Represents a salary threshold requirement for a visa type
 */
export interface SalaryThreshold {
  /** Salary amount */
  amount: number
  /** Currency code (e.g., 'EUR', 'USD') */
  currency: string
  /** Time period for salary (annual or monthly) */
  period: 'annual' | 'monthly'
  /** Optional conditions for this threshold (e.g., "for critical occupations", "if under 30 years old") */
  conditions?: string
}

/**
 * Complete configuration for a specific visa type's evaluation criteria
 */
export interface VisaCriteriaConfig {
  /** Country name */
  country: string
  /** Visa type name */
  visaType: string
  /** Description of the visa type */
  description: string
  
  // Mandatory requirements
  /** Salary thresholds (can have multiple with different conditions) */
  salaryThresholds?: SalaryThreshold[]
  /** Minimum education level required */
  educationLevel?: 'High School' | 'Bachelor' | 'Master' | 'PhD' | 'None'
  /** Alternative qualification if education requirement not met */
  alternativeQualification?: string
  /** Minimum years of experience required */
  experienceYears?: number
  
  // Process requirements
  /** Whether a labor market test is required */
  laborMarketTestRequired: boolean
  /** Whether employer sponsorship is required */
  sponsorRequired: boolean
  /** Type of sponsor required (e.g., "Recognized sponsor", "Registered employer") */
  sponsorType?: string
  
  // Unique characteristics
  /** Whether family reunification is allowed */
  familyReunification?: boolean
  /** Path to permanent residency description */
  pathToPermanentResidency?: string
  /** Typical processing time */
  processingTime?: string
  /** Unique rules or benefits specific to this visa type */
  uniqueRules?: string[]
  
  // Scoring weights (override default if provided)
  /** Custom weights for different criteria (must sum to 100) */
  criteriaWeights?: {
    salary: number
    education: number
    experience: number
    documentation: number
    other: number
  }
}

/**
 * Registry of all visa criteria configurations
 * Key format: "{country}-{visaType}"
 */
export const VISA_CRITERIA_CONFIGS: Record<string, VisaCriteriaConfig> = {
  'Ireland-Critical Skills Employment Permit': {
    country: 'Ireland',
    visaType: 'Critical Skills Employment Permit',
    description: 'For highly skilled workers in shortage occupations',
    salaryThresholds: [
      {
        amount: 38000,
        currency: 'EUR',
        period: 'annual',
        conditions: 'for critical occupations with relevant degree'
      },
      {
        amount: 64000,
        currency: 'EUR',
        period: 'annual',
        conditions: 'for other eligible occupations'
      }
    ],
    educationLevel: 'Bachelor',
    alternativeQualification: 'Equivalent experience in the field',
    experienceYears: 0,
    laborMarketTestRequired: false,
    sponsorRequired: true,
    sponsorType: 'Registered Irish employer',
    familyReunification: true,
    pathToPermanentResidency: 'After 2 years, can apply for Stamp 4 long-term residency',
    processingTime: '8-12 weeks',
    uniqueRules: [
      'No Labour Market Test required',
      'Spouses and children can accompany with work rights',
      'Employer can be waived from 50:50 EEA workforce rule'
    ],
    criteriaWeights: {
      salary: 35,
      education: 25,
      experience: 15,
      documentation: 15,
      other: 10
    }
  },
  
  'Ireland-General Employment Permit': {
    country: 'Ireland',
    visaType: 'General Employment Permit',
    description: 'For employment in occupations not on the ineligible list',
    salaryThresholds: [
      {
        amount: 30000,
        currency: 'EUR',
        period: 'annual',
        conditions: 'minimum requirement (effectively €34,000 with allowances)'
      }
    ],
    educationLevel: 'None',
    alternativeQualification: 'Skills/qualifications or experience required for the role',
    experienceYears: 0,
    laborMarketTestRequired: true,
    sponsorRequired: true,
    sponsorType: 'Registered Irish employer with valid Employer Registration Number',
    familyReunification: false,
    pathToPermanentResidency: 'After 5 years, can apply for Stamp 4',
    processingTime: '8-12 weeks',
    uniqueRules: [
      'Full Labour Market Needs Test required',
      'Spouses and dependents do not get automatic work rights',
      'First-time permit holders must stay 9 months with initial employer',
      'Employer must comply with 50:50 EEA workforce rule or obtain waiver'
    ],
    criteriaWeights: {
      salary: 30,
      education: 15,
      experience: 20,
      documentation: 25,
      other: 10
    }
  },

  'Netherlands-Knowledge Migrant Permit': {
    country: 'Netherlands',
    visaType: 'Knowledge Migrant Permit',
    description: 'For highly skilled migrants with recognized sponsors',
    salaryThresholds: [
      {
        amount: 5688,
        currency: 'EUR',
        period: 'monthly',
        conditions: 'if 30 years or older (2025 threshold)'
      },
      {
        amount: 4171,
        currency: 'EUR',
        period: 'monthly',
        conditions: 'if under 30 years old'
      },
      {
        amount: 2989,
        currency: 'EUR',
        period: 'monthly',
        conditions: 'for recent graduates from Dutch universities'
      }
    ],
    educationLevel: 'Bachelor',
    alternativeQualification: 'Higher education or equivalent qualifications',
    experienceYears: 0,
    laborMarketTestRequired: false,
    sponsorRequired: true,
    sponsorType: 'Recognized sponsor employer',
    familyReunification: true,
    pathToPermanentResidency: 'Pathway available after several years',
    processingTime: '2-4 weeks',
    uniqueRules: [
      'Recognized sponsors expedite processing',
      'No labor market test required',
      'Specialized tracks for orientation year graduates',
      'Fast processing time compared to other visa types'
    ],
    criteriaWeights: {
      salary: 40,
      education: 25,
      experience: 10,
      documentation: 15,
      other: 10
    }
  },

  'Netherlands-Orientation Year Permit': {
    country: 'Netherlands',
    visaType: 'Orientation Year Permit',
    description: 'For recent graduates from top-200 universities to seek employment',
    educationLevel: 'Bachelor',
    alternativeQualification: 'Degree from top-200 university (QS, Times Higher Education, or Shanghai Ranking)',
    experienceYears: 0,
    laborMarketTestRequired: false,
    sponsorRequired: false,
    familyReunification: false,
    pathToPermanentResidency: 'Not applicable - must transition to another permit type',
    processingTime: '2-4 weeks',
    uniqueRules: [
      '1-year non-extendable permit',
      'Free work rights - can work for any employer without restrictions',
      'Must have graduated within 3 years of application',
      'Degree must be from top-200 ranked university',
      'Can be used to search for employment or start a business',
      'Must transition to another permit type (e.g., Knowledge Migrant) to stay longer'
    ],
    criteriaWeights: {
      salary: 0,
      education: 60,
      experience: 0,
      documentation: 30,
      other: 10
    }
  },

  'Germany-EU Blue Card': {
    country: 'Germany',
    visaType: 'EU Blue Card',
    description: 'For highly qualified specialists with university degrees',
    salaryThresholds: [
      {
        amount: 48300,
        currency: 'EUR',
        period: 'annual',
        conditions: 'for general occupations (2025 threshold)'
      },
      {
        amount: 43760,
        currency: 'EUR',
        period: 'annual',
        conditions: 'for shortage occupations (STEM, medicine, academia) or recent graduates'
      }
    ],
    educationLevel: 'Bachelor',
    alternativeQualification: 'Equivalent vocational qualification',
    experienceYears: 0,
    laborMarketTestRequired: false,
    sponsorRequired: false,
    familyReunification: true,
    pathToPermanentResidency: 'After 21-33 months depending on German language proficiency',
    processingTime: '1-3 months',
    uniqueRules: [
      'Job must match qualifications',
      'For regulated professions, license must be obtained',
      'No quota or cap applies',
      'Family reunification has minimal requirements (no German language needed)',
      'Valid for contract length up to 4 years',
      'Fast-track to permanent residency (21 months with B1 German, 33 months with A1)'
    ],
    criteriaWeights: {
      salary: 35,
      education: 30,
      experience: 10,
      documentation: 15,
      other: 10
    }
  },

  'Germany-ICT Permit': {
    country: 'Germany',
    visaType: 'ICT Permit',
    description: 'For intra-corporate transfers within multinational companies',
    experienceYears: 0.5,
    laborMarketTestRequired: false,
    sponsorRequired: true,
    sponsorType: 'Sending company with corporate relationship to German entity',
    familyReunification: true,
    pathToPermanentResidency: 'Limited pathway - primarily for temporary assignments',
    processingTime: '1-3 months',
    uniqueRules: [
      'Minimum 6 months employment with sending company required',
      'Must be intra-company transfer (same corporate group)',
      'EU mobility rights - can work in other EU countries under ICT directive',
      'Valid for up to 3 years',
      'No labor market test required',
      'Suitable for managers, specialists, and trainee transfers'
    ],
    criteriaWeights: {
      salary: 20,
      education: 25,
      experience: 30,
      documentation: 20,
      other: 5
    }
  },

  'France-Talent Passport': {
    country: 'France',
    visaType: 'Talent Passport',
    description: 'Multi-year permit for high-skill categories',
    salaryThresholds: [
      {
        amount: 0,
        currency: 'EUR',
        period: 'annual',
        conditions: '2× French minimum wage (SMIC) for skilled employees'
      }
    ],
    educationLevel: 'Master',
    alternativeQualification: '5 years experience at comparable level',
    experienceYears: 0,
    laborMarketTestRequired: false,
    sponsorRequired: false,
    familyReunification: true,
    pathToPermanentResidency: 'After 3-4 years',
    processingTime: '2-4 months',
    uniqueRules: [
      'No labor market test required',
      '4-year renewable residence permit',
      'Family members receive work rights',
      'Spouses do not need French language for family reunification'
    ],
    criteriaWeights: {
      salary: 35,
      education: 30,
      experience: 15,
      documentation: 10,
      other: 10
    }
  },

  'France-Salarié en Mission': {
    country: 'France',
    visaType: 'Salarié en Mission',
    description: 'For intra-company transfers within multinational companies',
    salaryThresholds: [
      {
        amount: 0,
        currency: 'EUR',
        period: 'annual',
        conditions: '1.8× French minimum wage (SMIC)'
      }
    ],
    experienceYears: 0,
    laborMarketTestRequired: false,
    sponsorRequired: true,
    sponsorType: 'French entity within same corporate group',
    familyReunification: true,
    pathToPermanentResidency: 'After several years of continuous residence',
    processingTime: '2-4 months',
    uniqueRules: [
      'Must be intra-company transfer within same corporate group',
      '4-year renewable residence permit',
      'Family reunification allowed',
      'No labor market test required'
    ],
    criteriaWeights: {
      salary: 35,
      education: 20,
      experience: 20,
      documentation: 15,
      other: 10
    }
  },

  'United States-O-1A Visa': {
    country: 'United States',
    visaType: 'O-1A Visa',
    description: 'For individuals with extraordinary ability in sciences, business, education, or athletics',
    educationLevel: 'None',
    alternativeQualification: 'Extraordinary ability demonstrated through sustained national or international acclaim',
    experienceYears: 0,
    laborMarketTestRequired: false,
    sponsorRequired: true,
    sponsorType: 'U.S. employer or agent',
    familyReunification: true,
    pathToPermanentResidency: 'Dual intent allowed - can pursue green card (EB-1A category)',
    processingTime: '2-3 months',
    uniqueRules: [
      'Must meet at least 3 out of 8 criteria: major awards, membership in associations requiring outstanding achievement, published material about the individual, judging work of others, original contributions, scholarly articles, employment in critical capacity, high salary relative to peers',
      'Advisory opinion from peer group or labor organization required',
      'Focus on sustained national or international acclaim',
      'Evidence quality matters more than quantity',
      'No annual cap or lottery system',
      'Initial validity up to 3 years, renewable in 1-year increments'
    ],
    criteriaWeights: {
      salary: 10,
      education: 15,
      experience: 40,
      documentation: 30,
      other: 5
    }
  },

  'United States-H-1B Visa': {
    country: 'United States',
    visaType: 'H-1B Visa',
    description: 'For specialty occupation workers requiring bachelor\'s degree or equivalent',
    salaryThresholds: [
      {
        amount: 0,
        currency: 'USD',
        period: 'annual',
        conditions: 'Must meet or exceed prevailing wage for occupation and location (determined by Department of Labor)'
      }
    ],
    educationLevel: 'Bachelor',
    alternativeQualification: 'Equivalent experience (typically 3 years work experience = 1 year education)',
    experienceYears: 0,
    laborMarketTestRequired: true,
    sponsorRequired: true,
    sponsorType: 'U.S. employer filing Labor Condition Application (LCA)',
    familyReunification: true,
    pathToPermanentResidency: 'Dual intent allowed - can pursue green card while on H-1B',
    processingTime: '3-6 months',
    uniqueRules: [
      'Annual cap of 65,000 visas plus 20,000 for U.S. Master\'s degree holders',
      'Lottery system if applications exceed cap (typically filed in April)',
      'Job must be in specialty occupation requiring bachelor\'s degree in specific field',
      'Employer must file certified Labor Condition Application (LCA) with Department of Labor',
      'Initially granted for 3 years, renewable once for total of 6 years',
      'Employment is employer-specific - changing jobs requires new petition',
      'Prevailing wage must be paid to ensure no adverse effect on U.S. workers'
    ],
    criteriaWeights: {
      salary: 30,
      education: 35,
      experience: 15,
      documentation: 15,
      other: 5
    }
  },

  'Poland-Work Permit Type A': {
    country: 'Poland',
    visaType: 'Work Permit Type A',
    description: 'Standard work permit for foreign workers employed by Polish entities',
    educationLevel: 'None',
    alternativeQualification: 'Qualifications appropriate for the position',
    experienceYears: 0,
    laborMarketTestRequired: true,
    sponsorRequired: true,
    sponsorType: 'Polish employer',
    familyReunification: true,
    pathToPermanentResidency: 'After 5 years of continuous legal residence',
    processingTime: '1-2 months',
    uniqueRules: [
      'Labor market test required - employer must obtain statement from starosta (district labor office)',
      'No fixed minimum salary floor - salary must be appropriate for the position and region',
      'Employer must demonstrate inability to find suitable Polish or EU workers',
      'Social security and tax compliance required',
      'Permit tied to specific employer and position',
      'Valid for up to 3 years',
      'Starosta statement confirms no negative impact on local labor market'
    ],
    criteriaWeights: {
      salary: 25,
      education: 20,
      experience: 20,
      documentation: 25,
      other: 10
    }
  },

  'Poland-Work Permit Type C': {
    country: 'Poland',
    visaType: 'Work Permit Type C',
    description: 'For intra-corporate transfers within international companies',
    educationLevel: 'None',
    alternativeQualification: 'Qualifications appropriate for managerial or specialist role',
    experienceYears: 0,
    laborMarketTestRequired: false,
    sponsorRequired: true,
    sponsorType: 'Polish entity within same corporate group',
    familyReunification: true,
    pathToPermanentResidency: 'After 5 years of continuous legal residence',
    processingTime: '1-2 months',
    uniqueRules: [
      'No labor market test required',
      'Corporate relationship between sending and receiving entity required',
      'Must be intra-company transfer within same corporate group',
      'Suitable for managers, specialists, and employees with specialized knowledge',
      'Valid for up to 3 years',
      'Social security and tax compliance required',
      'Faster processing than Type A due to no labor market test'
    ],
    criteriaWeights: {
      salary: 25,
      education: 20,
      experience: 25,
      documentation: 20,
      other: 10
    }
  }
}

/**
 * Retrieves visa criteria configuration for a specific country and visa type
 * 
 * @param country - Country name
 * @param visaType - Visa type name
 * @returns VisaCriteriaConfig if found, null otherwise
 */
export function getVisaCriteria(country: string, visaType: string): VisaCriteriaConfig | null {
  const key = `${country}-${visaType}`
  const criteria = VISA_CRITERIA_CONFIGS[key] || null
  
  if (criteria) {
    logger.info('Visa criteria configuration loaded', { 
      country, 
      visaType, 
      key,
      criteriaDetails: {
        description: criteria.description,
        hasSalaryThresholds: !!criteria.salaryThresholds && criteria.salaryThresholds.length > 0,
        salaryThresholdCount: criteria.salaryThresholds?.length || 0,
        educationLevel: criteria.educationLevel,
        hasAlternativeQualification: !!criteria.alternativeQualification,
        experienceYears: criteria.experienceYears,
        laborMarketTestRequired: criteria.laborMarketTestRequired,
        sponsorRequired: criteria.sponsorRequired,
        sponsorType: criteria.sponsorType,
        hasFamilyReunification: criteria.familyReunification,
        hasPathToPermanentResidency: !!criteria.pathToPermanentResidency,
        processingTime: criteria.processingTime,
        uniqueRulesCount: criteria.uniqueRules?.length || 0,
        hasCriteriaWeights: !!criteria.criteriaWeights
      }
    })
  } else {
    logger.info('No visa criteria configuration found, will use default evaluation', { 
      country, 
      visaType, 
      key,
      fallbackType: 'default_evaluation',
      availableConfigurations: Object.keys(VISA_CRITERIA_CONFIGS).length
    })
  }
  
  return criteria
}

/**
 * Validates a visa criteria configuration to ensure all required fields are present
 * and values are valid
 * 
 * @param criteria - Visa criteria configuration to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateVisaCriteriaConfig(criteria: VisaCriteriaConfig): string[] {
  const errors: string[] = []
  
  // Validate required fields
  if (!criteria.country || criteria.country.trim() === '') {
    errors.push('Country is required')
  }
  
  if (!criteria.visaType || criteria.visaType.trim() === '') {
    errors.push('Visa type is required')
  }
  
  if (!criteria.description || criteria.description.trim() === '') {
    errors.push('Description is required')
  }
  
  if (typeof criteria.laborMarketTestRequired !== 'boolean') {
    errors.push('laborMarketTestRequired must be a boolean')
  }
  
  if (typeof criteria.sponsorRequired !== 'boolean') {
    errors.push('sponsorRequired must be a boolean')
  }
  
  // Validate salary thresholds if present
  if (criteria.salaryThresholds) {
    if (!Array.isArray(criteria.salaryThresholds)) {
      errors.push('salaryThresholds must be an array')
    } else {
      criteria.salaryThresholds.forEach((threshold, index) => {
        if (typeof threshold.amount !== 'number' || threshold.amount < 0) {
          errors.push(`salaryThresholds[${index}].amount must be a non-negative number`)
        }
        if (!threshold.currency || threshold.currency.trim() === '') {
          errors.push(`salaryThresholds[${index}].currency is required`)
        }
        if (threshold.period !== 'annual' && threshold.period !== 'monthly') {
          errors.push(`salaryThresholds[${index}].period must be 'annual' or 'monthly'`)
        }
      })
    }
  }
  
  // Validate education level if present
  if (criteria.educationLevel) {
    const validLevels = ['High School', 'Bachelor', 'Master', 'PhD', 'None']
    if (!validLevels.includes(criteria.educationLevel)) {
      errors.push(`educationLevel must be one of: ${validLevels.join(', ')}`)
    }
  }
  
  // Validate experience years if present
  if (criteria.experienceYears !== undefined) {
    if (typeof criteria.experienceYears !== 'number' || criteria.experienceYears < 0) {
      errors.push('experienceYears must be a non-negative number')
    }
  }
  
  // Validate criteria weights if present
  if (criteria.criteriaWeights) {
    const weights = criteria.criteriaWeights
    const requiredKeys = ['salary', 'education', 'experience', 'documentation', 'other']
    
    for (const key of requiredKeys) {
      if (typeof weights[key as keyof typeof weights] !== 'number') {
        errors.push(`criteriaWeights.${key} must be a number`)
      }
    }
    
    const sum = weights.salary + weights.education + weights.experience + weights.documentation + weights.other
    if (Math.abs(sum - 100) > 0.01) {
      errors.push(`criteriaWeights must sum to 100 (current sum: ${sum})`)
    }
  }
  
  return errors
}

/**
 * Validates all visa criteria configurations on startup
 * Logs warnings for any invalid configurations
 */
export function validateAllVisaCriteriaConfigs(): void {
  logger.info('Validating visa criteria configurations...')
  
  let validCount = 0
  let invalidCount = 0
  
  for (const [key, criteria] of Object.entries(VISA_CRITERIA_CONFIGS)) {
    const errors = validateVisaCriteriaConfig(criteria)
    
    if (errors.length > 0) {
      logger.warn('Invalid visa criteria configuration', { key, errors })
      invalidCount++
    } else {
      validCount++
    }
  }
  
  logger.info('Visa criteria validation complete', { 
    total: validCount + invalidCount,
    valid: validCount, 
    invalid: invalidCount 
  })
  
  if (invalidCount > 0) {
    logger.warn('Some visa criteria configurations are invalid and may not work correctly')
  }
}
