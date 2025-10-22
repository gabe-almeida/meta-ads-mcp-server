/**
 * Campaign Tools
 * MCP tools for campaign management operations
 */

import { CampaignService } from '../services/campaign.service.js';
import type { MetaAdsConfig } from '../types/config.types.js';
import { logger } from '../utils/logger.js';

// List campaigns schema
export const listCampaignsSchema = {
  name: 'list_campaigns',
  description:
    'List all campaigns for a Meta Ads account. Returns campaign details including name, status, objective, and budget information.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      account_id: {
        type: 'string',
        description: 'The Meta Ads account ID (with or without "act_" prefix)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of campaigns to return (default: 100)',
      },
      fields: {
        type: 'array',
        description: 'Specific fields to return (optional)',
        items: {
          type: 'string',
        },
      },
      status_filter: {
        type: 'string',
        enum: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'],
        description: 'Filter campaigns by status (optional)',
      },
    },
    required: ['account_id'],
  },
};

// Get campaign schema
export const getCampaignSchema = {
  name: 'get_campaign',
  description:
    'Get detailed information about a specific campaign by ID. Returns all campaign properties including targeting, budget, and performance settings.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      campaign_id: {
        type: 'string',
        description: 'The campaign ID',
      },
      fields: {
        type: 'array',
        description: 'Specific fields to return (optional)',
        items: {
          type: 'string',
        },
      },
    },
    required: ['campaign_id'],
  },
};

// Create campaign schema
export const createCampaignSchema = {
  name: 'create_campaign',
  description:
    'Create a new Meta Ads campaign. Requires campaign name, objective, and either daily_budget or lifetime_budget.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      account_id: {
        type: 'string',
        description: 'The Meta Ads account ID (with or without "act_" prefix)',
      },
      name: {
        type: 'string',
        description: 'Campaign name',
      },
      objective: {
        type: 'string',
        enum: [
          'OUTCOME_TRAFFIC',
          'OUTCOME_SALES',
          'OUTCOME_LEADS',
          'OUTCOME_AWARENESS',
          'OUTCOME_ENGAGEMENT',
          'OUTCOME_APP_PROMOTION',
        ],
        description: 'Campaign objective',
      },
      status: {
        type: 'string',
        enum: ['ACTIVE', 'PAUSED'],
        description: 'Campaign status (default: PAUSED)',
      },
      daily_budget: {
        type: 'number',
        description: 'Daily budget in cents (mutually exclusive with lifetime_budget)',
      },
      lifetime_budget: {
        type: 'number',
        description: 'Lifetime budget in cents (mutually exclusive with daily_budget)',
      },
      bid_strategy: {
        type: 'string',
        enum: [
          'LOWEST_COST_WITHOUT_CAP',
          'LOWEST_COST_WITH_BID_CAP',
          'COST_CAP',
          'LOWEST_COST_WITH_MIN_ROAS',
        ],
        description: 'Bid strategy (optional)',
      },
      special_ad_categories: {
        type: 'array',
        description: 'Special ad categories (required for certain industries)',
        items: {
          type: 'string',
          enum: ['CREDIT', 'EMPLOYMENT', 'HOUSING'],
        },
      },
      start_time: {
        type: 'string',
        description: 'Campaign start time (ISO 8601 format, optional)',
      },
      end_time: {
        type: 'string',
        description: 'Campaign end time (ISO 8601 format, optional)',
      },
    },
    required: ['account_id', 'name', 'objective'],
  },
};

// Update campaign schema
export const updateCampaignSchema = {
  name: 'update_campaign',
  description:
    'Update an existing campaign. Can modify name, status, budget, bid strategy, and other campaign properties.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      campaign_id: {
        type: 'string',
        description: 'The campaign ID to update',
      },
      name: {
        type: 'string',
        description: 'New campaign name (optional)',
      },
      status: {
        type: 'string',
        enum: ['ACTIVE', 'PAUSED', 'ARCHIVED'],
        description: 'New campaign status (optional)',
      },
      daily_budget: {
        type: 'number',
        description: 'New daily budget in cents (optional)',
      },
      lifetime_budget: {
        type: 'number',
        description: 'New lifetime budget in cents (optional)',
      },
      bid_strategy: {
        type: 'string',
        enum: [
          'LOWEST_COST_WITHOUT_CAP',
          'LOWEST_COST_WITH_BID_CAP',
          'COST_CAP',
          'LOWEST_COST_WITH_MIN_ROAS',
        ],
        description: 'New bid strategy (optional)',
      },
      start_time: {
        type: 'string',
        description: 'New start time (ISO 8601 format, optional)',
      },
      end_time: {
        type: 'string',
        description: 'New end time (ISO 8601 format, optional)',
      },
    },
    required: ['campaign_id'],
  },
};

// Delete campaign schema
export const deleteCampaignSchema = {
  name: 'delete_campaign',
  description:
    'Delete (archive) a campaign. This action cannot be undone. The campaign will be permanently removed from the account.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      campaign_id: {
        type: 'string',
        description: 'The campaign ID to delete',
      },
    },
    required: ['campaign_id'],
  },
};

// Tool handler functions
export class CampaignTools {
  private service: CampaignService;

  constructor(config: MetaAdsConfig) {
    this.service = new CampaignService(config);
  }

  async listCampaigns(args: any) {
    logger.info('list_campaigns tool called', {
      accountId: args.account_id,
      limit: args.limit,
    });

    const options: any = {};
    if (args.limit) options.limit = args.limit;
    if (args.fields) options.fields = args.fields;
    if (args.status_filter) {
      options.filtering = [
        {
          field: 'status',
          operator: 'IN',
          value: [args.status_filter],
        },
      ];
    }

    const campaigns = await this.service.getCampaigns(args.account_id, options);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              count: campaigns.length,
              campaigns,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async getCampaign(args: any) {
    logger.info('get_campaign tool called', { campaignId: args.campaign_id });

    const campaign = await this.service.getCampaign(args.campaign_id, args.fields);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              campaign,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async createCampaign(args: any) {
    logger.info('create_campaign tool called', {
      accountId: args.account_id,
      name: args.name,
      objective: args.objective,
    });

    const data: any = {
      name: args.name,
      objective: args.objective,
    };

    if (args.status) data.status = args.status;
    if (args.daily_budget) data.daily_budget = args.daily_budget;
    if (args.lifetime_budget) data.lifetime_budget = args.lifetime_budget;
    if (args.bid_strategy) data.bid_strategy = args.bid_strategy;
    if (args.special_ad_categories) data.special_ad_categories = args.special_ad_categories;
    if (args.start_time) data.start_time = args.start_time;
    if (args.end_time) data.end_time = args.end_time;

    const campaign = await this.service.createCampaign(args.account_id, data);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'Campaign created successfully',
              campaign,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async updateCampaign(args: any) {
    logger.info('update_campaign tool called', { campaignId: args.campaign_id });

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.status !== undefined) updates.status = args.status;
    if (args.daily_budget !== undefined) updates.daily_budget = args.daily_budget;
    if (args.lifetime_budget !== undefined) updates.lifetime_budget = args.lifetime_budget;
    if (args.bid_strategy !== undefined) updates.bid_strategy = args.bid_strategy;
    if (args.start_time !== undefined) updates.start_time = args.start_time;
    if (args.end_time !== undefined) updates.end_time = args.end_time;

    const campaign = await this.service.updateCampaign(args.campaign_id, updates);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'Campaign updated successfully',
              campaign,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async deleteCampaign(args: any) {
    logger.info('delete_campaign tool called', { campaignId: args.campaign_id });

    const result = await this.service.deleteCampaign(args.campaign_id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'Campaign deleted successfully',
              result,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
