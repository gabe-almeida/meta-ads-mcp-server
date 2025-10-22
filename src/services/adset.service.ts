/**
 * AdSet Service
 * Manages ad set operations for Meta Ads
 */

import { MetaAdsService } from './meta-ads.service.js';
import { ExponentialBackoff } from '../utils/retry.js';
import { handleMetaApiError } from '../utils/error-handler.js';
import { logger } from '../utils/logger.js';
import type { AdSetCreateParams, GetOptions } from '../types/meta-ads.types.js';

export class AdSetService extends MetaAdsService {
  private backoff = new ExponentialBackoff();

  /**
   * Get all ad sets for a campaign or account
   */
  async getAdSets(parentId: string, options: GetOptions = {}, fromCampaign = true) {
    return this.backoff.execute(async () => {
      try {
        const fields = options.fields || [
          this.AdSet.Fields.id,
          this.AdSet.Fields.name,
          this.AdSet.Fields.status,
          this.AdSet.Fields.campaign_id,
          this.AdSet.Fields.daily_budget,
          this.AdSet.Fields.lifetime_budget,
          this.AdSet.Fields.optimization_goal,
          this.AdSet.Fields.billing_event,
          this.AdSet.Fields.bid_amount,
          this.AdSet.Fields.start_time,
          this.AdSet.Fields.end_time,
          this.AdSet.Fields.created_time,
          this.AdSet.Fields.updated_time,
        ];

        const params: any = { limit: options.limit || 100 };
        if (options.filtering) {
          params.filtering = options.filtering;
        }

        logger.debug('Fetching ad sets', {
          parentId,
          fromCampaign,
          fields: fields.length,
          limit: params.limit,
        });

        let adSets;
        if (fromCampaign) {
          const campaign = new this.Campaign(parentId);
          adSets = await campaign.getAdSets(fields, params);
        } else {
          const account = new this.AdAccount(this.normalizeAccountId(parentId));
          adSets = await account.getAdSets(fields, params);
        }

        const results = options.limit
          ? await this.paginateWithLimit(adSets, options.limit)
          : await this.paginateAll(adSets);

        logger.info('Ad sets fetched successfully', {
          parentId,
          count: results.length,
        });

        return results;
      } catch (error) {
        logger.error('Failed to fetch ad sets', {
          parentId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw handleMetaApiError(error);
      }
    });
  }

  /**
   * Get a single ad set by ID
   */
  async getAdSet(adSetId: string, fields?: string[]) {
    return this.backoff.execute(async () => {
      try {
        const adSet = new this.AdSet(adSetId);
        const requestFields = fields || [
          this.AdSet.Fields.id,
          this.AdSet.Fields.name,
          this.AdSet.Fields.status,
          this.AdSet.Fields.campaign_id,
          this.AdSet.Fields.daily_budget,
          this.AdSet.Fields.lifetime_budget,
          this.AdSet.Fields.optimization_goal,
          this.AdSet.Fields.billing_event,
          this.AdSet.Fields.bid_amount,
          this.AdSet.Fields.targeting,
          this.AdSet.Fields.start_time,
          this.AdSet.Fields.end_time,
          this.AdSet.Fields.created_time,
          this.AdSet.Fields.updated_time,
        ];

        logger.debug('Fetching ad set', { adSetId });

        const result = await adSet.get(requestFields);

        logger.info('Ad set fetched successfully', { adSetId });

        return result;
      } catch (error) {
        logger.error('Failed to fetch ad set', {
          adSetId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw handleMetaApiError(error);
      }
    });
  }

  /**
   * Create a new ad set
   */
  async createAdSet(accountId: string, data: AdSetCreateParams) {
    return this.backoff.execute(async () => {
      try {
        const account = new this.AdAccount(this.normalizeAccountId(accountId));

        logger.debug('Creating ad set', {
          accountId,
          name: data.name,
          campaignId: data.campaign_id,
          optimizationGoal: data.optimization_goal,
        });

        const result = await account.createAdSet(
          [this.AdSet.Fields.id, this.AdSet.Fields.name],
          data as any
        );

        logger.info('Ad set created successfully', {
          accountId,
          adSetId: result.id,
          name: data.name,
        });

        return result;
      } catch (error) {
        logger.error('Failed to create ad set', {
          accountId,
          name: data.name,
          error: error instanceof Error ? error.message : String(error),
        });
        throw handleMetaApiError(error);
      }
    });
  }

  /**
   * Update an existing ad set
   */
  async updateAdSet(adSetId: string, updates: any) {
    return this.backoff.execute(async () => {
      try {
        const adSet = new this.AdSet(adSetId);

        logger.debug('Updating ad set', {
          adSetId,
          updates: Object.keys(updates),
        });

        // Set each update field
        Object.entries(updates).forEach(([key, value]) => {
          adSet.set(key, value);
        });

        const result = await adSet.update();

        logger.info('Ad set updated successfully', {
          adSetId,
          updatedFields: Object.keys(updates),
        });

        return result;
      } catch (error) {
        logger.error('Failed to update ad set', {
          adSetId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw handleMetaApiError(error);
      }
    });
  }

  /**
   * Delete an ad set
   */
  async deleteAdSet(adSetId: string) {
    return this.backoff.execute(async () => {
      try {
        const adSet = new this.AdSet(adSetId);

        logger.debug('Deleting ad set', { adSetId });

        const result = await adSet.delete();

        logger.info('Ad set deleted successfully', { adSetId });

        return result;
      } catch (error) {
        logger.error('Failed to delete ad set', {
          adSetId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw handleMetaApiError(error);
      }
    });
  }

  /**
   * Duplicate an ad set
   */
  async duplicateAdSet(adSetId: string, newName?: string, status?: string) {
    return this.backoff.execute(async () => {
      try {
        logger.debug('Duplicating ad set', { adSetId, newName });

        // Get the original ad set with all necessary fields
        const originalAdSet = await this.getAdSet(adSetId, [
          this.AdSet.Fields.campaign_id,
          this.AdSet.Fields.name,
          this.AdSet.Fields.daily_budget,
          this.AdSet.Fields.lifetime_budget,
          this.AdSet.Fields.optimization_goal,
          this.AdSet.Fields.billing_event,
          this.AdSet.Fields.bid_amount,
          this.AdSet.Fields.targeting,
          this.AdSet.Fields.start_time,
          this.AdSet.Fields.end_time,
        ]);

        // Get the account ID from the campaign
        const campaign = new this.Campaign(originalAdSet.campaign_id);
        const campaignData = await campaign.get([this.Campaign.Fields.account_id]);
        const accountId = campaignData.account_id;

        // Prepare data for the new ad set
        const newAdSetData: AdSetCreateParams = {
          campaign_id: originalAdSet.campaign_id,
          name: newName || `${originalAdSet.name} (Copy)`,
          optimization_goal: originalAdSet.optimization_goal,
          targeting: originalAdSet.targeting,
        };

        if (status) newAdSetData.status = status as any;
        if (originalAdSet.daily_budget) newAdSetData.daily_budget = originalAdSet.daily_budget;
        if (originalAdSet.lifetime_budget)
          newAdSetData.lifetime_budget = originalAdSet.lifetime_budget;
        if (originalAdSet.bid_amount) newAdSetData.bid_amount = originalAdSet.bid_amount;
        if (originalAdSet.billing_event) newAdSetData.billing_event = originalAdSet.billing_event;
        if (originalAdSet.start_time) newAdSetData.start_time = originalAdSet.start_time;
        if (originalAdSet.end_time) newAdSetData.end_time = originalAdSet.end_time;

        const result = await this.createAdSet(accountId, newAdSetData);

        logger.info('Ad set duplicated successfully', {
          originalAdSetId: adSetId,
          newAdSetId: result.id,
          newName: newAdSetData.name,
        });

        return result;
      } catch (error) {
        logger.error('Failed to duplicate ad set', {
          adSetId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw handleMetaApiError(error);
      }
    });
  }
}
