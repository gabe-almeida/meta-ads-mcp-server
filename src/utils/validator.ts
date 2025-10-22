/**
 * Validation utilities for Meta Ads API parameters
 * Provides validation for common parameter types
 */

import { logger } from './logger.js';

/**
 * Validate Meta Ad Account ID
 * Can be in format: act_123456789 or 123456789
 */
export function validateAccountId(accountId: string): { valid: boolean; normalized?: string; error?: string } {
  if (!accountId || typeof accountId !== 'string') {
    return { valid: false, error: 'Account ID must be a non-empty string' };
  }

  const trimmed = accountId.trim();

  // Check for valid format: act_\d+ or just \d+
  const withPrefix = /^act_\d{1,20}$/;
  const withoutPrefix = /^\d{1,20}$/;

  if (withPrefix.test(trimmed)) {
    return { valid: true, normalized: trimmed };
  }

  if (withoutPrefix.test(trimmed)) {
    return { valid: true, normalized: `act_${trimmed}` };
  }

  return {
    valid: false,
    error: 'Account ID must be numeric or in format "act_123456789"',
  };
}

/**
 * Validate budget amount
 * Budget must be in cents (minimum 100 = $1.00)
 */
export function validateBudget(budget: number): { valid: boolean; error?: string } {
  if (typeof budget !== 'number' || isNaN(budget)) {
    return { valid: false, error: 'Budget must be a valid number' };
  }

  if (budget < 0) {
    return { valid: false, error: 'Budget cannot be negative' };
  }

  if (!Number.isInteger(budget)) {
    return { valid: false, error: 'Budget must be an integer (in cents)' };
  }

  // Minimum budget varies by currency, but generally $1.00 (100 cents) is safe
  if (budget > 0 && budget < 100) {
    return {
      valid: false,
      error: 'Budget must be at least 100 cents ($1.00) or 0 for unlimited',
    };
  }

  // Maximum budget sanity check (100 million dollars in cents)
  if (budget > 10000000000) {
    return {
      valid: false,
      error: 'Budget exceeds maximum allowed value',
    };
  }

  return { valid: true };
}

/**
 * Validate date string
 * Accepts ISO 8601 format: YYYY-MM-DD or full timestamp
 */
export function validateDate(dateString: string): { valid: boolean; normalized?: string; error?: string } {
  if (!dateString || typeof dateString !== 'string') {
    return { valid: false, error: 'Date must be a non-empty string' };
  }

  const trimmed = dateString.trim();

  // Try to parse as date
  const date = new Date(trimmed);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD or full timestamp)' };
  }

  // Check if date is in the future (within reason - 10 years)
  const tenYearsFromNow = new Date();
  tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);
  if (date > tenYearsFromNow) {
    return { valid: false, error: 'Date is too far in the future (max 10 years)' };
  }

  // Check if date is too far in the past (before Facebook was founded - 2004)
  const facebookFounded = new Date('2004-02-04');
  if (date < facebookFounded) {
    return { valid: false, error: 'Date is before Facebook was founded (2004-02-04)' };
  }

  // Normalize to YYYY-MM-DD format
  const normalized = date.toISOString().split('T')[0];
  return { valid: true, normalized };
}

/**
 * Validate URL
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL must be a non-empty string' };
  }

  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);

    // Must be http or https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }

    // Must have a hostname
    if (!parsed.hostname) {
      return { valid: false, error: 'URL must have a valid hostname' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate email address
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email must be a non-empty string' };
  }

  const trimmed = email.trim();

  // Basic email regex - not perfect but good enough
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

/**
 * Validate phone number
 * Should be in E.164 format: +[country code][number]
 */
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number must be a non-empty string' };
  }

  const trimmed = phone.trim();

  // E.164 format: + followed by 1-15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/;

  if (!e164Regex.test(trimmed)) {
    return {
      valid: false,
      error: 'Phone number must be in E.164 format (e.g., +1234567890)',
    };
  }

  return { valid: true };
}

/**
 * Validate status value
 */
export function validateStatus(status: string, allowedStatuses: string[]): { valid: boolean; error?: string } {
  if (!status || typeof status !== 'string') {
    return { valid: false, error: 'Status must be a non-empty string' };
  }

  const upperStatus = status.toUpperCase();

  if (!allowedStatuses.includes(upperStatus)) {
    return {
      valid: false,
      error: `Status must be one of: ${allowedStatuses.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate positive integer
 */
export function validatePositiveInteger(value: number, fieldName: string = 'Value'): { valid: boolean; error?: string } {
  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }

  if (!Number.isInteger(value)) {
    return { valid: false, error: `${fieldName} must be an integer` };
  }

  if (value <= 0) {
    return { valid: false, error: `${fieldName} must be positive` };
  }

  return { valid: true };
}

/**
 * Validate array of strings
 */
export function validateStringArray(
  arr: any,
  fieldName: string = 'Array',
  minLength: number = 1,
  maxLength?: number
): { valid: boolean; error?: string } {
  if (!Array.isArray(arr)) {
    return { valid: false, error: `${fieldName} must be an array` };
  }

  if (arr.length < minLength) {
    return { valid: false, error: `${fieldName} must contain at least ${minLength} item(s)` };
  }

  if (maxLength && arr.length > maxLength) {
    return { valid: false, error: `${fieldName} must contain at most ${maxLength} item(s)` };
  }

  for (let i = 0; i < arr.length; i++) {
    if (typeof arr[i] !== 'string' || arr[i].trim() === '') {
      return {
        valid: false,
        error: `${fieldName}[${i}] must be a non-empty string`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate object ID (generic ID validation)
 */
export function validateObjectId(id: string, objectType: string = 'Object'): { valid: boolean; error?: string } {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: `${objectType} ID must be a non-empty string` };
  }

  const trimmed = id.trim();

  // Meta object IDs are typically numeric strings
  if (!/^\d{1,30}$/.test(trimmed)) {
    return {
      valid: false,
      error: `${objectType} ID must be a numeric string`,
    };
  }

  return { valid: true };
}

/**
 * Batch validation helper
 * Returns all validation errors or null if all valid
 */
export function batchValidate(
  validations: Array<{ name: string; result: { valid: boolean; error?: string } }>
): string[] | null {
  const errors: string[] = [];

  for (const validation of validations) {
    if (!validation.result.valid) {
      errors.push(`${validation.name}: ${validation.result.error}`);
      logger.warn('Validation failed', {
        field: validation.name,
        error: validation.result.error,
      });
    }
  }

  return errors.length > 0 ? errors : null;
}
