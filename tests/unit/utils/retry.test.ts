/**
 * Retry Logic Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ExponentialBackoff } from '../../../src/utils/retry.js';
import { isRetriableError } from '../../../src/utils/error-handler.js';

describe('Retry Logic', () => {
  describe('isRetriableError', () => {
    it('should identify retriable error codes', () => {
      const retriableCodes = [17, 4, 80004, 613, 429, 500, 502, 503, 504];
      retriableCodes.forEach((code) => {
        const error = { code };
        assert.strictEqual(
          isRetriableError(error),
          true,
          `Code ${code} should be retriable`
        );
      });
    });

    it('should identify non-retriable error codes', () => {
      const nonRetriableCodes = [100, 190, 200, 400, 401, 403, 404];
      nonRetriableCodes.forEach((code) => {
        const error = { code };
        assert.strictEqual(
          isRetriableError(error),
          false,
          `Code ${code} should not be retriable`
        );
      });
    });
  });

  describe('ExponentialBackoff', () => {
    it('should create backoff instance with default config', () => {
      const backoff = new ExponentialBackoff();
      assert.ok(backoff);
    });

    it('should create backoff instance with custom config', () => {
      const backoff = new ExponentialBackoff({
        baseDelay: 500,
        maxDelay: 10000,
        maxRetries: 5,
      });
      assert.ok(backoff);
    });

    it('should execute function successfully', async () => {
      const backoff = new ExponentialBackoff();
      const result = await backoff.execute(async () => {
        return 'success';
      });
      assert.strictEqual(result, 'success');
    });

    it('should execute function without errors', async () => {
      const backoff = new ExponentialBackoff({
        baseDelay: 10,
        maxDelay: 100,
        maxRetries: 3,
      });

      const result = await backoff.execute(async () => {
        return 'success';
      });

      assert.strictEqual(result, 'success');
    });

    it('should get backoff config', () => {
      const backoff = new ExponentialBackoff({
        baseDelay: 500,
        maxDelay: 5000,
        maxRetries: 3,
      });

      const config = backoff.getConfig();
      assert.strictEqual(config.baseDelay, 500);
      assert.strictEqual(config.maxDelay, 5000);
      assert.strictEqual(config.maxRetries, 3);
    });

    it('should calculate delay', () => {
      const backoff = new ExponentialBackoff({
        baseDelay: 1000,
        maxDelay: 32000,
      });

      const delay1 = backoff.calculateDelay(0);
      const delay2 = backoff.calculateDelay(1);

      // First attempt should be around 1000ms
      assert.ok(delay1 >= 900 && delay1 <= 1200);
      // Second attempt should be around 2000ms
      assert.ok(delay2 >= 1800 && delay2 <= 2400);
    });
  });
});
