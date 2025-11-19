import { Router, Request, Response } from 'express';
import evaluationRoutes from './evaluations';
import visaTypeRoutes from './visaTypes';
import partnerRoutes from './partners';
import { isConnected } from '../config/database';
import { logger } from '../config/logger';
import { getConfig } from '../config/environment';
import { optionalAdminAuth } from '../middleware/adminAuth';
import mongoose from 'mongoose';

/**
 * Main router that aggregates all API routes
 * Registers all route modules and provides health check endpoint
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
 * Returns basic service status for public access
 * Returns detailed information if authenticated with admin key
 * 
 * GET /api/health
 * Optional header: x-admin-key for detailed information
 */
router.get('/health', optionalAdminAuth, (req: Request, res: Response) => {
  const config = getConfig();
  const dbConnected = isConnected();
  const status = dbConnected ? 'healthy' : 'degraded';
  const statusCode = dbConnected ? 200 : 503;
  const uptimeSeconds = getUptime();
  const isAdmin = (req as any).isAdmin === true;

  logger.info('Health check requested', {
    status,
    database: dbConnected ? 'connected' : 'disconnected',
    uptime: uptimeSeconds,
    requestId: req.requestId,
    isAdmin
  });

  // Basic response for public access
  const response: any = {
    status,
    version: getVersion(),
    uptime: uptimeSeconds,
    uptimeFormatted: formatUptime(uptimeSeconds),
    timestamp: new Date().toISOString(),
    services: {
      api: 'operational',
      database: dbConnected ? 'connected' : 'disconnected'
    }
  };

  // Add detailed information for admin access
  if (isAdmin) {
    response.environment = config.NODE_ENV;
    response.details = {
      database: {
        connected: dbConnected,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        readyState: mongoose.connection.readyState,
        readyStateText: getReadyStateText(mongoose.connection.readyState)
      },
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
        external: Math.round(process.memoryUsage().external / 1024 / 1024) + ' MB'
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      config: {
        nodeEnv: config.NODE_ENV,
        port: config.PORT,
        evaluatorType: config.EVALUATOR_TYPE,
        smtpEnabled: config.SMTP_ENABLED
      }
    };
  }

  res.status(statusCode).json(response);
});

/**
 * Get human-readable database connection state
 */
function getReadyStateText(state: number): string {
  const states: { [key: number]: string } = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[state] || 'unknown';
}

/**
 * Admin-only metrics endpoint
 * Returns detailed system metrics and statistics
 * Requires x-admin-key header
 * 
 * GET /api/metrics
 */
router.get('/metrics', optionalAdminAuth, (req: Request, res: Response): void => {
  const isAdmin = (req as any).isAdmin === true;

  // Require admin authentication for metrics
  if (!isAdmin) {
    logger.warn('Unauthorized metrics access attempt', {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(401).json({
      status: 'error',
      message: 'Administrator authentication required. Provide x-admin-key header.',
      code: 'ADMIN_AUTH_REQUIRED'
    });
    return;
  }

  const config = getConfig();
  const uptimeSeconds = getUptime();

  logger.info('Metrics requested by admin', {
    requestId: req.requestId,
    ip: req.ip
  });

  res.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: uptimeSeconds,
      formatted: formatUptime(uptimeSeconds),
      startTime: new Date(startTime).toISOString()
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      cpuUsage: process.cpuUsage(),
      memoryUsage: {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        rss: process.memoryUsage().rss,
        external: process.memoryUsage().external,
        arrayBuffers: process.memoryUsage().arrayBuffers
      }
    },
    database: {
      connected: isConnected(),
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      readyState: mongoose.connection.readyState,
      readyStateText: getReadyStateText(mongoose.connection.readyState)
    },
    configuration: {
      environment: config.NODE_ENV,
      port: config.PORT,
      evaluatorType: config.EVALUATOR_TYPE,
      smtpEnabled: config.SMTP_ENABLED,
      aiModel: config.AI_MODEL,
      successCap: config.SUCCESS_CAP
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
