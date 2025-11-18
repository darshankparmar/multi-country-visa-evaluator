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
}

/**
 * In-memory rate limit store using sliding window algorithm
 * Automatically cleans up expired entries to prevent memory leaks
 */
export class InMemoryRateLimitStore {
  private store: Map<string, RateLimitEntry>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private windowMs: number,
    private max: number
  ) {
    this.store = new Map();
    this.startCleanupInterval();
  }

  /**
   * Increment request count for a key using sliding window algorithm
   * @param key - Unique identifier (IP address or API key)
   * @returns Rate limit information
   */
  async increment(key: string): Promise<RateLimitInfo> {
    const now = Date.now();
    const entry = this.store.get(key) || {
      count: 0,
      resetTime: now + this.windowMs,
      requests: []
    };

    // Remove requests outside the sliding window
    entry.requests = entry.requests.filter(
      timestamp => timestamp > now - this.windowMs
    );

    // Add current request
    entry.requests.push(now);
    entry.count = entry.requests.length;

    // Update reset time to be windowMs from now
    entry.resetTime = now + this.windowMs;

    this.store.set(key, entry);

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
   * Start automatic cleanup interval (every 60 seconds)
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute

    // Ensure cleanup interval doesn't prevent process from exiting
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Stop the cleanup interval (useful for testing and shutdown)
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get current store size (for monitoring)
   */
  getStoreSize(): number {
    return this.store.size;
  }
}
