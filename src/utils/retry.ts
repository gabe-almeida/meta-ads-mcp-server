/**
 * Exponential backoff retry logic
 * Implements retry with exponential delays and jitter
 */

import { logger } from './logger.js';
import { isRetriableError } from './error-handler.js';

export interface BackoffOptions {
  baseDelay?: number;      // Base delay in milliseconds (default: 1000)
  maxDelay?: number;       // Maximum delay in milliseconds (default: 32000)
  maxRetries?: number;     // Maximum number of retry attempts (default: 5)
  jitterFactor?: number;   // Jitter factor 0-1 (default: 0.1 = 10%)
}

export class ExponentialBackoff {
  private readonly baseDelay: number;
  private readonly maxDelay: number;
  private readonly maxRetries: number;
  private readonly jitterFactor: number;

  constructor(options: BackoffOptions = {}) {
    this.baseDelay = options.baseDelay ?? 1000;
    this.maxDelay = options.maxDelay ?? 32000;
    this.maxRetries = options.maxRetries ?? 5;
    this.jitterFactor = options.jitterFactor ?? 0.1;

    logger.debug('Exponential backoff configured', {
      baseDelay: this.baseDelay,
      maxDelay: this.maxDelay,
      maxRetries: this.maxRetries,
      jitterFactor: this.jitterFactor,
    });
  }

  /**
   * Execute an operation with exponential backoff retry
   * @param operation The async operation to execute
   * @param context Optional context for logging
   * @returns Result of the operation
   */
  async execute<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    let lastError: Error | undefined;
    const startTime = Date.now();

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const result = await operation();

        // Log success if we had to retry
        if (attempt > 0) {
          logger.info('Operation succeeded after retry', {
            attempt: attempt + 1,
            totalAttempts: this.maxRetries,
            elapsedTime: Date.now() - startTime,
            ...context,
          });
        }

        return result;
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry if error is not retriable
        if (!isRetriableError(error)) {
          logger.warn('Non-retriable error encountered', {
            attempt: attempt + 1,
            error: lastError.message,
            errorCode: error.code,
            ...context,
          });
          throw lastError;
        }

        // Don't retry if this was the last attempt
        if (attempt === this.maxRetries - 1) {
          logger.error('Max retries exceeded', {
            totalAttempts: this.maxRetries,
            elapsedTime: Date.now() - startTime,
            lastError: lastError.message,
            ...context,
          });
          throw lastError;
        }

        // Calculate delay with exponential backoff and jitter
        const exponentialDelay = Math.min(
          this.baseDelay * Math.pow(2, attempt),
          this.maxDelay
        );
        const jitter = exponentialDelay * this.jitterFactor * Math.random();
        const delay = Math.floor(exponentialDelay + jitter);

        logger.warn('Retriable error encountered, retrying', {
          attempt: attempt + 1,
          maxAttempts: this.maxRetries,
          delayMs: delay,
          error: lastError.message,
          errorCode: error.code,
          ...context,
        });

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate delay for a specific attempt (for testing/preview)
   */
  calculateDelay(attempt: number): number {
    const exponentialDelay = Math.min(
      this.baseDelay * Math.pow(2, attempt),
      this.maxDelay
    );
    const jitter = exponentialDelay * this.jitterFactor * Math.random();
    return Math.floor(exponentialDelay + jitter);
  }

  /**
   * Get configuration
   */
  getConfig(): Required<BackoffOptions> {
    return {
      baseDelay: this.baseDelay,
      maxDelay: this.maxDelay,
      maxRetries: this.maxRetries,
      jitterFactor: this.jitterFactor,
    };
  }
}

/**
 * Create a default exponential backoff instance
 */
export function createDefaultBackoff(): ExponentialBackoff {
  return new ExponentialBackoff({
    baseDelay: 1000,    // 1 second
    maxDelay: 32000,    // 32 seconds
    maxRetries: 5,      // 5 attempts total
    jitterFactor: 0.1,  // 10% jitter
  });
}
