import { z } from 'zod';

/**
 * Environment variable validation schema
 * Ensures all required configuration is present and valid
 */
const envSchema = z.object({
  // Server Configuration
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database Configuration
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_TEST_URI: z.string().optional(),

  // File Upload Configuration
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().default('5242880').transform(Number), // 5MB default

  // Evaluation Configuration
  SUCCESS_CAP: z.string().default('85').transform(Number).pipe(
    z.number().min(0).max(100)
  ),
  EVALUATOR_TYPE: z.enum(['rule-based', 'ai']).default('rule-based'),
  
  // Timeout Configuration (in milliseconds)
  // Hierarchy: REQUEST_TIMEOUT_MS should be >= AI_API_TIMEOUT_MS + buffer
  REQUEST_TIMEOUT_MS: z.string().default('120000').transform(Number), // 2 minutes - overall request timeout
  DB_QUERY_TIMEOUT_MS: z.string().default('10000').transform(Number), // 10 seconds - database operations
  AI_API_TIMEOUT_MS: z.string().default('60000').transform(Number), // 60 seconds - AI API calls
  FILE_UPLOAD_TIMEOUT_MS: z.string().default('120000').transform(Number), // 2 minutes - file uploads

  // AI Service Configuration (conditional based on EVALUATOR_TYPE)
  OPENAI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('gpt-4'),

  // AI Evaluation Configuration
  ENABLE_DOCUMENT_PARSING: z.string().default('true').transform(val => val === 'true'),
  MAX_DOCUMENT_TEXT_LENGTH: z.string().default('10000').transform(Number),
  PARSING_TIMEOUT: z.string().default('30000').transform(Number),
  AI_TEMPERATURE: z.string().default('0.7').transform(Number),
  AI_MAX_TOKENS: z.string().default('2000').transform(Number),
  AI_RETRY_ATTEMPTS: z.string().default('2').transform(Number),
  USE_MOCK_AI: z.string().default('false').transform(val => val === 'true'),

  // Email Configuration
  SMTP_ENABLED: z.string().default('false').transform(val => val === 'true'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform(val => val ? Number(val) : undefined),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // Security Configuration
  API_KEY_LENGTH: z.string().default('32').transform(Number),
  ADMIN_API_KEY: z.string().optional(), // Administrator API key for sensitive endpoints
  CORS_ORIGINS: z.string().default('http://localhost:3000').refine(
    (origins) => {
      // In production, ensure no wildcard is present
      if (process.env.NODE_ENV === 'production') {
        const originList = origins.split(',').map(o => o.trim()).filter(Boolean);
        
        // Check for wildcard
        if (originList.includes('*')) {
          return false;
        }
        
        // Validate all origins are valid URLs
        for (const origin of originList) {
          try {
            const url = new URL(origin);
            // In production, enforce HTTPS
            if (url.protocol !== 'https:') {
              return false;
            }
          } catch (error) {
            return false;
          }
        }
      }
      return true;
    },
    {
      message: 'Production CORS origins must be valid HTTPS URLs without wildcards'
    }
  ),

  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Rate Limiting Configuration
  RATE_LIMIT_GENERAL_MAX: z.string().default('100').transform(Number),
  RATE_LIMIT_GENERAL_WINDOW_MS: z.string().default('900000').transform(Number), // 15 minutes
  RATE_LIMIT_EVALUATION_MAX: z.string().default('10').transform(Number),
  RATE_LIMIT_EVALUATION_WINDOW_MS: z.string().default('3600000').transform(Number), // 1 hour
  RATE_LIMIT_PARTNER_MAX: z.string().default('1000').transform(Number),
  RATE_LIMIT_PARTNER_WINDOW_MS: z.string().default('3600000').transform(Number), // 1 hour
  RATE_LIMIT_PARTNER_EVAL_MAX: z.string().default('50').transform(Number),
  RATE_LIMIT_PARTNER_EVAL_WINDOW_MS: z.string().default('3600000').transform(Number), // 1 hour
  RATE_LIMIT_PUBLIC_READ_MAX: z.string().default('200').transform(Number),
  RATE_LIMIT_PUBLIC_READ_WINDOW_MS: z.string().default('900000').transform(Number), // 15 minutes
  RATE_LIMIT_DOWNLOAD_MAX: z.string().default('20').transform(Number),
  RATE_LIMIT_DOWNLOAD_WINDOW_MS: z.string().default('900000').transform(Number) // 15 minutes
}).refine(
  (data) => data.EVALUATOR_TYPE !== 'ai' || data.OPENAI_API_KEY,
  {
    message: 'OPENAI_API_KEY is required when EVALUATOR_TYPE is set to "ai"',
    path: ['OPENAI_API_KEY']
  }
).refine(
  (data) => data.REQUEST_TIMEOUT_MS >= data.AI_API_TIMEOUT_MS,
  {
    message: 'REQUEST_TIMEOUT_MS must be greater than or equal to AI_API_TIMEOUT_MS to prevent premature timeouts',
    path: ['REQUEST_TIMEOUT_MS']
  }
).refine(
  (data) => data.REQUEST_TIMEOUT_MS >= data.DB_QUERY_TIMEOUT_MS,
  {
    message: 'REQUEST_TIMEOUT_MS must be greater than or equal to DB_QUERY_TIMEOUT_MS',
    path: ['REQUEST_TIMEOUT_MS']
  }
);

/**
 * Validated environment configuration type
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables and returns typed configuration object
 * @throws {Error} If validation fails with detailed error messages
 * @returns {Env} Validated and typed environment configuration
 */
export function validateEnv(): Env {
  try {
    const validated = envSchema.parse(process.env);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      throw new Error(`Environment configuration validation failed: ${errorMessages}`);
    }
    throw error;
  }
}

/**
 * Validated configuration object for use across the application
 * Call this after loading environment variables with dotenv
 */
let config: Env;

export function getConfig(): Env {
  if (!config) {
    config = validateEnv();
  }
  return config;
}

export { config };
