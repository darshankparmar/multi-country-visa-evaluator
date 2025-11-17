import mongoose from 'mongoose';
import { logger } from './logger';
import { getConfig } from './environment';

/**
 * MongoDB connection options
 * Configures connection pooling, timeouts, and other connection parameters
 */
const connectionOptions: mongoose.ConnectOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  family: 4 // Use IPv4, skip trying IPv6
};

/**
 * Maximum number of connection retry attempts
 */
const MAX_RETRIES = 5;

/**
 * Delay between retry attempts in milliseconds
 */
const RETRY_DELAY = 5000;

/**
 * Establishes connection to MongoDB with retry logic
 * @param retryCount - Current retry attempt number (used internally)
 * @returns Promise that resolves when connection is established
 * @throws Error if connection fails after all retry attempts
 */
export async function connectDatabase(retryCount: number = 0): Promise<void> {
  const config = getConfig();
  const mongoUri = config.NODE_ENV === 'test' && config.MONGODB_TEST_URI
    ? config.MONGODB_TEST_URI
    : config.MONGODB_URI;

  try {
    logger.info('Attempting to connect to MongoDB...', {
      uri: mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'), // Hide credentials in logs
      attempt: retryCount + 1,
      maxRetries: MAX_RETRIES
    });

    await mongoose.connect(mongoUri, connectionOptions);

    logger.info('Successfully connected to MongoDB', {
      host: mongoose.connection.host,
      database: mongoose.connection.name
    });

    // Setup connection event handlers
    setupConnectionHandlers();

  } catch (error) {
    logger.error('MongoDB connection error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      attempt: retryCount + 1,
      maxRetries: MAX_RETRIES
    });

    if (retryCount < MAX_RETRIES) {
      logger.info(`Retrying connection in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectDatabase(retryCount + 1);
    }

    throw new Error(
      `Failed to connect to MongoDB after ${MAX_RETRIES} attempts: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Setup event handlers for MongoDB connection
 * Monitors connection state changes and errors
 */
function setupConnectionHandlers(): void {
  mongoose.connection.on('connected', () => {
    logger.info('Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('Mongoose connection error', { error: err.message });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('Mongoose disconnected from MongoDB');
  });

  // Handle application termination
  process.on('SIGINT', async () => {
    await disconnectDatabase();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

/**
 * Gracefully closes MongoDB connection
 * @returns Promise that resolves when connection is closed
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed gracefully');
  } catch (error) {
    logger.error('Error closing MongoDB connection', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Checks if MongoDB connection is active
 * @returns true if connected, false otherwise
 */
export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
