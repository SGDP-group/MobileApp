/**
 * Rate Limiter Utility
 * Prevents API abuse by limiting request frequency with exponential backoff
 */

interface RateLimitConfig {
  maxRequests: number;
  timeWindowMs: number;
  enableExponentialBackoff: boolean;
}

interface RequestRecord {
  timestamp: number;
  count: number;
  backoffUntil?: number;
}

class RateLimiter {
  private requestRecords: Map<string, RequestRecord> = new Map();
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      maxRequests: config.maxRequests || 10,
      timeWindowMs: config.timeWindowMs || 60000, // 1 minute default
      enableExponentialBackoff: config.enableExponentialBackoff ?? true,
    };
  }

  /**
   * Check if a request is allowed for the given key (e.g., API endpoint)
   * @param key Unique identifier for the rate limit (e.g., 'google-calendar-api')
   * @returns true if request is allowed, false if rate limited
   */
  async checkLimit(
    key: string,
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    const now = Date.now();
    const record = this.requestRecords.get(key);

    // Check if currently in backoff period
    if (record?.backoffUntil && now < record.backoffUntil) {
      const retryAfter = Math.ceil((record.backoffUntil - now) / 1000);
      return { allowed: false, retryAfter };
    }

    // Initialize or reset record if time window expired
    if (!record || now - record.timestamp > this.config.timeWindowMs) {
      this.requestRecords.set(key, {
        timestamp: now,
        count: 1,
        backoffUntil: undefined,
      });
      return { allowed: true };
    }

    // Check if limit exceeded
    if (record.count >= this.config.maxRequests) {
      if (this.config.enableExponentialBackoff) {
        // Calculate exponential backoff: 2^attempts * base delay
        const backoffMs = Math.min(
          Math.pow(2, record.count - this.config.maxRequests) * 1000,
          300000, // Max 5 minutes
        );
        record.backoffUntil = now + backoffMs;
        const retryAfter = Math.ceil(backoffMs / 1000);
        return { allowed: false, retryAfter };
      }

      const retryAfter = Math.ceil(
        (this.config.timeWindowMs - (now - record.timestamp)) / 1000,
      );
      return { allowed: false, retryAfter };
    }

    // Increment count and allow request
    record.count++;
    return { allowed: true };
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.requestRecords.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.requestRecords.clear();
  }

  /**
   * Get current status for a key
   */
  getStatus(key: string): { count: number; remaining: number } | null {
    const record = this.requestRecords.get(key);
    if (!record) {
      return { count: 0, remaining: this.config.maxRequests };
    }

    const now = Date.now();
    if (now - record.timestamp > this.config.timeWindowMs) {
      return { count: 0, remaining: this.config.maxRequests };
    }

    return {
      count: record.count,
      remaining: Math.max(0, this.config.maxRequests - record.count),
    };
  }
}

// Export singleton instance with sensible defaults
export const apiRateLimiter = new RateLimiter({
  maxRequests: 30, // 30 requests
  timeWindowMs: 60000, // per minute
  enableExponentialBackoff: true,
});

// Export class for custom instances
export { RateLimiter };

