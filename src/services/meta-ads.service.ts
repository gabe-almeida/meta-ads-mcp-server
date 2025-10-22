/**
 * Base Meta Ads Service
 * Core service class for Meta Marketing API interactions
 */

import * as adsSdk from 'facebook-nodejs-business-sdk';
import type { MetaAdsConfig } from '../types/config.types.js';
import type { MetaCursor } from '../types/meta-ads.types.js';
import { logger } from '../utils/logger.js';

export class MetaAdsService {
  protected api: typeof adsSdk.FacebookAdsApi;
  protected config: MetaAdsConfig;
  protected readonly AdAccount: typeof adsSdk.AdAccount;
  protected readonly Campaign: typeof adsSdk.Campaign;
  protected readonly AdSet: typeof adsSdk.AdSet;
  protected readonly Ad: typeof adsSdk.Ad;
  protected readonly AdCreative: typeof adsSdk.AdCreative;
  protected readonly AdsPixel: typeof adsSdk.AdsPixel;
  protected readonly CustomAudience: typeof adsSdk.CustomAudience;

  constructor(config: MetaAdsConfig) {
    this.config = config;

    // Initialize Facebook Ads API
    this.api = adsSdk.FacebookAdsApi.init(config.accessToken);

    // Set API version if provided
    if (config.apiVersion) {
      this.api.setVersion(config.apiVersion);
    }

    // Enable debug mode if LOG_LEVEL is debug
    const isDebug = process.env.DEBUG === 'true' || logger.isDebugEnabled();
    if (isDebug) {
      this.api.setDebug(true);
      logger.debug('Meta Ads SDK debug mode enabled');
    }

    // Store SDK classes for easy access
    this.AdAccount = adsSdk.AdAccount;
    this.Campaign = adsSdk.Campaign;
    this.AdSet = adsSdk.AdSet;
    this.Ad = adsSdk.Ad;
    this.AdCreative = adsSdk.AdCreative;
    this.AdsPixel = adsSdk.AdsPixel;
    this.CustomAudience = adsSdk.CustomAudience;

    logger.info('Meta Ads Service initialized', {
      apiVersion: config.apiVersion || 'default',
      debug: isDebug,
    });
  }

  /**
   * Paginate through all results from a Meta API cursor
   * @param cursor Meta API cursor object
   * @returns Array of all results
   */
  protected async paginateAll<T = any>(cursor: MetaCursor): Promise<T[]> {
    const results: T[] = [];

    try {
      // Add initial page
      for (const item of cursor) {
        results.push(item);
      }

      // Fetch subsequent pages
      while (cursor.hasNext()) {
        const nextCursor = await cursor.next();
        for (const item of nextCursor) {
          results.push(item);
        }
        // Update cursor for next iteration
        cursor = nextCursor;
      }

      logger.debug('Pagination complete', {
        totalResults: results.length,
      });

      return results;
    } catch (error) {
      logger.error('Pagination failed', {
        error: error instanceof Error ? error.message : String(error),
        resultsCollected: results.length,
      });
      throw error;
    }
  }

  /**
   * Paginate with a limit on total results
   * @param cursor Meta API cursor object
   * @param maxResults Maximum number of results to fetch
   * @returns Array of results up to maxResults
   */
  protected async paginateWithLimit<T = any>(
    cursor: MetaCursor,
    maxResults: number
  ): Promise<T[]> {
    const results: T[] = [];

    try {
      // Add initial page
      for (const item of cursor) {
        results.push(item);
        if (results.length >= maxResults) {
          return results.slice(0, maxResults);
        }
      }

      // Fetch subsequent pages until limit reached
      while (cursor.hasNext() && results.length < maxResults) {
        const nextCursor = await cursor.next();
        for (const item of nextCursor) {
          results.push(item);
          if (results.length >= maxResults) {
            return results.slice(0, maxResults);
          }
        }
        cursor = nextCursor;
      }

      logger.debug('Pagination with limit complete', {
        totalResults: results.length,
        maxResults,
      });

      return results;
    } catch (error) {
      logger.error('Pagination with limit failed', {
        error: error instanceof Error ? error.message : String(error),
        resultsCollected: results.length,
        maxResults,
      });
      throw error;
    }
  }

  /**
   * Normalize account ID (add 'act_' prefix if missing)
   */
  protected normalizeAccountId(accountId: string): string {
    return accountId.startsWith('act_') ? accountId : `act_${accountId}`;
  }

  /**
   * Get API version being used
   */
  getApiVersion(): string {
    return this.config.apiVersion || this.api.getVersion();
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugMode(): boolean {
    return this.api.isDebug();
  }
}
