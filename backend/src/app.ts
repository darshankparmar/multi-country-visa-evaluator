import express, { Application } from 'express';
import cors from 'cors';
import { getConfig } from './config/environment';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { initializeRateLimiters, generalApiLimiter } from './config/rateLimits';
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

  // Parse CORS origins from comma-separated string
  const corsOrigins = config.CORS_ORIGINS.split(',').map(origin => origin.trim());

  // Configure CORS with whitelist
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      if (corsOrigins.includes(origin) || corsOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
  };

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
