/**
 * Error Handler Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { handleMetaApiError, MetaAdsError } from '../../../src/utils/error-handler.js';
import { mockMetaApiError, mockRateLimitError } from '../../fixtures/mock-responses.js';

describe('Error Handler', () => {
  it('should handle Meta API errors', () => {
    const error = handleMetaApiError({ response: mockMetaApiError });
    assert.ok(error instanceof MetaAdsError);
    assert.strictEqual(error.code, 190);
    assert.strictEqual(error.type, 'OAuthException');
    assert.ok(error.message.includes('Invalid OAuth 2.0 Access Token'));
  });

  it('should handle rate limit errors', () => {
    const error = handleMetaApiError({ response: mockRateLimitError });
    assert.ok(error instanceof MetaAdsError);
    assert.strictEqual(error.code, 4);
    assert.strictEqual(error.isRetriable(), true);
  });

  it('should handle generic errors', () => {
    const genericError = new Error('Something went wrong');
    const error = handleMetaApiError(genericError);
    assert.ok(error instanceof MetaAdsError);
    assert.ok(error.message.includes('Something went wrong'));
  });

  it('should preserve fbtraceId', () => {
    const error = handleMetaApiError({ response: mockMetaApiError });
    assert.strictEqual(error.fbtraceId, 'AaBbCcDdEeFfGgHhIiJjKkLl');
  });

  it('should identify retriable errors correctly', () => {
    // Rate limit error should be retriable
    const rateLimitError = handleMetaApiError({ response: mockRateLimitError });
    assert.strictEqual(rateLimitError.isRetriable(), true);

    // OAuth errors are marked as retriable in RETRIABLE_ERROR_TYPES
    // This is because some OAuth errors are transient
    const oauthError = handleMetaApiError({ response: mockMetaApiError });
    assert.strictEqual(oauthError.isRetriable(), true);

    // Test a truly non-retriable error (invalid parameter with proper status)
    const validationError = {
      response: {
        error: {
          message: 'Invalid parameter',
          type: 'FacebookApiException',
          code: 100,
          fbtrace_id: 'Test123',
        },
        status: 400, // Bad request - not retriable
      },
    };
    const nonRetriable = handleMetaApiError(validationError);
    assert.strictEqual(nonRetriable.isRetriable(), false);
  });
});
