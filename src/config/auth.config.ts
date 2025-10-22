/**
 * Authentication configuration module
 * Loads and validates authentication settings from environment variables
 */

import { z } from 'zod';
import type { AuthConfig } from '../types/config.types.js';

// Zod schema for authentication configuration
const AuthConfigSchema = z.object({
  META_ACCESS_TOKEN: z.string().min(1, 'META_ACCESS_TOKEN is required'),
  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  META_API_VERSION: z.string().default('v22.0'),
  AUTH_MODE: z.enum(['token', 'oauth']).default('token'),
});

/**
 * Load and validate authentication configuration from environment
 * Returns config with optional token (allows server to start without token)
 */
export function loadAuthConfig(): AuthConfig | null {
  try {
    const config = AuthConfigSchema.parse({
      META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN,
      META_APP_ID: process.env.META_APP_ID,
      META_APP_SECRET: process.env.META_APP_SECRET,
      META_API_VERSION: process.env.META_API_VERSION,
      AUTH_MODE: process.env.AUTH_MODE,
    });

    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Check if it's just a missing token
      const tokenError = error.errors.find(err => err.path[0] === 'META_ACCESS_TOKEN');
      if (tokenError && !process.env.META_ACCESS_TOKEN) {
        // Return null to indicate no token configured
        // Server will start but tools will return helpful errors
        return null;
      }

      // Other validation errors should still throw
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(
        `Configuration validation failed:\n${messages.join('\n')}\n\n` +
        'Please check your .env file or environment variables.'
      );
    }
    throw error;
  }
}

/**
 * Validate OAuth configuration is complete
 */
export function validateOAuthConfig(config: AuthConfig): boolean {
  if (config.AUTH_MODE === 'oauth') {
    if (!config.META_APP_ID || !config.META_APP_SECRET) {
      throw new Error(
        'OAuth mode requires META_APP_ID and META_APP_SECRET to be set'
      );
    }
  }
  return true;
}
