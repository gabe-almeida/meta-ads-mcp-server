/**
 * Data hashing utilities for Meta Ads API
 * Provides SHA-256 hashing for PII (Personally Identifiable Information)
 * Required for Custom Audiences and offline conversions
 */

import * as crypto from 'crypto';
import { logger } from './logger.js';

/**
 * Hash a string using SHA-256
 * Returns lowercase hex digest as required by Meta
 */
export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex').toLowerCase();
}

/**
 * Normalize and hash an email address
 * 1. Trim whitespace
 * 2. Convert to lowercase
 * 3. Hash with SHA-256
 */
export function hashEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    throw new Error('Email must be a non-empty string');
  }

  // Normalize: trim and lowercase
  const normalized = email.trim().toLowerCase();

  if (!normalized) {
    throw new Error('Email cannot be empty after normalization');
  }

  // Hash
  const hashed = sha256(normalized);

  logger.debug('Email hashed', {
    originalLength: email.length,
    hashedLength: hashed.length,
  });

  return hashed;
}

/**
 * Normalize and hash a phone number
 * 1. Remove all non-numeric characters except leading +
 * 2. Ensure E.164 format (+[country code][number])
 * 3. Hash with SHA-256
 */
export function hashPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    throw new Error('Phone number must be a non-empty string');
  }

  // Normalize: remove all non-numeric except leading +
  let normalized = phone.trim();

  // If starts with +, keep it and remove all other non-digits
  if (normalized.startsWith('+')) {
    normalized = '+' + normalized.slice(1).replace(/\D/g, '');
  } else {
    // Remove all non-digits
    normalized = normalized.replace(/\D/g, '');
    // Add + prefix if not present
    if (!normalized.startsWith('+')) {
      // Assume US (+1) if no country code - this is a simplification
      // In production, you should validate the country code
      normalized = '+' + normalized;
    }
  }

  if (!normalized || normalized === '+') {
    throw new Error('Phone number cannot be empty after normalization');
  }

  // Validate E.164 format: + followed by 1-15 digits
  if (!/^\+[1-9]\d{1,14}$/.test(normalized)) {
    throw new Error(`Phone number must be in E.164 format after normalization. Got: ${normalized}`);
  }

  // Hash
  const hashed = sha256(normalized);

  logger.debug('Phone hashed', {
    originalLength: phone.length,
    normalizedLength: normalized.length,
    hashedLength: hashed.length,
  });

  return hashed;
}

/**
 * Normalize and hash a first name
 * 1. Trim whitespace
 * 2. Convert to lowercase
 * 3. Remove all non-alphabetic characters
 * 4. Hash with SHA-256
 */
export function hashFirstName(firstName: string): string {
  if (!firstName || typeof firstName !== 'string') {
    throw new Error('First name must be a non-empty string');
  }

  // Normalize: trim, lowercase, remove non-alphabetic
  const normalized = firstName.trim().toLowerCase().replace(/[^a-z]/g, '');

  if (!normalized) {
    throw new Error('First name cannot be empty after normalization');
  }

  // Hash
  const hashed = sha256(normalized);

  logger.debug('First name hashed', {
    originalLength: firstName.length,
    hashedLength: hashed.length,
  });

  return hashed;
}

/**
 * Normalize and hash a last name
 * Same rules as first name
 */
export function hashLastName(lastName: string): string {
  if (!lastName || typeof lastName !== 'string') {
    throw new Error('Last name must be a non-empty string');
  }

  // Normalize: trim, lowercase, remove non-alphabetic
  const normalized = lastName.trim().toLowerCase().replace(/[^a-z]/g, '');

  if (!normalized) {
    throw new Error('Last name cannot be empty after normalization');
  }

  // Hash
  const hashed = sha256(normalized);

  logger.debug('Last name hashed', {
    originalLength: lastName.length,
    hashedLength: hashed.length,
  });

  return hashed;
}

/**
 * Normalize and hash a city name
 * 1. Trim whitespace
 * 2. Convert to lowercase
 * 3. Remove all non-alphabetic characters except spaces
 * 4. Remove extra spaces
 * 5. Hash with SHA-256
 */
export function hashCity(city: string): string {
  if (!city || typeof city !== 'string') {
    throw new Error('City must be a non-empty string');
  }

  // Normalize: trim, lowercase, keep only letters and spaces
  const normalized = city
    .trim()
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();

  if (!normalized) {
    throw new Error('City cannot be empty after normalization');
  }

  // Hash
  const hashed = sha256(normalized);

  logger.debug('City hashed', {
    originalLength: city.length,
    hashedLength: hashed.length,
  });

  return hashed;
}

/**
 * Normalize and hash a state/province code
 * 1. Trim whitespace
 * 2. Convert to lowercase
 * 3. Keep only alphabetic characters
 * 4. Hash with SHA-256
 */
export function hashState(state: string): string {
  if (!state || typeof state !== 'string') {
    throw new Error('State must be a non-empty string');
  }

  // Normalize: trim, lowercase, remove non-alphabetic
  const normalized = state.trim().toLowerCase().replace(/[^a-z]/g, '');

  if (!normalized) {
    throw new Error('State cannot be empty after normalization');
  }

  // Hash
  const hashed = sha256(normalized);

  logger.debug('State hashed', {
    originalLength: state.length,
    hashedLength: hashed.length,
  });

  return hashed;
}

/**
 * Normalize and hash a ZIP/postal code
 * 1. Trim whitespace
 * 2. Convert to lowercase
 * 3. Remove all spaces and dashes
 * 4. Hash with SHA-256
 */
export function hashZip(zip: string): string {
  if (!zip || typeof zip !== 'string') {
    throw new Error('ZIP code must be a non-empty string');
  }

  // Normalize: trim, lowercase, remove spaces and dashes
  const normalized = zip.trim().toLowerCase().replace(/[\s-]/g, '');

  if (!normalized) {
    throw new Error('ZIP code cannot be empty after normalization');
  }

  // Hash
  const hashed = sha256(normalized);

  logger.debug('ZIP hashed', {
    originalLength: zip.length,
    hashedLength: hashed.length,
  });

  return hashed;
}

/**
 * Normalize and hash a country code
 * 1. Trim whitespace
 * 2. Convert to lowercase
 * 3. Must be 2-letter ISO country code
 * 4. Hash with SHA-256
 */
export function hashCountry(country: string): string {
  if (!country || typeof country !== 'string') {
    throw new Error('Country must be a non-empty string');
  }

  // Normalize: trim, lowercase
  const normalized = country.trim().toLowerCase();

  // Validate 2-letter country code
  if (!/^[a-z]{2}$/.test(normalized)) {
    throw new Error('Country must be a 2-letter ISO country code (e.g., "us", "gb")');
  }

  // Hash
  const hashed = sha256(normalized);

  logger.debug('Country hashed', {
    originalLength: country.length,
    hashedLength: hashed.length,
  });

  return hashed;
}

/**
 * Hash a generic string (for external IDs, etc.)
 * 1. Trim whitespace
 * 2. Hash with SHA-256
 * Note: Does not convert to lowercase - preserves case
 */
export function hashExternalId(externalId: string): string {
  if (!externalId || typeof externalId !== 'string') {
    throw new Error('External ID must be a non-empty string');
  }

  const trimmed = externalId.trim();

  if (!trimmed) {
    throw new Error('External ID cannot be empty after trimming');
  }

  // Hash
  const hashed = sha256(trimmed);

  logger.debug('External ID hashed', {
    originalLength: externalId.length,
    hashedLength: hashed.length,
  });

  return hashed;
}

/**
 * Hash a user data object for Custom Audiences
 * Automatically detects and hashes PII fields
 */
export interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  externalId?: string;
  // Additional fields can be added
  [key: string]: string | undefined;
}

export interface HashedUserData {
  em?: string;      // email
  ph?: string;      // phone
  fn?: string;      // first name
  ln?: string;      // last name
  ct?: string;      // city
  st?: string;      // state
  zip?: string;     // zip
  country?: string; // country
  extern_id?: string; // external ID
}

/**
 * Hash all PII fields in a user data object
 * Returns object with Meta's expected field names
 */
export function hashUserData(userData: UserData): HashedUserData {
  const hashed: HashedUserData = {};

  try {
    if (userData.email) {
      hashed.em = hashEmail(userData.email);
    }
    if (userData.phone) {
      hashed.ph = hashPhone(userData.phone);
    }
    if (userData.firstName) {
      hashed.fn = hashFirstName(userData.firstName);
    }
    if (userData.lastName) {
      hashed.ln = hashLastName(userData.lastName);
    }
    if (userData.city) {
      hashed.ct = hashCity(userData.city);
    }
    if (userData.state) {
      hashed.st = hashState(userData.state);
    }
    if (userData.zip) {
      hashed.zip = hashZip(userData.zip);
    }
    if (userData.country) {
      hashed.country = hashCountry(userData.country);
    }
    if (userData.externalId) {
      hashed.extern_id = hashExternalId(userData.externalId);
    }

    logger.debug('User data hashed', {
      fieldsHashed: Object.keys(hashed).length,
    });

    return hashed;
  } catch (error) {
    logger.error('Failed to hash user data', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Hash an array of user data objects
 */
export function hashUserDataBatch(users: UserData[]): HashedUserData[] {
  if (!Array.isArray(users)) {
    throw new Error('Users must be an array');
  }

  logger.info('Hashing batch of user data', {
    count: users.length,
  });

  const hashed = users.map((user, index) => {
    try {
      return hashUserData(user);
    } catch (error) {
      logger.error('Failed to hash user data in batch', {
        index,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Failed to hash user at index ${index}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  logger.info('Batch hashing complete', {
    totalUsers: users.length,
    successfullyHashed: hashed.length,
  });

  return hashed;
}
