/**
 * Meta API configuration module
 * Configuration for Meta Marketing API settings
 */

import { z } from 'zod';
import type { MetaAdsConfig } from '../types/config.types.js';

// Zod schema for Meta API configuration
const MetaAdsConfigSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  apiVersion: z.string().regex(/^v\d+\.\d+$/, 'API version must be in format vX.Y').default('v22.0'),
  appId: z.string().optional(),
  appSecret: z.string().optional(),
});

/**
 * Create Meta Ads configuration object
 */
export function createMetaConfig(accessToken: string, options: Partial<MetaAdsConfig> = {}): MetaAdsConfig {
  try {
    const config = MetaAdsConfigSchema.parse({
      accessToken,
      apiVersion: options.apiVersion || 'v22.0',
      appId: options.appId,
      appSecret: options.appSecret,
    });

    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Meta configuration validation failed:\n${messages.join('\n')}`);
    }
    throw error;
  }
}

/**
 * Validate Meta API version format
 */
export function isValidApiVersion(version: string): boolean {
  return /^v\d+\.\d+$/.test(version);
}

/**
 * Get default Meta API configuration
 */
export function getDefaultMetaConfig(): Pick<MetaAdsConfig, 'apiVersion'> {
  return {
    apiVersion: 'v22.0',
  };
}
