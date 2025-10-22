/**
 * Auth Config Tests
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { loadAuthConfig } from '../../../src/config/auth.config.js';

describe('Auth Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should load valid config', () => {
    process.env.META_ACCESS_TOKEN = 'test_token_123';
    process.env.META_API_VERSION = 'v19.0';

    const config = loadAuthConfig();
    assert.ok(config, 'Config should not be null');
    assert.strictEqual(config.META_ACCESS_TOKEN, 'test_token_123');
    assert.strictEqual(config.META_API_VERSION, 'v19.0');
  });

  it('should use default API version if not provided', () => {
    process.env.META_ACCESS_TOKEN = 'test_token_123';
    delete process.env.META_API_VERSION;

    const config = loadAuthConfig();
    assert.ok(config, 'Config should not be null');
    assert.strictEqual(config.META_ACCESS_TOKEN, 'test_token_123');
    assert.ok(config.META_API_VERSION); // Should have a default
  });

  it('should return null if META_ACCESS_TOKEN is missing', () => {
    delete process.env.META_ACCESS_TOKEN;

    const config = loadAuthConfig();
    assert.strictEqual(config, null, 'Should return null when token is missing');
  });

  it('should handle META_APP_ID environment variable', () => {
    process.env.META_ACCESS_TOKEN = 'test_token_123';
    process.env.META_APP_ID = 'test_app_id';

    const config = loadAuthConfig();
    assert.ok(config, 'Config should not be null');
    assert.strictEqual(config.META_APP_ID, 'test_app_id');
  });

  it('should handle AUTH_MODE environment variable', () => {
    process.env.META_ACCESS_TOKEN = 'test_token_123';
    process.env.AUTH_MODE = 'oauth';

    const config = loadAuthConfig();
    assert.ok(config, 'Config should not be null');
    assert.strictEqual(config.AUTH_MODE, 'oauth');
  });
});
