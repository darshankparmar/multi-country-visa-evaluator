import { Router, Request, Response } from 'express';
import evaluationRoutes from './evaluations';
import visaTypeRoutes from './visaTypes';
import partnerRoutes from './partners';
import { isConnected } from '../config/database';
import { logger } from '../config/logger';
import { getConfig } from '../config/environment';

/**
 * Main router that aggregates all API routes
 * Registers all route modules and provides health check endpoint
 * Requirements: 9.1
 */
const router = Router();

/**
 * Application start time for uptime calculation
 */
const startTime = Date.now();

/**
 * Get package version from package.json
 */
const getVersion = (): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const packageJson = require('../../../package.json');
    return packageJson.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
};

/**
 * Calculate uptime in seconds
 */
const getUptime = (): number => {
  return Math.floor((Date.now() - startTime) / 1000);
};

/**
 * Format uptime as human-readable string
 */
const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
};

/**
 * Health check endpoint
 * Returns service status, version, uptime, environment, and MongoDB connection state
 * 
 * GET /api/health
 * Requirements: 9.1
 */
router.get('/health', (req: Request, res: Response) => {
  const config = getConfig();
  const dbConnected = isConnected();
  const status = dbConnected ? 'healthy' : 'degraded';
  const statusCode = dbConnected ? 200 : 503;
  const uptimeSeconds = getUptime();

  logger.info('Health check requested', {
    status,
    database: dbConnected ? 'connected' : 'disconnected',
    uptime: uptimeSeconds,
    requestId: req.requestId
  });

  res.status(statusCode).json({
    status,
    version: getVersion(),
    environment: config.NODE_ENV,
    uptime: uptimeSeconds,
    uptimeFormatted: formatUptime(uptimeSeconds),
    timestamp: new Date().toISOString(),
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
