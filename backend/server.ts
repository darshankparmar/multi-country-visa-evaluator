/**
 * Server entry point
 * Initializes environment, database, and starts Express server
 * 
 * IMPORTANT: dotenv.config() must be called before any imports
 * to ensure environment variables are available during module initialization
 */

// Load environment variables FIRST, before any imports
import dotenv from 'dotenv';
dotenv.config();

// Now import application modules
import { createApp } from './src/app';
import { getConfig, validateEnv } from './src/config/environment';
import { connectDatabase, disconnectDatabase } from './src/config/database';
import { seedDatabase } from './src/seeders/visaTypeSeeder';
import { logger } from './src/config/logger';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Ensure upload directory exists
 */
async function ensureUploadDirectory(): Promise<void> {
  const config = getConfig();
  const uploadDir = path.resolve(config.UPLOAD_DIR);

  try {
    await fs.access(uploadDir);
    logger.info('Upload directory exists', { path: uploadDir });
  } catch {
    logger.info('Creating upload directory', { path: uploadDir });
    await fs.mkdir(uploadDir, { recursive: true });
    logger.info('Upload directory created successfully', { path: uploadDir });
  }
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Validate environment variables
    logger.info('Validating environment configuration...');
    const config = validateEnv();
    logger.info('Environment configuration validated successfully', {
      nodeEnv: config.NODE_ENV,
      port: config.PORT,
      evaluatorType: config.EVALUATOR_TYPE,
      smtpEnabled: config.SMTP_ENABLED
    });

    // Ensure upload directory exists
    await ensureUploadDirectory();

    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await connectDatabase();
    logger.info('MongoDB connection established');

    // Run visa type seeder
    logger.info('Running visa type seeder...');
    await seedDatabase();
    logger.info('Visa type seeding completed');

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.PORT, () => {
      logger.info('Server started successfully', {
        port: config.PORT,
        environment: config.NODE_ENV,
        timestamp: new Date().toISOString()
      });
      logger.info(`Server is running at http://localhost:${config.PORT}`);
      logger.info(`Health check available at http://localhost:${config.PORT}/api/health`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close database connection
          await disconnectDatabase();
          logger.info('Database connection closed');

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack
      });
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled promise rejection', {
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : undefined
      });
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

// Start the server
startServer();
