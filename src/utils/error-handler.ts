/**
 * Error handling utilities for Meta Ads API
 * Provides structured error handling with retry classification
 */

import { logger } from './logger.js';

/**
 * Meta API error codes that indicate retriable errors
 */
export const RETRIABLE_ERROR_CODES = [
  4,      // API Too Many Calls
  17,     // User Request Limit Reached
  80004,  // There have been too many calls from this ad-account
  613,    // Calls to this api have exceeded the rate limit
  429,    // HTTP Too Many Requests
  500,    // Internal Server Error
  502,    // Bad Gateway
  503,    // Service Unavailable
  504,    // Gateway Timeout
];

/**
 * Meta API error types that indicate retriable errors
 */
export const RETRIABLE_ERROR_TYPES = [
  'TRANSIENT_ERROR',
  'INTERNAL_ERROR',
  'OAuthException', // Sometimes OAuth errors are temporary
];

/**
 * Common Meta API error codes and their meanings
 */
export const ERROR_CODE_MESSAGES: Record<number, string> = {
  1: 'An unknown error occurred',
  2: 'Service temporarily unavailable',
  4: 'API Too Many Calls - rate limit exceeded',
  10: 'Permission denied - check token scopes',
  17: 'User request limit reached',
  100: 'Invalid parameter',
  190: 'Access token has expired or is invalid',
  200: 'Permission error - missing required permissions',
  368: 'Temporarily blocked for policies violations',
  613: 'Rate limit exceeded',
  803: 'Some of the aliases you requested do not exist',
  80004: 'Too many calls from this ad account',
  2635: 'Campaign has been deleted',
};

/**
 * Custom error class for Meta Ads API errors
 */
export class MetaAdsError extends Error {
  public readonly code: string | number;
  public readonly type: string;
  public readonly statusCode: number;
  public readonly fbtraceId?: string;
  public readonly subcode?: number;
  public readonly userMessage?: string;

  constructor(
    message: string,
    code: string | number,
    type: string,
    statusCode: number = 500,
    fbtraceId?: string,
    subcode?: number
  ) {
    super(message);
    this.name = 'MetaAdsError';
    this.code = code;
    this.type = type;
    this.statusCode = statusCode;
    this.fbtraceId = fbtraceId;
    this.subcode = subcode;

    // Generate user-friendly message
    this.userMessage = this.getUserFriendlyMessage();

    // Maintain proper stack trace
    Error.captureStackTrace(this, MetaAdsError);
  }

  /**
   * Check if this error is retriable (transient)
   */
  isRetriable(): boolean {
    const codeAsNumber = typeof this.code === 'string' ? parseInt(this.code, 10) : this.code;

    // Check error code
    if (!isNaN(codeAsNumber) && RETRIABLE_ERROR_CODES.includes(codeAsNumber)) {
      return true;
    }

    // Check error type
    if (RETRIABLE_ERROR_TYPES.includes(this.type)) {
      return true;
    }

    // Check HTTP status code
    if ([429, 500, 502, 503, 504].includes(this.statusCode)) {
      return true;
    }

    return false;
  }

  /**
   * Generate user-friendly error message with remediation hints
   */
  private getUserFriendlyMessage(): string {
    const codeAsNumber = typeof this.code === 'string' ? parseInt(this.code, 10) : this.code;

    if (!isNaN(codeAsNumber) && ERROR_CODE_MESSAGES[codeAsNumber]) {
      const baseMessage = ERROR_CODE_MESSAGES[codeAsNumber];

      // Add remediation hints for common errors
      switch (codeAsNumber) {
        case 4:
        case 17:
        case 613:
        case 80004:
          return `${baseMessage}. The server will automatically retry after a brief delay.`;
        case 10:
        case 200:
          return `${baseMessage}. Ensure your access token has 'ads_management' and 'ads_read' permissions.`;
        case 190:
          return `${baseMessage}. Please generate a new access token and update your configuration.`;
        case 100:
          return `${baseMessage}. Check the API documentation for valid parameter values.`;
        default:
          return baseMessage;
      }
    }

    return this.message;
  }

  /**
   * Get formatted error details for logging
   */
  toLogObject(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      type: this.type,
      statusCode: this.statusCode,
      fbtraceId: this.fbtraceId,
      subcode: this.subcode,
      isRetriable: this.isRetriable(),
    };
  }
}

/**
 * Handle Meta API errors and convert to MetaAdsError
 */
export function handleMetaApiError(error: any): MetaAdsError {
  // Already a MetaAdsError
  if (error instanceof MetaAdsError) {
    return error;
  }

  // Extract error details from Meta API response
  let message = 'Unknown error occurred';
  let code: string | number = 'UNKNOWN';
  let type = 'API_ERROR';
  let statusCode = 500;
  let fbtraceId: string | undefined;
  let subcode: number | undefined;

  try {
    // Meta SDK errors typically have error_data or response.error structure
    if (error.response?.error) {
      const fbError = error.response.error;
      message = fbError.message || fbError.error_user_msg || message;
      code = fbError.code || fbError.error_code || code;
      type = fbError.type || fbError.error_type || type;
      fbtraceId = fbError.fbtrace_id;
      subcode = fbError.error_subcode;
      statusCode = error.response.status || statusCode;
    } else if (error.error_data) {
      const fbError = error.error_data;
      message = fbError.error_message || message;
      code = fbError.error_code || code;
      type = fbError.error_type || type;
      fbtraceId = fbError.fbtrace_id;
      subcode = fbError.error_subcode;
    } else if (error.message) {
      message = error.message;
      code = error.code || code;
      type = error.type || type;
      statusCode = error.statusCode || error.status || statusCode;
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      type = 'NETWORK_ERROR';
      code = error.code;
      message = `Network error: ${error.message}`;
    }
  } catch (parseError) {
    logger.error('Failed to parse Meta API error', {
      originalError: error,
      parseError: parseError instanceof Error ? parseError.message : String(parseError),
    });
  }

  const metaError = new MetaAdsError(message, code, type, statusCode, fbtraceId, subcode);

  logger.error('Meta API error handled', metaError.toLogObject());

  return metaError;
}

/**
 * Check if an error is retriable without converting to MetaAdsError
 */
export function isRetriableError(error: any): boolean {
  if (error instanceof MetaAdsError) {
    return error.isRetriable();
  }

  // Quick check for common retriable patterns
  const code = error.code || error.response?.error?.code;
  const statusCode = error.statusCode || error.status || error.response?.status;
  const type = error.type || error.response?.error?.type;

  if (code && RETRIABLE_ERROR_CODES.includes(Number(code))) {
    return true;
  }

  if (statusCode && [429, 500, 502, 503, 504].includes(Number(statusCode))) {
    return true;
  }

  if (type && RETRIABLE_ERROR_TYPES.includes(type)) {
    return true;
  }

  // Network errors
  if (['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET'].includes(error.code)) {
    return true;
  }

  return false;
}
