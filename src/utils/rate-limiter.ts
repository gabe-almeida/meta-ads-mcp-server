/**
 * Rate Limiter
 * Monitors and manages Meta API rate limits using X-Business-Use-Case-Usage header
 */

import { logger } from './logger.js';

/**
 * Rate limit information from Meta API response headers
 */
export interface RateLimitInfo {
  call_count: number;
  total_cputime: number;
  total_time: number;
  type: string;
  estimated_time_to_regain_access: number;
}

/**
 * Business use case rate limits (per ad account)
 */
export interface BusinessUseCaseUsage {
  [adAccountId: string]: RateLimitInfo[];
}

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  throttleThreshold?: number; // Percentage at which to start throttling (default: 80)
  checkInterval?: number; // Interval to check rate limits in ms (default: 60000)
  pauseDuration?: number; // Duration to pause when throttled in ms (default: 60000)
}

/**
 * Rate limiter class for Meta Ads API
 * Monitors X-Business-Use-Case-Usage header and throttles requests when approaching limits
 */
export class RateLimiter {
  private throttleThreshold: number;
  private checkInterval: number;
  private pauseDuration: number;
  private usage: Map<string, RateLimitInfo> = new Map();
  private isPaused = false;
  private pauseUntil: number = 0;

  constructor(config: RateLimiterConfig = {}) {
    this.throttleThreshold = config.throttleThreshold ?? 80;
    this.checkInterval = config.checkInterval ?? 60000;
    this.pauseDuration = config.pauseDuration ?? 60000;

    logger.info('Rate limiter initialized', {
      throttleThreshold: this.throttleThreshold,
      checkInterval: this.checkInterval,
      pauseDuration: this.pauseDuration,
    });
  }

  /**
   * Parse X-Business-Use-Case-Usage header
   * Format: {"ad_account_id": [{"call_count": 10, "total_cputime": 5, "total_time": 10, "type": "ads_management", "estimated_time_to_regain_access": 0}]}
   */
  parseUsageHeader(headerValue: string): BusinessUseCaseUsage | null {
    try {
      const usage = JSON.parse(headerValue);
      return usage;
    } catch (error) {
      logger.error('Failed to parse X-Business-Use-Case-Usage header', {
        headerValue,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Update rate limit information from response headers
   */
  updateFromHeaders(headers: Record<string, any>): void {
    const usageHeader = headers['x-business-use-case-usage'];
    if (!usageHeader) {
      return;
    }

    const usage = this.parseUsageHeader(usageHeader);
    if (!usage) {
      return;
    }

    // Update usage for each ad account in the response
    Object.entries(usage).forEach(([accountId, limitInfoArray]) => {
      // Store the most restrictive limit info
      const mostRestrictive = this.getMostRestrictive(limitInfoArray);
      if (mostRestrictive) {
        this.usage.set(accountId, mostRestrictive);
        this.checkThrottling(accountId, mostRestrictive);
      }
    });

    logger.debug('Rate limit usage updated', {
      accountIds: Object.keys(usage),
      currentUsage: Array.from(this.usage.entries()).map(([id, info]) => ({
        accountId: id,
        callCount: info.call_count,
        cpuTime: info.total_cputime,
        timeToRegainAccess: info.estimated_time_to_regain_access,
      })),
    });
  }

  /**
   * Get the most restrictive rate limit from an array of limits
   * Based on call_count percentage and estimated_time_to_regain_access
   */
  private getMostRestrictive(limitInfoArray: RateLimitInfo[]): RateLimitInfo | null {
    if (!limitInfoArray || limitInfoArray.length === 0) {
      return null;
    }

    // Sort by call_count (descending) and estimated_time_to_regain_access (descending)
    const sorted = [...limitInfoArray].sort((a, b) => {
      if (a.estimated_time_to_regain_access !== b.estimated_time_to_regain_access) {
        return b.estimated_time_to_regain_access - a.estimated_time_to_regain_access;
      }
      return b.call_count - a.call_count;
    });

    return sorted[0];
  }

  /**
   * Check if we should throttle based on current usage
   * Meta's rate limits are typically 200 calls per hour per ad account
   */
  private checkThrottling(accountId: string, limitInfo: RateLimitInfo): void {
    // If estimated_time_to_regain_access > 0, we're rate limited
    if (limitInfo.estimated_time_to_regain_access > 0) {
      const pauseUntil = Date.now() + limitInfo.estimated_time_to_regain_access * 60 * 1000;
      this.setPaused(pauseUntil, accountId, 'rate_limited');
      return;
    }

    // Meta doesn't provide max limits in headers, but typical limits are:
    // - 200 calls per hour
    // - Throttling typically starts around 75-80% usage
    const estimatedMaxCalls = 200;
    const usagePercentage = (limitInfo.call_count / estimatedMaxCalls) * 100;

    if (usagePercentage >= this.throttleThreshold) {
      // Throttle for configured duration
      const pauseUntil = Date.now() + this.pauseDuration;
      this.setPaused(pauseUntil, accountId, 'throttle_threshold');
    }
  }

  /**
   * Set paused state
   */
  private setPaused(pauseUntil: number, accountId: string, reason: string): void {
    this.isPaused = true;
    this.pauseUntil = pauseUntil;

    const pauseDurationMs = pauseUntil - Date.now();
    const pauseDurationSec = Math.ceil(pauseDurationMs / 1000);

    logger.warn('Rate limiter paused', {
      accountId,
      reason,
      pauseDurationSec,
      resumeAt: new Date(pauseUntil).toISOString(),
    });
  }

  /**
   * Check if requests should be paused
   */
  async checkPause(): Promise<void> {
    if (!this.isPaused) {
      return;
    }

    const now = Date.now();
    if (now < this.pauseUntil) {
      const waitMs = this.pauseUntil - now;
      logger.debug('Waiting for rate limit pause to end', {
        waitMs,
        resumeAt: new Date(this.pauseUntil).toISOString(),
      });
      await this.sleep(waitMs);
    }

    this.isPaused = false;
    this.pauseUntil = 0;
    logger.info('Rate limiter resumed');
  }

  /**
   * Get current usage for an ad account
   */
  getUsage(adAccountId: string): RateLimitInfo | null {
    return this.usage.get(adAccountId) || null;
  }

  /**
   * Get all current usage
   */
  getAllUsage(): Map<string, RateLimitInfo> {
    return new Map(this.usage);
  }

  /**
   * Check if currently paused
   */
  isPausedNow(): boolean {
    if (this.isPaused && Date.now() < this.pauseUntil) {
      return true;
    }
    if (this.isPaused && Date.now() >= this.pauseUntil) {
      this.isPaused = false;
      this.pauseUntil = 0;
    }
    return false;
  }

  /**
   * Get time until resume (in milliseconds)
   */
  getTimeUntilResume(): number {
    if (!this.isPaused) {
      return 0;
    }
    return Math.max(0, this.pauseUntil - Date.now());
  }

  /**
   * Clear usage data for an ad account
   */
  clearUsage(adAccountId: string): void {
    this.usage.delete(adAccountId);
    logger.debug('Cleared rate limit usage', { adAccountId });
  }

  /**
   * Clear all usage data
   */
  clearAllUsage(): void {
    this.usage.clear();
    this.isPaused = false;
    this.pauseUntil = 0;
    logger.debug('Cleared all rate limit usage');
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get configuration
   */
  getConfig(): Required<RateLimiterConfig> {
    return {
      throttleThreshold: this.throttleThreshold,
      checkInterval: this.checkInterval,
      pauseDuration: this.pauseDuration,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: RateLimiterConfig): void {
    if (config.throttleThreshold !== undefined) {
      this.throttleThreshold = config.throttleThreshold;
    }
    if (config.checkInterval !== undefined) {
      this.checkInterval = config.checkInterval;
    }
    if (config.pauseDuration !== undefined) {
      this.pauseDuration = config.pauseDuration;
    }

    logger.info('Rate limiter configuration updated', {
      throttleThreshold: this.throttleThreshold,
      checkInterval: this.checkInterval,
      pauseDuration: this.pauseDuration,
    });
  }
}

/**
 * Create a default rate limiter instance
 */
export function createDefaultRateLimiter(): RateLimiter {
  return new RateLimiter({
    throttleThreshold: 80, // Start throttling at 80% usage
    checkInterval: 60000, // Check every minute
    pauseDuration: 60000, // Pause for 1 minute when throttled
  });
}
