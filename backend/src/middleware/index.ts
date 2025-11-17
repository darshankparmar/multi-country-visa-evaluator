/**
 * Middleware exports
 * Central export point for all middleware functions
 */

export { authenticatePartner, optionalAuthentication } from './auth';
export { errorHandler, notFoundHandler, asyncHandler } from './errorHandler';
export { requestLogger, errorLogger } from './requestLogger';
export { requestTimeout } from './timeout';
export { default as upload, uploadDocuments, uploadSingleDocument } from './upload';
export {
  validateRequest,
  validateFileUpload,
  createEvaluationSchema,
  createPartnerSchema,
  updatePartnerStatusSchema,
  listEvaluationsQuerySchema,
  objectIdParamSchema,
  evaluationIdParamSchema,
  countryParamSchema,
  updateEvaluationResultsSchema
} from './validation';
