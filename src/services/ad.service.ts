/**
 * Ad Service
 * Manages ad operations for Meta Ads
 */

import { MetaAdsService } from './meta-ads.service.js';
import { ExponentialBackoff } from '../utils/retry.js';
import { handleMetaApiError } from '../utils/error-handler.js';
import { logger } from '../utils/logger.js';
import type { AdCreateParams, GetOptions } from '../types/meta-ads.types.js';

export class AdService extends MetaAdsService {
  private backoff = new ExponentialBackoff();

  /**
   * Get all ads for an ad set or account
   */
  async getAds(parentId: string, options: GetOptions = {}, fromAdSet = true) {
    return this.backoff.execute(async () => {
      try {
        const fields = options.fields || [
          this.Ad.Fields.id,
          this.Ad.Fields.name,
          this.Ad.Fields.status,
          this.Ad.Fields.adset_id,
          this.Ad.Fields.campaign_id,
          this.Ad.Fields.creative,
          this.Ad.Fields.created_time,
          this.Ad.Fields.updated_time,
        ];

        const params: any = { limit: options.limit || 100 };
        if (options.filtering) {
          params.filtering = options.filtering;
        }

        logger.debug('Fetching ads', {
          parentId,
          fromAdSet,
          fields: fields.length,
          limit: params.limit,
        });

        let ads;
        if (fromAdSet) {
          const adSet = new this.AdSet(parentId);
          ads = await adSet.getAds(fields, params);
        } else {
          const account = new this.AdAccount(this.normalizeAccountId(parentId));
          ads = await account.getAds(fields, params);
        }

        const results = options.limit
          ? await this.paginateWithLimit(ads, options.limit)
          : await this.paginateAll(ads);

        logger.info('Ads fetched successfully', {
          parentId,
          count: results.length,
        });

        return results;
      } catch (error) {
        logger.error('Failed to fetch ads', {
          parentId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw handleMetaApiError(error);
      }
    });
  }

  /**
   * Get a single ad by ID
   */
  async getAd(adId: string, fields?: string[]) {
    return this.backoff.execute(async () => {
      try {
        const ad = new this.Ad(adId);
        const requestFields = fields || [
          this.Ad.Fields.id,
          this.Ad.Fields.name,
          this.Ad.Fields.status,
          this.Ad.Fields.adset_id,
          this.Ad.Fields.campaign_id,
          this.Ad.Fields.creative,
          this.Ad.Fields.created_time,
          this.Ad.Fields.updated_time,
        ];

        logger.debug('Fetching ad', { adId });

        const result = await ad.get(requestFields);

        logger.info('Ad fetched successfully', { adId });

        return result;
      } catch (error) {
        logger.error('Failed to fetch ad', {
          adId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw handleMetaApiError(error);
      }
    });
  }

  /**
   * Create a new ad
   */
  async createAd(accountId: string, data: AdCreateParams) {
    return this.backoff.execute(async () => {
      try {
        const account = new this.AdAccount(this.normalizeAccountId(accountId));

        logger.debug('Creating ad', {
          accountId,
          name: data.name,
          adsetId: data.adset_id,
          creativeId: data.creative_id,
        });

        const result = await account.createAd(
          [this.Ad.Fields.id, this.Ad.Fields.name],
          data as any
        );

        logger.info('Ad created successfully', {
          accountId,
          adId: result.id,
          name: data.name,
        });

        return result;
      } catch (error) {
        logger.error('Failed to create ad', {
          accountId,
          name: data.name,
          error: error instanceof Error ? error.message : String(error),
        });
        throw handleMetaApiError(error);
      }
    });
  }

  /**
   * Update an existing ad
   */
  async updateAd(adId: string, updates: any) {
    return this.backoff.execute(async () => {
      try {
        const ad = new this.Ad(adId);

        logger.debug('Updating ad', {
          adId,
          updates: Object.keys(updates),
        });

        // Set each update field
        Object.entries(updates).forEach(([key, value]) => {
          ad.set(key, value);
        });

        const result = await ad.update();

        logger.info('Ad updated successfully', {
          adId,
          updatedFields: Object.keys(updates),
        });

        return result;
      } catch (error) {
        logger.error('Failed to update ad', {
          adId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw handleMetaApiError(error);
      }
    });
  }

  /**
   * Delete an ad
   */
  async deleteAd(adId: string) {
    return this.backoff.execute(async () => {
      try {
        const ad = new this.Ad(adId);

        logger.debug('Deleting ad', { adId });

        const result = await ad.delete();

        logger.info('Ad deleted successfully', { adId });

        return result;
      } catch (error) {
        logger.error('Failed to delete ad', {
          adId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw handleMetaApiError(error);
      }
    });
  }
}
