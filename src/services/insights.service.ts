/**
 * Insights Service
 * Handles performance metrics and analytics for Meta Ads
 */

import { MetaAdsService } from './meta-ads.service.js';
import { logger } from '../utils/logger.js';
import { handleMetaApiError } from '../utils/error-handler.js';
import { createDefaultBackoff } from '../utils/retry.js';

/**
 * Date preset options for insights
 */
export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  | 'last_3d'
  | 'last_7d'
  | 'last_14d'
  | 'last_28d'
  | 'last_30d'
  | 'last_90d'
  | 'lifetime';

/**
 * Time increment options
 */
export type TimeIncrement = number | 'monthly' | 'all_days';

/**
 * Breakdown options for insights
 */
export type BreakdownType =
  | 'age'
  | 'gender'
  | 'country'
  | 'region'
  | 'placement'
  | 'device_platform'
  | 'publisher_platform'
  | 'product_id';

/**
 * Insights query parameters
 */
export interface InsightsParams {
  date_preset?: DatePreset;
  time_range?: {
    since: string; // YYYY-MM-DD format
    until: string; // YYYY-MM-DD format
  };
  time_increment?: TimeIncrement;
  breakdowns?: BreakdownType[];
  fields?: string[];
  level?: 'campaign' | 'adset' | 'ad' | 'account';
  filtering?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  action_attribution_windows?: string[];
  limit?: number;
}

/**
 * Common insight metric fields
 */
export const COMMON_METRICS = [
  'impressions',
  'clicks',
  'spend',
  'reach',
  'frequency',
  'cpc',
  'cpm',
  'cpp',
  'ctr',
  'unique_clicks',
  'unique_ctr',
  'cost_per_unique_click',
];

/**
 * Conversion metric fields
 */
export const CONVERSION_METRICS = [
  'actions',
  'action_values',
  'conversions',
  'conversion_values',
  'cost_per_action_type',
  'cost_per_conversion',
  'website_purchase_roas',
];

/**
 * Video metric fields
 */
export const VIDEO_METRICS = [
  'video_30_sec_watched_actions',
  'video_avg_time_watched_actions',
  'video_p25_watched_actions',
  'video_p50_watched_actions',
  'video_p75_watched_actions',
  'video_p100_watched_actions',
];

/**
 * All available insight fields
 */
export const ALL_INSIGHT_FIELDS = [
  ...COMMON_METRICS,
  ...CONVERSION_METRICS,
  ...VIDEO_METRICS,
  'date_start',
  'date_stop',
  'account_id',
  'account_name',
  'campaign_id',
  'campaign_name',
  'adset_id',
  'adset_name',
  'ad_id',
  'ad_name',
];

export class InsightsService extends MetaAdsService {
  private readonly backoff = createDefaultBackoff();

  /**
   * Build insights query parameters
   */
  private buildInsightsParams(params: InsightsParams): any {
    const queryParams: any = {};

    // Date range
    if (params.date_preset) {
      queryParams.date_preset = params.date_preset;
    } else if (params.time_range) {
      queryParams.time_range = params.time_range;
    } else {
      // Default to last 30 days
      queryParams.date_preset = 'last_30d';
    }

    // Time increment
    if (params.time_increment) {
      queryParams.time_increment = params.time_increment;
    }

    // Breakdowns
    if (params.breakdowns && params.breakdowns.length > 0) {
      queryParams.breakdowns = params.breakdowns;
    }

    // Action attribution windows
    if (params.action_attribution_windows) {
      queryParams.action_attribution_windows = params.action_attribution_windows;
    } else {
      // Default attribution windows
      queryParams.action_attribution_windows = ['7d_click', '1d_view'];
    }

    // Filtering
    if (params.filtering) {
      queryParams.filtering = params.filtering;
    }

    // Limit
    if (params.limit) {
      queryParams.limit = params.limit;
    }

    return queryParams;
  }

  /**
   * Get default insight fields based on level
   */
  private getDefaultFields(level?: string): string[] {
    const baseFields = [
      'date_start',
      'date_stop',
      'impressions',
      'clicks',
      'spend',
      'reach',
      'frequency',
      'cpc',
      'cpm',
      'cpp',
      'ctr',
      'actions',
      'conversions',
      'cost_per_conversion',
    ];

    // Add level-specific ID and name fields
    switch (level) {
      case 'campaign':
        return [...baseFields, 'campaign_id', 'campaign_name'];
      case 'adset':
        return [...baseFields, 'campaign_id', 'adset_id', 'adset_name'];
      case 'ad':
        return [...baseFields, 'campaign_id', 'adset_id', 'ad_id', 'ad_name'];
      case 'account':
        return [...baseFields, 'account_id', 'account_name'];
      default:
        return baseFields;
    }
  }

  /**
   * Get campaign insights
   */
  async getCampaignInsights(campaignId: string, params?: InsightsParams): Promise<any[]> {
    logger.info('Fetching campaign insights', {
      campaignId,
      params,
    });

    try {
      const fields = params?.fields || this.getDefaultFields('campaign');
      const queryParams = this.buildInsightsParams(params || {});

      const result = await this.backoff.execute(async () => {
        const campaign = new this.Campaign(campaignId);
        const cursor = await campaign.getInsights(fields, queryParams);

        if (params?.limit) {
          return this.paginateWithLimit(cursor, params.limit);
        }
        return this.paginateAll(cursor);
      }, { operation: 'getCampaignInsights', campaignId });

      logger.info('Campaign insights fetched successfully', {
        campaignId,
        recordCount: result.length,
      });

      return result;
    } catch (error) {
      const metaError = handleMetaApiError(error);
      logger.error('Failed to fetch campaign insights', {
        campaignId,
        error: metaError.toLogObject(),
      });
      throw metaError;
    }
  }

  /**
   * Get ad set insights
   */
  async getAdSetInsights(adSetId: string, params?: InsightsParams): Promise<any[]> {
    logger.info('Fetching ad set insights', {
      adSetId,
      params,
    });

    try {
      const fields = params?.fields || this.getDefaultFields('adset');
      const queryParams = this.buildInsightsParams(params || {});

      const result = await this.backoff.execute(async () => {
        const adSet = new this.AdSet(adSetId);
        const cursor = await adSet.getInsights(fields, queryParams);

        if (params?.limit) {
          return this.paginateWithLimit(cursor, params.limit);
        }
        return this.paginateAll(cursor);
      }, { operation: 'getAdSetInsights', adSetId });

      logger.info('Ad set insights fetched successfully', {
        adSetId,
        recordCount: result.length,
      });

      return result;
    } catch (error) {
      const metaError = handleMetaApiError(error);
      logger.error('Failed to fetch ad set insights', {
        adSetId,
        error: metaError.toLogObject(),
      });
      throw metaError;
    }
  }

  /**
   * Get ad insights
   */
  async getAdInsights(adId: string, params?: InsightsParams): Promise<any[]> {
    logger.info('Fetching ad insights', {
      adId,
      params,
    });

    try {
      const fields = params?.fields || this.getDefaultFields('ad');
      const queryParams = this.buildInsightsParams(params || {});

      const result = await this.backoff.execute(async () => {
        const ad = new this.Ad(adId);
        const cursor = await ad.getInsights(fields, queryParams);

        if (params?.limit) {
          return this.paginateWithLimit(cursor, params.limit);
        }
        return this.paginateAll(cursor);
      }, { operation: 'getAdInsights', adId });

      logger.info('Ad insights fetched successfully', {
        adId,
        recordCount: result.length,
      });

      return result;
    } catch (error) {
      const metaError = handleMetaApiError(error);
      logger.error('Failed to fetch ad insights', {
        adId,
        error: metaError.toLogObject(),
      });
      throw metaError;
    }
  }

  /**
   * Get account-level insights
   */
  async getAccountInsights(accountId: string, params?: InsightsParams): Promise<any[]> {
    const normalizedAccountId = this.normalizeAccountId(accountId);

    logger.info('Fetching account insights', {
      accountId: normalizedAccountId,
      params,
    });

    try {
      const fields = params?.fields || this.getDefaultFields('account');
      const queryParams = this.buildInsightsParams(params || {});

      const result = await this.backoff.execute(async () => {
        const account = new this.AdAccount(normalizedAccountId);
        const cursor = await account.getInsights(fields, queryParams);

        if (params?.limit) {
          return this.paginateWithLimit(cursor, params.limit);
        }
        return this.paginateAll(cursor);
      }, { operation: 'getAccountInsights', accountId: normalizedAccountId });

      logger.info('Account insights fetched successfully', {
        accountId: normalizedAccountId,
        recordCount: result.length,
      });

      return result;
    } catch (error) {
      const metaError = handleMetaApiError(error);
      logger.error('Failed to fetch account insights', {
        accountId: normalizedAccountId,
        error: metaError.toLogObject(),
      });
      throw metaError;
    }
  }

  /**
   * Get insights for multiple campaigns
   */
  async getMultipleCampaignInsights(
    campaignIds: string[],
    params?: InsightsParams
  ): Promise<Record<string, any[]>> {
    logger.info('Fetching insights for multiple campaigns', {
      campaignCount: campaignIds.length,
    });

    const results: Record<string, any[]> = {};

    // Process campaigns in parallel with a concurrency limit
    const concurrency = 5;
    for (let i = 0; i < campaignIds.length; i += concurrency) {
      const batch = campaignIds.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(async (campaignId) => {
          try {
            const insights = await this.getCampaignInsights(campaignId, params);
            return { campaignId, insights };
          } catch (error) {
            logger.error('Failed to fetch insights for campaign', {
              campaignId,
              error: error instanceof Error ? error.message : String(error),
            });
            return { campaignId, insights: [], error: true };
          }
        })
      );

      // Merge batch results
      for (const { campaignId, insights } of batchResults) {
        results[campaignId] = insights;
      }
    }

    logger.info('Multiple campaign insights fetched', {
      campaignCount: campaignIds.length,
      successCount: Object.values(results).filter((r) => r.length > 0).length,
    });

    return results;
  }

  /**
   * Get breakdown insights (e.g., by age, gender, country)
   */
  async getBreakdownInsights(
    entityId: string,
    entityType: 'campaign' | 'adset' | 'ad' | 'account',
    breakdowns: BreakdownType[],
    params?: InsightsParams
  ): Promise<any[]> {
    logger.info('Fetching breakdown insights', {
      entityId,
      entityType,
      breakdowns,
    });

    const insightsParams: InsightsParams = {
      ...params,
      breakdowns,
    };

    switch (entityType) {
      case 'campaign':
        return this.getCampaignInsights(entityId, insightsParams);
      case 'adset':
        return this.getAdSetInsights(entityId, insightsParams);
      case 'ad':
        return this.getAdInsights(entityId, insightsParams);
      case 'account':
        return this.getAccountInsights(entityId, insightsParams);
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  }
}
