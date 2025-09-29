/**
 * Client-side Rate Limiting for Form Submissions
 * Prevents spam and abuse by limiting submission frequency
 */

interface RateLimitRule {
  windowMs: number;  // Time window in milliseconds
  maxAttempts: number;  // Maximum attempts per window
  blockDurationMs: number;  // Block duration after limit exceeded
}

interface RateLimitEntry {
  attempts: number;
  windowStart: number;
  blockedUntil: number;
}

export class ClientRateLimiter {
  private storage: Map<string, RateLimitEntry> = new Map();
  private readonly defaultRule: RateLimitRule = {
    windowMs: 60 * 1000,       // 1 minute window
    maxAttempts: 3,            // 3 attempts per minute
    blockDurationMs: 5 * 60 * 1000  // 5 minute block
  };

  /**
   * Check if action is rate limited
   * @param key - Unique identifier (e.g., IP, form type, user ID)
   * @param rule - Optional custom rate limiting rule
   * @returns {allowed: boolean, retryAfter?: number}
   */
  checkLimit(key: string, rule: Partial<RateLimitRule> = {}): {
    allowed: boolean;
    retryAfter?: number;
    remaining: number;
  } {
    const finalRule = { ...this.defaultRule, ...rule };
    const now = Date.now();
    const entry = this.storage.get(key);

    // Clean up expired entries
    this.cleanup();

    // Check if currently blocked
    if (entry && entry.blockedUntil > now) {
      return {
        allowed: false,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
        remaining: 0
      };
    }

    // Check if we need to reset the window
    if (!entry || (now - entry.windowStart) > finalRule.windowMs) {
      // Start new window
      this.storage.set(key, {
        attempts: 1,
        windowStart: now,
        blockedUntil: 0
      });
      return {
        allowed: true,
        remaining: finalRule.maxAttempts - 1
      };
    }

    // Increment attempts in current window
    entry.attempts++;
    
    if (entry.attempts > finalRule.maxAttempts) {
      // Block the key
      entry.blockedUntil = now + finalRule.blockDurationMs;
      this.storage.set(key, entry);
      
      return {
        allowed: false,
        retryAfter: Math.ceil(finalRule.blockDurationMs / 1000),
        remaining: 0
      };
    }

    this.storage.set(key, entry);
    return {
      allowed: true,
      remaining: finalRule.maxAttempts - entry.attempts
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.storage.delete(key);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.storage.entries()) {
      // Remove entries that are no longer blocked and past their window
      if (entry.blockedUntil < now && (now - entry.windowStart) > this.defaultRule.windowMs) {
        this.storage.delete(key);
      }
    }
  }

  /**
   * Get current status for a key
   */
  getStatus(key: string): {
    isBlocked: boolean;
    attempts: number;
    retryAfter?: number;
    windowStart: number;
  } {
    const now = Date.now();
    const entry = this.storage.get(key);

    if (!entry) {
      return {
        isBlocked: false,
        attempts: 0,
        windowStart: 0
      };
    }

    return {
      isBlocked: entry.blockedUntil > now,
      attempts: entry.attempts,
      retryAfter: entry.blockedUntil > now ? Math.ceil((entry.blockedUntil - now) / 1000) : undefined,
      windowStart: entry.windowStart
    };
  }
}

// Singleton instance for form submissions
export const formRateLimiter = new ClientRateLimiter();

/**
 * Rate limiting configuration for different form types
 */
export const RATE_LIMIT_CONFIGS = {
  contact: {
    windowMs: 60 * 1000,      // 1 minute
    maxAttempts: 2,           // 2 contact form submissions per minute
    blockDurationMs: 10 * 60 * 1000  // 10 minute block
  },
  newsletter: {
    windowMs: 5 * 60 * 1000,  // 5 minutes
    maxAttempts: 1,           // 1 newsletter signup per 5 minutes
    blockDurationMs: 30 * 60 * 1000  // 30 minute block
  },
  general: {
    windowMs: 30 * 1000,      // 30 seconds
    maxAttempts: 5,           // 5 general actions per 30 seconds
    blockDurationMs: 2 * 60 * 1000   // 2 minute block
  }
} as const;

/**
 * Generate a client identifier for rate limiting
 * Uses browser fingerprinting as fallback when IP is not available
 */
export function generateClientId(): string {
  // In a real application, you'd want to use more sophisticated fingerprinting
  // For now, use a combination of available browser data
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const platform = navigator.platform;
  const screenRes = `${screen.width}x${screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Create a simple hash of these values
  const fingerprint = btoa(
    [userAgent, language, platform, screenRes, timezone].join('|')
  ).slice(0, 16);
  
  return `client_${fingerprint}`;
}