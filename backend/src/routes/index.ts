import { Router, Request, Response } from 'express';
import evaluationRoutes from './evaluations';
import visaTypeRoutes from './visaTypes';
import partnerRoutes from './partners';
import { isConnected } from '../config/database';
import { logger } from '../config/logger';

/**
 * Main router that aggregates all API routes
 * Registers all route modules and provides health check endpoint
 * Requirements: 9.1
 */
const router = Router();

/**
 * Health check endpoint
 * Returns service status and MongoDB connection state
 * 
 * GET /api/health
 */
router.get('/health', (req: Request, res: Response) => {
  const dbConnected = isConnected();
  const status = dbConnected ? 'healthy' : 'degraded';
  const statusCode = dbConnected ? 200 : 503;

  logger.info('Health check requested', {
    status,
    database: dbConnected ? 'connected' : 'disconnected',
    requestId: req.requestId
  });

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      api: 'operational',
      database: dbConnected ? 'connected' : 'disconnected'
    }
  });
});

/**
 * Register all route modules
 */
router.use('/evaluations', evaluationRoutes);
router.use('/visa-types', visaTypeRoutes);
router.use('/partners', partnerRoutes);

export default router;
