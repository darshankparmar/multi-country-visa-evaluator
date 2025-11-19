import express, { Application } from 'express';
import cors from 'cors';
import { getConfig } from './config/environment';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { initializeRateLimiters, generalApiLimiter } from './config/rateLimits';
import { configureSecurityHeaders, additionalSecurityHeaders } from './middleware/securityHeaders';
import { logger } from './config/logger';
import routes from './routes/index';

/**
 * Create and configure Express application
 * Sets up middleware, routes, and error handling
 */
export function createApp(): Application {
  const app = express();
  const config = getConfig();

  // Initialize rate limiters and log configuration
  initializeRateLimiters();

  // Parse and validate CORS origins from comma-separated string
  const corsOrigins = config.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean);

  // Validate CORS configuration on startup
  if (config.NODE_ENV === 'production') {
    if (corsOrigins.includes('*')) {
      logger.error('CRITICAL: Wildcard CORS origin (*) is not allowed in production');
      throw new Error('Wildcard CORS origin is not allowed in production environment');
    }

    // Validate all origins are proper URLs
    for (const origin of corsOrigins) {
      try {
        new URL(origin);
      } catch (error) {
        logger.error('CRITICAL: Invalid CORS origin format', { origin });
        throw new Error(`Invalid CORS origin format: ${origin}`);
      }
    }

    logger.info('CORS configuration validated for production', {
      allowedOrigins: corsOrigins.length,
      origins: corsOrigins
    });
  } else {
    logger.info('CORS configuration loaded', {
      environment: config.NODE_ENV,
      allowedOrigins: corsOrigins.length,
      origins: corsOrigins,
      wildcardAllowed: corsOrigins.includes('*')
    });
  }

  // Configure CORS with strict origin validation
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin requests)
      if (!origin) {
        return callback(null, true);
      }

      // In production, reject wildcard immediately
      if (config.NODE_ENV === 'production' && corsOrigins.includes('*')) {
        logger.error('CRITICAL: Wildcard CORS detected in production runtime', { origin });
        return callback(new Error('CORS misconfiguration'));
      }

      // Check for wildcard in development/test
      if (corsOrigins.includes('*') && config.NODE_ENV !== 'production') {
        logger.debug('CORS: Wildcard origin allowed in non-production', { origin });
        return callback(null, true);
      }

      // Validate origin format
      let originUrl: URL;
      try {
        originUrl = new URL(origin);
      } catch (error) {
        logger.warn('CORS: Invalid origin format rejected', { origin });
        return callback(new Error('Invalid origin format'));
      }

      // Check if origin is in allowed list
      const isAllowed = corsOrigins.some(allowedOrigin => {
        if (allowedOrigin === '*') {
          return config.NODE_ENV !== 'production';
        }

        try {
          const allowedUrl = new URL(allowedOrigin);
          // Compare protocol, hostname, and port
          return (
            originUrl.protocol === allowedUrl.protocol &&
            originUrl.hostname === allowedUrl.hostname &&
            originUrl.port === allowedUrl.port
          );
        } catch (error) {
          logger.warn('CORS: Invalid allowed origin in configuration', { allowedOrigin });
          return false;
        }
      });

      if (isAllowed) {
        logger.debug('CORS: Origin allowed', { origin });
        callback(null, true);
      } else {
        logger.warn('CORS: Origin rejected', {
          origin,
          allowedOrigins: corsOrigins,
          environment: config.NODE_ENV
        });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    maxAge: 86400 // 24 hours - cache preflight requests
  };

  // Apply security headers (must be early in middleware chain)
  app.use(configureSecurityHeaders());
  app.use(additionalSecurityHeaders);

  app.use(cors(corsOptions));

  // Body parser middleware with 10MB limit
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging middleware
  app.use(requestLogger);

  // Apply general API rate limiter to all /api/* routes
  // This protects all API endpoints with IP-based rate limiting
  app.use('/api', generalApiLimiter);

  // Register all routes under /api prefix
  app.use('/api', routes);

  // Handle 404 for undefined routes
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
