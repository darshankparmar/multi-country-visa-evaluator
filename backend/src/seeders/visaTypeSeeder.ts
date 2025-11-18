import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { VisaType } from '../models/VisaType';
import { DocumentType } from '../types/visaType.types';
import { logger } from '../config/logger';
import { VISA_CRITERIA_CONFIGS } from '../config/visaCriteria';

// Load environment variables
dotenv.config();

/**
 * Initial visa type seed data
 * Synchronized with visa criteria configurations from visaCriteria.ts
 * Includes all visa types with their required documents, descriptions, and processing times
 */
const visaTypeSeedData = [
  // Ireland
  {
    country: 'Ireland',
    visaType: 'Critical Skills Employment Permit',
    requiredDocuments: [
      DocumentType.RESUME,
      DocumentType.EMPLOYMENT_CONTRACT,
      DocumentType.EDUCATION_CERTIFICATES,
      DocumentType.PASSPORT_COPY
    ],
    description: VISA_CRITERIA_CONFIGS['Ireland-Critical Skills Employment Permit'].description,
    processingTime: VISA_CRITERIA_CONFIGS['Ireland-Critical Skills Employment Permit'].processingTime
  },
  {
    country: 'Ireland',
    visaType: 'General Employment Permit',
    requiredDocuments: [
      DocumentType.RESUME,
      DocumentType.EMPLOYMENT_CONTRACT,
      DocumentType.PASSPORT_COPY
    ],
    description: VISA_CRITERIA_CONFIGS['Ireland-General Employment Permit'].description,
    processingTime: VISA_CRITERIA_CONFIGS['Ireland-General Employment Permit'].processingTime
  },

  // Poland
  {
    country: 'Poland',
    visaType: 'Work Permit Type A',
    requiredDocuments: [
      DocumentType.RESUME,
      DocumentType.EMPLOYMENT_CONTRACT,
      DocumentType.EDUCATION_CERTIFICATES,
      DocumentType.PASSPORT_COPY
    ],
    description: VISA_CRITERIA_CONFIGS['Poland-Work Permit Type A'].description,
    processingTime: VISA_CRITERIA_CONFIGS['Poland-Work Permit Type A'].processingTime
  },
  {
    country: 'Poland',
    visaType: 'Work Permit Type C',
    requiredDocuments: [
      DocumentType.RESUME,
      DocumentType.EMPLOYMENT_CONTRACT,
      DocumentType.PASSPORT_COPY,
      DocumentType.REFERENCE_LETTERS
    ],
    description: VISA_CRITERIA_CONFIGS['Poland-Work Permit Type C'].description,
    processingTime: VISA_CRITERIA_CONFIGS['Poland-Work Permit Type C'].processingTime
  },

  // France
  {
    country: 'France',
    visaType: 'Talent Passport',
    requiredDocuments: [
      DocumentType.RESUME,
      DocumentType.EMPLOYMENT_CONTRACT,
      DocumentType.EDUCATION_CERTIFICATES,
      DocumentType.PASSPORT_COPY,
      DocumentType.FINANCIAL_DOCUMENTS
    ],
    description: VISA_CRITERIA_CONFIGS['France-Talent Passport'].description,
    processingTime: VISA_CRITERIA_CONFIGS['France-Talent Passport'].processingTime
  },
  {
    country: 'France',
    visaType: 'Salarié en Mission',
    requiredDocuments: [
      DocumentType.RESUME,
      DocumentType.EMPLOYMENT_CONTRACT,
      DocumentType.PASSPORT_COPY,
      DocumentType.REFERENCE_LETTERS
    ],
    description: VISA_CRITERIA_CONFIGS['France-Salarié en Mission'].description,
    processingTime: VISA_CRITERIA_CONFIGS['France-Salarié en Mission'].processingTime
  },

  // Netherlands
  {
    country: 'Netherlands',
    visaType: 'Knowledge Migrant Permit',
    requiredDocuments: [
      DocumentType.RESUME,
      DocumentType.EMPLOYMENT_CONTRACT,
      DocumentType.EDUCATION_CERTIFICATES,
      DocumentType.PASSPORT_COPY
    ],
    description: VISA_CRITERIA_CONFIGS['Netherlands-Knowledge Migrant Permit'].description,
    processingTime: VISA_CRITERIA_CONFIGS['Netherlands-Knowledge Migrant Permit'].processingTime
  },
  {
    country: 'Netherlands',
    visaType: 'Orientation Year Permit',
    requiredDocuments: [
      DocumentType.RESUME,
      DocumentType.EDUCATION_CERTIFICATES,
      DocumentType.PASSPORT_COPY
    ],
    description: VISA_CRITERIA_CONFIGS['Netherlands-Orientation Year Permit'].description,
    processingTime: VISA_CRITERIA_CONFIGS['Netherlands-Orientation Year Permit'].processingTime
  },

  // Germany
  {
    country: 'Germany',
    visaType: 'EU Blue Card',
    requiredDocuments: [
      DocumentType.RESUME,
      DocumentType.EMPLOYMENT_CONTRACT,
      DocumentType.EDUCATION_CERTIFICATES,
      DocumentType.PASSPORT_COPY
    ],
    description: VISA_CRITERIA_CONFIGS['Germany-EU Blue Card'].description,
    processingTime: VISA_CRITERIA_CONFIGS['Germany-EU Blue Card'].processingTime
  },
  {
    country: 'Germany',
    visaType: 'ICT Permit',
    requiredDocuments: [
      DocumentType.RESUME,
      DocumentType.EMPLOYMENT_CONTRACT,
      DocumentType.REFERENCE_LETTERS,
      DocumentType.PASSPORT_COPY
    ],
    description: VISA_CRITERIA_CONFIGS['Germany-ICT Permit'].description,
    processingTime: VISA_CRITERIA_CONFIGS['Germany-ICT Permit'].processingTime
  },

  // United States
  {
    country: 'United States',
    visaType: 'O-1A Visa',
    requiredDocuments: [
      DocumentType.RESUME,
      DocumentType.REFERENCE_LETTERS,
      DocumentType.EDUCATION_CERTIFICATES,
      DocumentType.PASSPORT_COPY,
      DocumentType.PERSONAL_STATEMENT
    ],
    description: VISA_CRITERIA_CONFIGS['United States-O-1A Visa'].description,
    processingTime: VISA_CRITERIA_CONFIGS['United States-O-1A Visa'].processingTime
  },
  {
    country: 'United States',
    visaType: 'H-1B Visa',
    requiredDocuments: [
      DocumentType.RESUME,
      DocumentType.EMPLOYMENT_CONTRACT,
      DocumentType.EDUCATION_CERTIFICATES,
      DocumentType.PASSPORT_COPY
    ],
    description: VISA_CRITERIA_CONFIGS['United States-H-1B Visa'].description,
    processingTime: VISA_CRITERIA_CONFIGS['United States-H-1B Visa'].processingTime
  }
];

/**
 * Seeds the database with initial visa type data
 * Checks for existing data to avoid duplicates
 * Validates that all visa types in criteria config are included
 * @returns Promise that resolves when seeding is complete
 */
export async function seedDatabase(): Promise<void> {
  try {
    logger.info('Starting visa type seeding process...');

    // Validate that all visa types in criteria config are in seed data
    const criteriaKeys = Object.keys(VISA_CRITERIA_CONFIGS);
    const seedKeys = visaTypeSeedData.map(vt => `${vt.country}-${vt.visaType}`);
    
    const missingInSeed = criteriaKeys.filter(key => !seedKeys.includes(key));
    const missingInCriteria = seedKeys.filter(key => !criteriaKeys.includes(key));
    
    if (missingInSeed.length > 0) {
      logger.warn('Visa types in criteria config but not in seed data', { 
        missingVisaTypes: missingInSeed 
      });
    }
    
    if (missingInCriteria.length > 0) {
      logger.warn('Visa types in seed data but not in criteria config', { 
        missingVisaTypes: missingInCriteria 
      });
    }
    
    logger.info('Visa type validation complete', {
      totalCriteriaConfigs: criteriaKeys.length,
      totalSeedData: seedKeys.length,
      missingInSeed: missingInSeed.length,
      missingInCriteria: missingInCriteria.length
    });

    // Check if data already exists
    const existingCount = await VisaType.countDocuments();
    
    if (existingCount > 0) {
      logger.info(`Database already contains ${existingCount} visa types. Skipping seed.`);
      return;
    }

    // Insert seed data
    const result = await VisaType.insertMany(visaTypeSeedData);
    
    logger.info(`Successfully seeded ${result.length} visa types`, {
      countries: [...new Set(result.map(vt => vt.country))],
      totalVisaTypes: result.length,
      visaTypes: result.map(vt => `${vt.country}-${vt.visaType}`)
    });

  } catch (error) {
    logger.error('Error seeding visa types', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Main execution function
 * Connects to database, runs seeder, and disconnects
 */
async function main(): Promise<void> {
  try {
    await connectDatabase();
    await seedDatabase();
    await disconnectDatabase();
    logger.info('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    process.exit(1);
  }
}

// Run seeder if executed directly
if (require.main === module) {
  main();
}
