import { Query } from 'mongoose';
import { getConfig } from '../config/environment';
import { logger } from '../config/logger';
import { DB_THRESHOLDS } from '../constants';

/**
 * Wraps a Mongoose query with timeout support
 * Automatically applies configured timeout to database operations
 * 
 * @param query - Mongoose query to execute
 * @param customTimeout - Optional custom timeout in milliseconds
 * @returns Promise with query result
 * @throws Error if query times out
 */
export async function withTimeout<T>(
  query: Query<T, any>,
  customTimeout?: number
): Promise<T> {
  const config = getConfig();
  const timeout = customTimeout || config.DB_QUERY_TIMEOUT_MS;

  // Apply maxTimeMS to the query
  query.maxTimeMS(timeout);

  try {
    const startTime = Date.now();
    const result = await query.exec();
    const duration = Date.now() - startTime;

    // Log slow queries (> 50% of timeout)
    if (duration > timeout * DB_THRESHOLDS.SLOW_QUERY_RATIO) {
      logger.warn('Slow database query detected', {
        duration,
        timeout,
        collection: query.model?.collection?.name
      });
    }

    return result;
  } catch (error) {
    // Check if it's a timeout error
    if (error instanceof Error && (
      error.message.includes('operation exceeded time limit') ||
      error.message.includes('timeout')
    )) {
      logger.error('Database query timeout', {
        timeout,
        collection: query.model?.collection?.name,
        error: error.message
      });
      throw new Error(`Database operation timed out after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Wraps a database operation with timeout using Promise.race
 * Useful for operations that don't support maxTimeMS
 * 
 * @param operation - Async operation to execute
 * @param customTimeout - Optional custom timeout in milliseconds
 * @returns Promise with operation result
 * @throws Error if operation times out
 */
export async function withOperationTimeout<T>(
  operation: Promise<T>,
  customTimeout?: number
): Promise<T> {
  const config = getConfig();
  const timeout = customTimeout || config.DB_QUERY_TIMEOUT_MS;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Database operation timed out after ${timeout}ms`));
    }, timeout);
  });

  try {
    return await Promise.race([operation, timeoutPromise]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('timed out')) {
      logger.error('Database operation timeout', {
        timeout,
        error: error.message
      });
    }
    throw error;
  }
}
