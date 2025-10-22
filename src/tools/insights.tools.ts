/**
 * Insights Tools
 * MCP tools for querying Meta Ads performance metrics and analytics
 */

import { z } from 'zod';
import {
  InsightsService,
  type DatePreset,
  type BreakdownType,
  type TimeIncrement,
  CONVERSION_METRICS,
} from '../services/insights.service.js';
import type { MetaAdsConfig } from '../types/config.types.js';

/**
 * Define insights tool schemas
 */

const DatePresetEnum = z.enum([
  'today',
  'yesterday',
  'this_week',
  'last_week',
  'this_month',
  'last_month',
  'this_quarter',
  'last_quarter',
  'this_year',
  'last_year',
  'last_3d',
  'last_7d',
  'last_14d',
  'last_28d',
  'last_30d',
  'last_90d',
  'lifetime',
]);

const BreakdownEnum = z.enum([
  'age',
  'gender',
  'country',
  'region',
  'placement',
  'device_platform',
  'publisher_platform',
  'product_id',
]);

const TimeRangeSchema = z.object({
  since: z.string().describe('Start date in YYYY-MM-DD format'),
  until: z.string().describe('End date in YYYY-MM-DD format'),
});

const BaseInsightsSchema = z.object({
  date_preset: DatePresetEnum.optional().describe(
    'Predefined date range (e.g., last_7d, last_30d, this_month)'
  ),
  time_range: TimeRangeSchema.optional().describe(
    'Custom date range (use either date_preset or time_range, not both)'
  ),
  time_increment: z
    .union([z.number(), z.enum(['monthly', 'all_days'])])
    .optional()
    .describe('Group results by time period (1 = daily, 7 = weekly, monthly, all_days)'),
  breakdowns: z
    .array(BreakdownEnum)
    .optional()
    .describe('Break down results by dimensions (age, gender, country, etc)'),
  fields: z
    .array(z.string())
    .optional()
    .describe('Specific metric fields to return (impressions, clicks, spend, etc)'),
  limit: z.number().optional().describe('Maximum number of results to return'),
});

const GetCampaignInsightsSchema = BaseInsightsSchema.extend({
  campaign_id: z.string().describe('Campaign ID to get insights for'),
});

const GetAdSetInsightsSchema = BaseInsightsSchema.extend({
  adset_id: z.string().describe('Ad Set ID to get insights for'),
});

const GetAdInsightsSchema = BaseInsightsSchema.extend({
  ad_id: z.string().describe('Ad ID to get insights for'),
});

const GetAccountInsightsSchema = BaseInsightsSchema.extend({
  account_id: z.string().describe('Ad account ID (with or without act_ prefix)'),
});

const GetConversionMetricsSchema = z.object({
  entity_id: z.string().describe('Campaign, Ad Set, or Ad ID'),
  entity_type: z
    .enum(['campaign', 'adset', 'ad', 'account'])
    .describe('Type of entity to get conversion metrics for'),
  date_preset: DatePresetEnum.optional().describe('Predefined date range'),
  time_range: TimeRangeSchema.optional().describe('Custom date range'),
  attribution_windows: z
    .array(z.string())
    .optional()
    .describe('Attribution windows (e.g., ["7d_click", "1d_view"])'),
});

/**
 * Create insights tools
 */
export function createInsightsTools(config: MetaAdsConfig) {
  const insightsService = new InsightsService(config);

  return [
    {
      name: 'get_campaign_insights',
      description:
        'Get performance metrics and analytics for a campaign. Returns impressions, clicks, spend, conversions, and other KPIs. Supports time ranges, breakdowns, and custom metrics.',
      inputSchema: GetCampaignInsightsSchema,
      handler: async (args: z.infer<typeof GetCampaignInsightsSchema>) => {
        const result = await insightsService.getCampaignInsights(args.campaign_id, {
          date_preset: args.date_preset as DatePreset | undefined,
          time_range: args.time_range,
          time_increment: args.time_increment as TimeIncrement | undefined,
          breakdowns: args.breakdowns as BreakdownType[] | undefined,
          fields: args.fields,
          limit: args.limit,
        });

        // Calculate summary statistics
        const summary = calculateSummary(result);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  campaign_id: args.campaign_id,
                  date_range: args.date_preset || args.time_range,
                  record_count: result.length,
                  summary,
                  insights: result,
                },
                null,
                2
              ),
            },
          ],
        };
      },
    },

    {
      name: 'get_adset_insights',
      description:
        'Get performance metrics and analytics for an ad set. Returns impressions, clicks, spend, conversions, and other KPIs. Supports time ranges, breakdowns, and custom metrics.',
      inputSchema: GetAdSetInsightsSchema,
      handler: async (args: z.infer<typeof GetAdSetInsightsSchema>) => {
        const result = await insightsService.getAdSetInsights(args.adset_id, {
          date_preset: args.date_preset as DatePreset | undefined,
          time_range: args.time_range,
          time_increment: args.time_increment as TimeIncrement | undefined,
          breakdowns: args.breakdowns as BreakdownType[] | undefined,
          fields: args.fields,
          limit: args.limit,
        });

        const summary = calculateSummary(result);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  adset_id: args.adset_id,
                  date_range: args.date_preset || args.time_range,
                  record_count: result.length,
                  summary,
                  insights: result,
                },
                null,
                2
              ),
            },
          ],
        };
      },
    },

    {
      name: 'get_ad_insights',
      description:
        'Get performance metrics and analytics for a specific ad. Returns impressions, clicks, spend, conversions, and other KPIs. Supports time ranges, breakdowns, and custom metrics.',
      inputSchema: GetAdInsightsSchema,
      handler: async (args: z.infer<typeof GetAdInsightsSchema>) => {
        const result = await insightsService.getAdInsights(args.ad_id, {
          date_preset: args.date_preset as DatePreset | undefined,
          time_range: args.time_range,
          time_increment: args.time_increment as TimeIncrement | undefined,
          breakdowns: args.breakdowns as BreakdownType[] | undefined,
          fields: args.fields,
          limit: args.limit,
        });

        const summary = calculateSummary(result);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  ad_id: args.ad_id,
                  date_range: args.date_preset || args.time_range,
                  record_count: result.length,
                  summary,
                  insights: result,
                },
                null,
                2
              ),
            },
          ],
        };
      },
    },

    {
      name: 'get_account_insights',
      description:
        'Get aggregated performance metrics for an entire ad account. Returns total impressions, clicks, spend, conversions across all campaigns. Supports time ranges and custom metrics.',
      inputSchema: GetAccountInsightsSchema,
      handler: async (args: z.infer<typeof GetAccountInsightsSchema>) => {
        const result = await insightsService.getAccountInsights(args.account_id, {
          date_preset: args.date_preset as DatePreset | undefined,
          time_range: args.time_range,
          time_increment: args.time_increment as TimeIncrement | undefined,
          breakdowns: args.breakdowns as BreakdownType[] | undefined,
          fields: args.fields,
          limit: args.limit,
        });

        const summary = calculateSummary(result);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  account_id: args.account_id,
                  date_range: args.date_preset || args.time_range,
                  record_count: result.length,
                  summary,
                  insights: result,
                },
                null,
                2
              ),
            },
          ],
        };
      },
    },

    {
      name: 'get_conversion_metrics',
      description:
        'Get detailed conversion metrics including actions, conversion values, cost per action, and ROAS. Useful for analyzing conversion performance and ROI.',
      inputSchema: GetConversionMetricsSchema,
      handler: async (args: z.infer<typeof GetConversionMetricsSchema>) => {
        const result = await insightsService.getBreakdownInsights(
          args.entity_id,
          args.entity_type,
          [], // No breakdowns
          {
            date_preset: args.date_preset as DatePreset | undefined,
            time_range: args.time_range,
            fields: CONVERSION_METRICS,
            action_attribution_windows: args.attribution_windows || ['7d_click', '1d_view'],
          }
        );

        // Extract and format conversion data
        const conversions = formatConversionMetrics(result);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  entity_id: args.entity_id,
                  entity_type: args.entity_type,
                  date_range: args.date_preset || args.time_range,
                  attribution_windows: args.attribution_windows || ['7d_click', '1d_view'],
                  conversions,
                  raw_insights: result,
                },
                null,
                2
              ),
            },
          ],
        };
      },
    },

    {
      name: 'get_performance_comparison',
      description:
        'Compare performance metrics across multiple time periods. Useful for analyzing trends and identifying changes in campaign performance.',
      inputSchema: z.object({
        entity_id: z.string().describe('Campaign, Ad Set, or Ad ID'),
        entity_type: z
          .enum(['campaign', 'adset', 'ad', 'account'])
          .describe('Type of entity'),
        current_period: z.union([DatePresetEnum, TimeRangeSchema]).describe('Current period'),
        comparison_period: z
          .union([DatePresetEnum, TimeRangeSchema])
          .describe('Period to compare against (e.g., previous month)'),
      }),
      handler: async (args: {
        entity_id: string;
        entity_type: 'campaign' | 'adset' | 'ad' | 'account';
        current_period: DatePreset | { since: string; until: string };
        comparison_period: DatePreset | { since: string; until: string };
      }) => {
        // Get current period insights
        const currentParams =
          typeof args.current_period === 'string'
            ? { date_preset: args.current_period as DatePreset }
            : { time_range: args.current_period };

        const comparisonParams =
          typeof args.comparison_period === 'string'
            ? { date_preset: args.comparison_period as DatePreset }
            : { time_range: args.comparison_period };

        const [currentResults, comparisonResults] = await Promise.all([
          insightsService.getBreakdownInsights(
            args.entity_id,
            args.entity_type,
            [],
            currentParams
          ),
          insightsService.getBreakdownInsights(
            args.entity_id,
            args.entity_type,
            [],
            comparisonParams
          ),
        ]);

        const currentSummary = calculateSummary(currentResults);
        const comparisonSummary = calculateSummary(comparisonResults);
        const changes = calculateChanges(currentSummary, comparisonSummary);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  entity_id: args.entity_id,
                  entity_type: args.entity_type,
                  current_period: args.current_period,
                  comparison_period: args.comparison_period,
                  current: currentSummary,
                  comparison: comparisonSummary,
                  changes,
                },
                null,
                2
              ),
            },
          ],
        };
      },
    },
  ];
}

/**
 * Calculate summary statistics from insights data
 */
function calculateSummary(insights: any[]): Record<string, any> {
  if (insights.length === 0) {
    return {};
  }

  const summary: Record<string, any> = {};

  // Sum numeric fields
  const numericFields = [
    'impressions',
    'clicks',
    'spend',
    'reach',
    'actions',
    'conversions',
    'unique_clicks',
  ];

  for (const field of numericFields) {
    const sum = insights.reduce((acc, insight) => {
      const value = parseFloat(insight[field]) || 0;
      return acc + value;
    }, 0);

    if (sum > 0) {
      summary[field] = sum;
    }
  }

  // Calculate derived metrics
  if (summary.clicks && summary.impressions) {
    summary.ctr = (summary.clicks / summary.impressions) * 100;
  }

  if (summary.spend && summary.clicks) {
    summary.cpc = summary.spend / summary.clicks;
  }

  if (summary.spend && summary.impressions) {
    summary.cpm = (summary.spend / summary.impressions) * 1000;
  }

  if (summary.spend && summary.conversions) {
    summary.cost_per_conversion = summary.spend / summary.conversions;
  }

  return summary;
}

/**
 * Format conversion metrics for better readability
 */
function formatConversionMetrics(insights: any[]): any[] {
  return insights.map((insight) => {
    const formatted: any = {
      date_start: insight.date_start,
      date_stop: insight.date_stop,
      spend: parseFloat(insight.spend) || 0,
      conversions: [],
    };

    // Extract action data
    if (insight.actions && Array.isArray(insight.actions)) {
      formatted.conversions = insight.actions.map((action: any) => ({
        action_type: action.action_type,
        value: parseFloat(action.value) || 0,
        cost_per_action: insight.cost_per_action_type?.find(
          (c: any) => c.action_type === action.action_type
        )?.value,
      }));
    }

    // Add ROAS if available
    if (insight.website_purchase_roas) {
      formatted.roas = insight.website_purchase_roas;
    }

    return formatted;
  });
}

/**
 * Calculate percentage changes between two periods
 */
function calculateChanges(
  current: Record<string, any>,
  comparison: Record<string, any>
): Record<string, any> {
  const changes: Record<string, any> = {};

  for (const key in current) {
    if (comparison[key] !== undefined && typeof current[key] === 'number') {
      const currentValue = current[key];
      const comparisonValue = comparison[key];

      if (comparisonValue !== 0) {
        const change = ((currentValue - comparisonValue) / comparisonValue) * 100;
        changes[key] = {
          absolute: currentValue - comparisonValue,
          percentage: change,
        };
      } else {
        changes[key] = {
          absolute: currentValue,
          percentage: currentValue > 0 ? 100 : 0,
        };
      }
    }
  }

  return changes;
}
