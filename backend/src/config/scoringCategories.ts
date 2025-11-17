/**
 * Scoring Categories Configuration
 * 
 * Defines evaluation categories and weights for visa application scoring.
 * Categories are used internally by the AI to assess applications across
 * multiple dimensions. The weighted scores are combined to produce the final score.
 */

/**
 * Represents a single scoring category with its weight and description
 */
export interface ScoringCategory {
  name: string
  weight: number
  description: string
}

/**
 * Configuration for visa-specific scoring categories
 */
export interface VisaScoringConfig {
  categories: ScoringCategory[]
}

/**
 * Internal interface for category score calculation (not exposed to users)
 */
export interface InternalCategoryScore {
  category: string
  score: number
  weight: number
  weightedScore: number
  reasoning: string
}

/**
 * Default scoring configuration used when no visa-specific config exists
 * 
 * Categories:
 * - Professional Qualifications (30%): Education, work experience, skills
 * - Financial Stability (20%): Employment contracts, bank statements
 * - Documentation Quality (25%): Completeness, authenticity, organization
 * - Language Proficiency (15%): Language certificates, evidence of skills
 * - Country-Specific Requirements (10%): Visa-specific compliance
 * 
 * Total weight: 100%
 */
export const DEFAULT_SCORING_CONFIG: VisaScoringConfig = {
  categories: [
    {
      name: 'Professional Qualifications',
      weight: 30,
      description: 'Education, work experience, skills relevant to visa type'
    },
    {
      name: 'Financial Stability',
      weight: 20,
      description: 'Employment contracts, bank statements, financial documents'
    },
    {
      name: 'Documentation Quality',
      weight: 25,
      description: 'Completeness, authenticity, and organization of documents'
    },
    {
      name: 'Language Proficiency',
      weight: 15,
      description: 'Language certificates, evidence of language skills'
    },
    {
      name: 'Country-Specific Requirements',
      weight: 10,
      description: 'Visa-specific requirements and compliance'
    }
  ]
}

/**
 * Visa-specific scoring configurations
 * 
 * Allows customization of category weights for specific visa types.
 * Key format: "{country}-{visaType}"
 */
export const VISA_SPECIFIC_CONFIGS: Record<string, VisaScoringConfig> = {
  'United States-O-1A': {
    categories: [
      {
        name: 'Professional Qualifications',
        weight: 40,
        description: 'Extraordinary ability evidence and achievements'
      },
      {
        name: 'Documentation Quality',
        weight: 30,
        description: 'Supporting evidence quality and comprehensiveness'
      },
      {
        name: 'Financial Stability',
        weight: 15,
        description: 'Financial backing and employment arrangements'
      },
      {
        name: 'Language Proficiency',
        weight: 10,
        description: 'English proficiency for professional work'
      },
      {
        name: 'Country-Specific Requirements',
        weight: 5,
        description: 'O-1A specific criteria and requirements'
      }
    ]
  }
}

/**
 * Retrieves the appropriate scoring configuration for a visa type
 * 
 * @param country - Target country for visa application
 * @param visaType - Specific visa type being applied for
 * @returns Scoring configuration (visa-specific or default)
 */
export function getScoringConfig(country: string, visaType: string): VisaScoringConfig {
  const key = `${country}-${visaType}`
  return VISA_SPECIFIC_CONFIGS[key] || DEFAULT_SCORING_CONFIG
}

/**
 * Validates that category weights sum to 100%
 * 
 * @param config - Scoring configuration to validate
 * @throws Error if weights don't sum to 100
 */
export function validateScoringConfig(config: VisaScoringConfig): void {
  const totalWeight = config.categories.reduce((sum, cat) => sum + cat.weight, 0)
  
  if (Math.abs(totalWeight - 100) > 0.01) {
    throw new Error(
      `Scoring category weights must sum to 100%. Current total: ${totalWeight}%`
    )
  }
}

// Validate default configuration on module load
validateScoringConfig(DEFAULT_SCORING_CONFIG)

// Validate all visa-specific configurations
Object.entries(VISA_SPECIFIC_CONFIGS).forEach(([key, config]) => {
  try {
    validateScoringConfig(config)
  } catch (error) {
    throw new Error(`Invalid scoring configuration for ${key}: ${error}`)
  }
})
