import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors';
import { logger } from '../config/logger';

/**
 * Validation middleware factory
 * Creates middleware that validates request data against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @param source - Which part of the request to validate ('body', 'query', 'params')
 * @returns Express middleware function
 */
export function validateRequest(
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate the specified part of the request
      const validated = await schema.parseAsync(req[source]);
      
      // Replace request data with validated data (includes defaults and transformations)
      req[source] = validated;
      
      logger.debug('Request validation successful', {
        requestId: req.requestId,
        source,
        path: req.path
      });
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into user-friendly messages
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));

        logger.warn('Request validation failed', {
          requestId: req.requestId,
          path: req.path,
          source,
          errors
        });

        // Create validation error with detailed messages
        const errorMessage = `Validation failed: ${errors.map(e => `${e.field} - ${e.message}`).join(', ')}`;
        next(new ValidationError(errorMessage));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Zod schema for creating an evaluation
 * Validates POST /api/evaluations request body
 */
export const createEvaluationSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  
  country: z.string()
    .min(1, 'Country is required')
    .max(100, 'Country must be less than 100 characters')
    .trim(),
  
  visaType: z.string()
    .min(1, 'Visa type is required')
    .max(200, 'Visa type must be less than 200 characters')
    .trim()
});

/**
 * Zod schema for creating a partner
 * Validates POST /api/partners request body
 */
export const createPartnerSchema = z.object({
  name: z.string()
    .min(1, 'Partner name is required')
    .max(200, 'Partner name must be less than 200 characters')
    .trim(),
  
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  
  contactInfo: z.object({
    phone: z.string()
      .optional()
      .transform(val => val?.trim()),
    
    website: z.string()
      .url('Invalid website URL')
      .optional()
      .transform(val => val?.trim())
  }).optional()
});

/**
 * Zod schema for updating partner status
 * Validates PATCH /api/partners/:id/status request body
 */
export const updatePartnerStatusSchema = z.object({
  active: z.boolean({
    required_error: 'Active status is required',
    invalid_type_error: 'Active must be a boolean'
  })
});

/**
 * Zod schema for listing evaluations query parameters
 * Validates GET /api/evaluations query string
 */
export const listEvaluationsQuerySchema = z.object({
  page: z.string()
    .optional()
    .default('1')
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int().positive()),
  
  limit: z.string()
    .optional()
    .default('20')
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100)),
  
  partnerId: z.string()
    .optional(),
  
  startDate: z.string()
    .datetime('Invalid start date format')
    .optional(),
  
  endDate: z.string()
    .datetime('Invalid end date format')
    .optional(),
  
  country: z.string()
    .optional()
    .transform(val => val?.trim()),
  
  email: z.string()
    .email('Invalid email format')
    .optional()
    .transform(val => val?.toLowerCase().trim())
});

/**
 * Zod schema for MongoDB ObjectId validation
 * Validates route parameters that should be valid ObjectIds
 */
export const objectIdParamSchema = z.object({
  id: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format')
});

/**
 * Zod schema for evaluation ID parameter
 * Validates route parameters for evaluation endpoints
 */
export const evaluationIdParamSchema = z.object({
  id: z.string()
    .uuid('Invalid evaluation ID format')
});

/**
 * Zod schema for country parameter
 * Validates route parameters for visa type endpoints
 */
export const countryParamSchema = z.object({
  country: z.string()
    .min(1, 'Country is required')
    .max(100, 'Country must be less than 100 characters')
    .trim()
});

/**
 * Zod schema for updating evaluation results
 * Validates PATCH /api/evaluations/:id/results request body
 */
export const updateEvaluationResultsSchema = z.object({
  score: z.number()
    .min(0, 'Score must be at least 0')
    .max(100, 'Score must be at most 100'),
  
  summary: z.string()
    .min(1, 'Summary is required')
    .max(5000, 'Summary must be less than 5000 characters')
    .trim()
});

/**
 * Middleware to validate file uploads
 * Checks that required files are present in the request
 * 
 * @param required - Whether files are required
 * @param minFiles - Minimum number of files required
 * @param maxFiles - Maximum number of files allowed
 */
export function validateFileUpload(
  required: boolean = true,
  minFiles: number = 1,
  maxFiles: number = 10
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;

      if (required && (!files || files.length === 0)) {
        throw new ValidationError('At least one document file is required');
      }

      if (files && files.length < minFiles) {
        throw new ValidationError(`At least ${minFiles} document file(s) required`);
      }

      if (files && files.length > maxFiles) {
        throw new ValidationError(`Maximum ${maxFiles} document files allowed`);
      }

      logger.debug('File upload validation successful', {
        requestId: req.requestId,
        fileCount: files?.length || 0
      });

      next();
    } catch (error) {
      next(error);
    }
  };
}
