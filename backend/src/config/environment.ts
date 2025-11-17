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

  // AI Service Configuration (conditional based on EVALUATOR_TYPE)
  OPENAI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('gpt-4'),

  // Email Configuration
  SMTP_ENABLED: z.string().default('false').transform(val => val === 'true'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform(val => val ? Number(val) : undefined),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // Security Configuration
  API_KEY_LENGTH: z.string().default('32').transform(Number),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info')
}).refine(
  (data) => data.EVALUATOR_TYPE !== 'ai' || data.OPENAI_API_KEY,
  {
    message: 'OPENAI_API_KEY is required when EVALUATOR_TYPE is set to "ai"',
    path: ['OPENAI_API_KEY']
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
