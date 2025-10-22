/**
 * Campaign Service
 * Manages campaign operations for Meta Ads
 */

import { MetaAdsService } from './meta-ads.service.js';
import { ExponentialBackoff } from '../utils/retry.js';
import { handleMetaApiError } from '../utils/error-handler.js';
import { logger } from '../utils/logger.js';
import type { CampaignCreateParams, GetOptions } from '../types/meta-ads.types.js';

export class CampaignService extends MetaAdsService {
  private backoff = new ExponentialBackoff();

  /**
   * Get all campaigns for an ad account
   */
  async getCampaigns(accountId: string, options: GetOptions = {}) {
    return this.backoff.execute(async () => {
      try {
        const account = new this.AdAccount(this.normalizeAccountId(accountId));
        const fields = options.fields || [
          this.Campaign.Fields.id,
          this.Campaign.Fields.name,
          this.Campaign.Fields.status,
          this.Campaign.Fields.objective,
          this.Campaign.Fields.daily_budget,
          this.Campaign.Fields.lifetime_budget,
          this.Campaign.Fields.created_time,
          this.Campaign.Fields.updated_time,
        ];

        const params: any = { limit: options.limit || 100 };
        if (options.filtering) {
          params.filtering = options.filtering;
        }

        logger.debug('Fetching campaigns', {
          accountId,
          fields: fields.length,
          limit: params.limit,
        });

        const campaigns = await account.getCampaigns(fields, params);
        const results = options.limit
          ? await this.paginateWithLimit(campaigns, options.limit)
          : await this.paginateAll(campaigns);

        logger.info('Campaigns fetched successfully', {
          accountId,
          count: results.length,
        });

        return results;
      } catch (error) {
        logger.error('Failed to fetch campaigns', {
          accountId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw handleMetaApiError(error);
      }
    });
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaign(campaignId: string, fields?: string[]) {
    return this.backoff.execute(async () => {
      try {
        const campaign = new this.Campaign(campaignId);
        const requestFields = fields || [
          this.Campaign.Fields.id,
          this.Campaign.Fields.name,
          this.Campaign.Fields.status,
          this.Campaign.Fields.objective,
          this.Campaign.Fields.daily_budget,
          this.Campaign.Fields.lifetime_budget,
          this.Campaign.Fields.bid_strategy,
          this.Campaign.Fields.created_time,
          this.Campaign.Fields.updated_time,
        ];

        logger.debug('Fetching campaign', { campaignId });

        const result = await campaign.get(requestFields);

        logger.info('Campaign fetched successfully', { campaignId });

        return result;
      } catch (error) {
        logger.error('Failed to fetch campaign', {
          campaignId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw handleMetaApiError(error);
      }
    });
  }

  /**
   * Create a new campaign
   */
  async createCampaign(accountId: string, data: CampaignCreateParams) {
    return this.backoff.execute(async () => {
      try {
        const account = new this.AdAccount(this.normalizeAccountId(accountId));

        logger.debug('Creating campaign', {
          accountId,
          name: data.name,
          objective: data.objective,
        });

        const result = await account.createCampaign(
          [this.Campaign.Fields.id, this.Campaign.Fields.name],
          data as any
        );

        logger.info('Campaign created successfully', {
          accountId,
          campaignId: result.id,
          name: data.name,
        });

        return result;
      } catch (error) {
        logger.error('Failed to create campaign', {
          accountId,
          name: data.name,
          error: error instanceof Error ? error.message : String(error),
        });
        throw handleMetaApiError(error);
      }
    });
  }

  /**
   * Update an existing campaign
   */
  async updateCampaign(campaignId: string, updates: any) {
    return this.backoff.execute(async () => {
      try {
        const campaign = new this.Campaign(campaignId);

        logger.debug('Updating campaign', {
          campaignId,
          updates: Object.keys(updates),
        });

        // Set each update field
        Object.entries(updates).forEach(([key, value]) => {
          campaign.set(key, value);
        });

        const result = await campaign.update();

        logger.info('Campaign updated successfully', {
          campaignId,
          updatedFields: Object.keys(updates),
        });

        return result;
      } catch (error) {
        logger.error('Failed to update campaign', {
          campaignId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw handleMetaApiError(error);
      }
    });
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(campaignId: string) {
    return this.backoff.execute(async () => {
      try {
        const campaign = new this.Campaign(campaignId);

        logger.debug('Deleting campaign', { campaignId });

        const result = await campaign.delete();

        logger.info('Campaign deleted successfully', { campaignId });

        return result;
      } catch (error) {
        logger.error('Failed to delete campaign', {
          campaignId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw handleMetaApiError(error);
      }
    });
  }
}
