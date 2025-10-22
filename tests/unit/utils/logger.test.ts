/**
 * Logger Utility Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { logger } from '../../../src/utils/logger.js';

describe('Logger', () => {
  it('should have info method', () => {
    assert.strictEqual(typeof logger.info, 'function');
  });

  it('should have error method', () => {
    assert.strictEqual(typeof logger.error, 'function');
  });

  it('should have debug method', () => {
    assert.strictEqual(typeof logger.debug, 'function');
  });

  it('should have warn method', () => {
    assert.strictEqual(typeof logger.warn, 'function');
  });

  it('should log without throwing errors', () => {
    assert.doesNotThrow(() => {
      logger.info('Test info message', { test: true });
      logger.error('Test error message', { error: 'test' });
      logger.debug('Test debug message');
      logger.warn('Test warn message');
    });
  });
});
