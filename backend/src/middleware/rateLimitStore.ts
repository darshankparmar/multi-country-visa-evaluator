import { logger } from '../config/logger';

/**
 * Rate Limit Store
 * In-memory storage for rate limiting with sliding window algorithm
 */

export interface RateLimitInfo {
  limit: number;           // Maximum requests allowed
  remaining: number;       // Requests remaining in current window
  reset: Date;            // When the window resets
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  requests: number[];  // Timestamps of requests for sliding window
  lastAccess: number;  // Last access timestamp for LRU eviction
}

/**
 * In-memory rate limit store using sliding window algorithm
 * Automatically cleans up expired entries to prevent memory leaks
 * 
 * Memory leak prevention features:
 * - Maximum store size limit with LRU eviction
 * - Maximum requests array size per key
 * - Automatic cleanup of expired entries
 * - Memory usage monitoring and alerts
 */
export class InMemoryRateLimitStore {
  private store: Map<string, RateLimitEntry>;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  // Memory leak prevention limits
  private readonly MAX_STORE_SIZE = 10000;           // Maximum number of keys
  private readonly MAX_REQUESTS_PER_KEY = 1000;      // Maximum requests array size per key
  private readonly CLEANUP_INTERVAL_MS = 30000;      // Cleanup every 30 seconds
  private readonly MEMORY_WARNING_THRESHOLD = 0.8;   // Warn at 80% capacity

  constructor(
    private windowMs: number,
    private max: number
  ) {
    this.store = new Map();
    this.startCleanupInterval();
  }

  /**
   * Increment request count for a key using sliding window algorithm
   * Includes memory leak prevention through size limits and LRU eviction
   * @param key - Unique identifier (IP address or API key)
   * @returns Rate limit information
   */
  async increment(key: string): Promise<RateLimitInfo> {
    const now = Date.now();
    
    // Check if we need to evict entries before adding new one
    if (this.store.size >= this.MAX_STORE_SIZE && !this.store.has(key)) {
      this.evictOldestEntry();
    }

    const entry = this.store.get(key) || {
      count: 0,
      resetTime: now + this.windowMs,
      requests: [],
      lastAccess: now
    };

    // Remove requests outside the sliding window
    entry.requests = entry.requests.filter(
      timestamp => timestamp > now - this.windowMs
    );

    // Limit the size of requests array to prevent memory issues
    // Keep only the most recent requests up to MAX_REQUESTS_PER_KEY
    if (entry.requests.length >= this.MAX_REQUESTS_PER_KEY) {
      entry.requests = entry.requests.slice(-this.MAX_REQUESTS_PER_KEY + 1);
    }

    // Add current request
    entry.requests.push(now);
    entry.count = entry.requests.length;

    // Update reset time and last access
    entry.resetTime = now + this.windowMs;
    entry.lastAccess = now;

    this.store.set(key, entry);

    // Check memory usage and log warning if needed
    this.checkMemoryUsage();

    return {
      limit: this.max,
      remaining: Math.max(0, this.max - entry.count),
      reset: new Date(entry.resetTime)
    };
  }

  /**
   * Reset rate limit for a specific key
   * @param key - Unique identifier to reset
   */
  async resetKey(key: string): Promise<void> {
    this.store.delete(key);
  }

  /**
   * Clean up expired entries from the store
   * Removes entries where all requests are outside the window
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      // Remove entries where all requests are expired
      const validRequests = entry.requests.filter(
        timestamp => timestamp > now - this.windowMs
      );
      
      if (validRequests.length === 0) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Evict the oldest entry based on last access time (LRU)
   * Called when store reaches maximum size
   */
  private evictOldestEntry(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.store.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
      logger.debug('Rate limiter: Evicted oldest entry', {
        key: oldestKey,
        storeSize: this.store.size
      });
    }
  }

  /**
   * Check memory usage and log warnings if threshold exceeded
   */
  private checkMemoryUsage(): void {
    const currentSize = this.store.size;
    const usageRatio = currentSize / this.MAX_STORE_SIZE;

    if (usageRatio >= this.MEMORY_WARNING_THRESHOLD) {
      logger.warn('Rate limiter memory usage high', {
        currentSize,
        maxSize: this.MAX_STORE_SIZE,
        usagePercent: (usageRatio * 100).toFixed(1),
        totalRequests: this.getTotalRequestsCount()
      });
    }
  }

  /**
   * Get total number of requests tracked across all keys
   */
  private getTotalRequestsCount(): number {
    let total = 0;
    for (const entry of this.store.values()) {
      total += entry.requests.length;
    }
    return total;
  }

  /**
   * Start automatic cleanup interval
   * Runs more frequently (every 30 seconds) to prevent memory buildup
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL_MS);

    // Ensure cleanup interval doesn't prevent process from exiting
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }

    logger.info('Rate limiter cleanup interval started', {
      intervalMs: this.CLEANUP_INTERVAL_MS,
      maxStoreSize: this.MAX_STORE_SIZE,
      maxRequestsPerKey: this.MAX_REQUESTS_PER_KEY
    });
  }

  /**
   * Stop the cleanup interval (useful for testing and shutdown)
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('Rate limiter cleanup interval stopped');
    }
  }

  /**
   * Get current store size (for monitoring)
   */
  getStoreSize(): number {
    return this.store.size;
  }

  /**
   * Get memory usage statistics
   * Useful for monitoring and debugging
   */
  getMemoryStats(): {
    storeSize: number;
    maxStoreSize: number;
    totalRequests: number;
    usagePercent: number;
  } {
    const storeSize = this.store.size;
    const totalRequests = this.getTotalRequestsCount();
    const usagePercent = (storeSize / this.MAX_STORE_SIZE) * 100;

    return {
      storeSize,
      maxStoreSize: this.MAX_STORE_SIZE,
      totalRequests,
      usagePercent: parseFloat(usagePercent.toFixed(2))
    };
  }

  /**
   * Force immediate cleanup
   * Useful for testing or manual memory management
   */
  async forceCleanup(): Promise<void> {
    const beforeSize = this.store.size;
    await this.cleanup();
    const afterSize = this.store.size;
    const cleaned = beforeSize - afterSize;

    if (cleaned > 0) {
      logger.info('Rate limiter force cleanup completed', {
        entriesRemoved: cleaned,
        remainingEntries: afterSize
      });
    }
  }
}
