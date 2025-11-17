import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { VisaType } from '../models/VisaType';
import { DocumentType } from '../types/visaType.types';
import { logger } from '../config/logger';

// Load environment variables
dotenv.config();

/**
 * Initial visa type seed data
 * Includes 6 countries with multiple visa types and their required documents
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
    description: 'For highly skilled workers in occupations on the Critical Skills list',
    processingTime: '8-12 weeks'
  },
  {
    country: 'Ireland',
    visaType: 'General Employment Permit',
    requiredDocuments: [
      DocumentType.RESUME,
      DocumentType.EMPLOYMENT_CONTRACT,
      DocumentType.PASSPORT_COPY
    ],
    description: 'For employment in occupations not on the ineligible list',
    processingTime: '8-12 weeks'
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
    description: 'For foreign nationals working for Polish employers',
    processingTime: '1-2 months'
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
    description: 'For delegated workers and service providers',
    processingTime: '1-2 months'
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
    description: 'For highly qualified professionals, investors, and entrepreneurs',
    processingTime: '2-4 months'
  },
  {
    country: 'France',
    visaType: 'Employee Work Permit',
    requiredDocuments: [
      DocumentType.RESUME,
      DocumentType.EMPLOYMENT_CONTRACT,
      DocumentType.PASSPORT_COPY,
      DocumentType.EDUCATION_CERTIFICATES
    ],
    description: 'Standard work authorization for employees',
    processingTime: '2-3 months'
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
    description: 'For highly skilled migrants with recognized sponsors',
    processingTime: '2-4 weeks'
  },
  {
    country: 'Netherlands',
    visaType: 'Orientation Year Permit',
    requiredDocuments: [
      DocumentType.RESUME,
      DocumentType.EDUCATION_CERTIFICATES,
      DocumentType.PASSPORT_COPY
    ],
    description: 'For recent graduates to seek employment',
    processingTime: '4-6 weeks'
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
    description: 'For highly qualified non-EU workers with university degrees',
    processingTime: '1-3 months'
  },
  {
    country: 'Germany',
    visaType: 'Skilled Worker Visa',
    requiredDocuments: [
      DocumentType.RESUME,
      DocumentType.EMPLOYMENT_CONTRACT,
      DocumentType.EDUCATION_CERTIFICATES,
      DocumentType.PASSPORT_COPY,
      DocumentType.REFERENCE_LETTERS
    ],
    description: 'For qualified professionals with vocational training',
    processingTime: '1-3 months'
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
    description: 'For individuals with extraordinary ability in sciences, education, business, or athletics',
    processingTime: '2-3 months'
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
    description: 'For specialty occupation workers',
    processingTime: '3-6 months'
  },
  {
    country: 'United States',
    visaType: 'L-1 Visa',
    requiredDocuments: [
      DocumentType.RESUME,
      DocumentType.EMPLOYMENT_CONTRACT,
      DocumentType.REFERENCE_LETTERS,
      DocumentType.PASSPORT_COPY
    ],
    description: 'For intracompany transferees',
    processingTime: '2-4 months'
  }
];

/**
 * Seeds the database with initial visa type data
 * Checks for existing data to avoid duplicates
 * @returns Promise that resolves when seeding is complete
 */
export async function seedDatabase(): Promise<void> {
  try {
    logger.info('Starting visa type seeding process...');

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
      totalVisaTypes: result.length
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
