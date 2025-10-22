/**
 * AdSet Tools
 * MCP tools for ad set management operations
 */

import { AdSetService } from '../services/adset.service.js';
import type { MetaAdsConfig } from '../types/config.types.js';
import { logger } from '../utils/logger.js';

// List ad sets schema
export const listAdSetsSchema = {
  name: 'list_adsets',
  description:
    'List all ad sets for a campaign or account. Returns ad set details including name, status, budget, and optimization settings.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      parent_id: {
        type: 'string',
        description: 'The campaign ID or account ID (with "act_" prefix)',
      },
      from_campaign: {
        type: 'boolean',
        description: 'Whether parent_id is a campaign (true) or account (false). Default: true',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of ad sets to return (default: 100)',
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
        description: 'Filter ad sets by status (optional)',
      },
    },
    required: ['parent_id'],
  },
};

// Get ad set schema
export const getAdSetSchema = {
  name: 'get_adset',
  description:
    'Get detailed information about a specific ad set by ID. Returns all ad set properties including targeting, budget, and optimization settings.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      adset_id: {
        type: 'string',
        description: 'The ad set ID',
      },
      fields: {
        type: 'array',
        description: 'Specific fields to return (optional)',
        items: {
          type: 'string',
        },
      },
    },
    required: ['adset_id'],
  },
};

// Create ad set schema
export const createAdSetSchema = {
  name: 'create_adset',
  description:
    'Create a new ad set. Requires campaign_id, name, optimization_goal, targeting, and either daily_budget or lifetime_budget.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      account_id: {
        type: 'string',
        description: 'The Meta Ads account ID (with or without "act_" prefix)',
      },
      campaign_id: {
        type: 'string',
        description: 'The campaign ID this ad set belongs to',
      },
      name: {
        type: 'string',
        description: 'Ad set name',
      },
      optimization_goal: {
        type: 'string',
        enum: [
          'REACH',
          'IMPRESSIONS',
          'LINK_CLICKS',
          'LANDING_PAGE_VIEWS',
          'POST_ENGAGEMENT',
          'VIDEO_VIEWS',
          'LEAD_GENERATION',
          'OFFSITE_CONVERSIONS',
          'VALUE',
          'APP_INSTALLS',
          'CONVERSATIONS',
        ],
        description: 'Optimization goal for the ad set',
      },
      billing_event: {
        type: 'string',
        enum: ['IMPRESSIONS', 'LINK_CLICKS', 'POST_ENGAGEMENT'],
        description: 'Billing event (optional)',
      },
      bid_amount: {
        type: 'number',
        description: 'Bid amount in cents (optional)',
      },
      daily_budget: {
        type: 'number',
        description: 'Daily budget in cents (mutually exclusive with lifetime_budget)',
      },
      lifetime_budget: {
        type: 'number',
        description: 'Lifetime budget in cents (mutually exclusive with daily_budget)',
      },
      status: {
        type: 'string',
        enum: ['ACTIVE', 'PAUSED'],
        description: 'Ad set status (default: PAUSED)',
      },
      start_time: {
        type: 'string',
        description: 'Start time (ISO 8601 format, optional)',
      },
      end_time: {
        type: 'string',
        description: 'End time (ISO 8601 format, optional)',
      },
      targeting: {
        type: 'object',
        description: 'Targeting specification',
        properties: {
          geo_locations: {
            type: 'object',
            description: 'Geographic targeting',
            properties: {
              countries: {
                type: 'array',
                items: { type: 'string' },
                description: 'Country codes (e.g., ["US", "CA"])',
              },
              cities: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    key: { type: 'string' },
                    radius: { type: 'number' },
                    distance_unit: { type: 'string', enum: ['mile', 'kilometer'] },
                  },
                },
              },
              regions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    key: { type: 'string' },
                  },
                },
              },
            },
          },
          age_min: {
            type: 'number',
            description: 'Minimum age (18-65)',
          },
          age_max: {
            type: 'number',
            description: 'Maximum age (18-65)',
          },
          genders: {
            type: 'array',
            items: { type: 'number' },
            description: 'Gender targeting (1=male, 2=female)',
          },
          publisher_platforms: {
            type: 'array',
            items: { type: 'string', enum: ['facebook', 'instagram', 'audience_network', 'messenger'] },
            description: 'Platforms to show ads on',
          },
          device_platforms: {
            type: 'array',
            items: { type: 'string', enum: ['mobile', 'desktop'] },
            description: 'Device platforms',
          },
          interests: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
            description: 'Interest targeting',
          },
          behaviors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
            description: 'Behavior targeting',
          },
          custom_audiences: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
              },
            },
            description: 'Custom audience IDs to include',
          },
        },
      },
    },
    required: ['account_id', 'campaign_id', 'name', 'optimization_goal', 'targeting'],
  },
};

// Update ad set schema
export const updateAdSetSchema = {
  name: 'update_adset',
  description:
    'Update an existing ad set. Can modify name, status, budget, targeting, optimization settings, and other properties.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      adset_id: {
        type: 'string',
        description: 'The ad set ID to update',
      },
      name: {
        type: 'string',
        description: 'New ad set name (optional)',
      },
      status: {
        type: 'string',
        enum: ['ACTIVE', 'PAUSED', 'ARCHIVED'],
        description: 'New status (optional)',
      },
      daily_budget: {
        type: 'number',
        description: 'New daily budget in cents (optional)',
      },
      lifetime_budget: {
        type: 'number',
        description: 'New lifetime budget in cents (optional)',
      },
      bid_amount: {
        type: 'number',
        description: 'New bid amount in cents (optional)',
      },
      optimization_goal: {
        type: 'string',
        enum: [
          'REACH',
          'IMPRESSIONS',
          'LINK_CLICKS',
          'LANDING_PAGE_VIEWS',
          'POST_ENGAGEMENT',
          'VIDEO_VIEWS',
          'LEAD_GENERATION',
          'OFFSITE_CONVERSIONS',
          'VALUE',
          'APP_INSTALLS',
          'CONVERSATIONS',
        ],
        description: 'New optimization goal (optional)',
      },
      targeting: {
        type: 'object',
        description: 'New targeting specification (optional)',
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
    required: ['adset_id'],
  },
};

// Delete ad set schema
export const deleteAdSetSchema = {
  name: 'delete_adset',
  description:
    'Delete (archive) an ad set. This action cannot be undone. All ads in the ad set will also be archived.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      adset_id: {
        type: 'string',
        description: 'The ad set ID to delete',
      },
    },
    required: ['adset_id'],
  },
};

// Duplicate ad set schema
export const duplicateAdSetSchema = {
  name: 'duplicate_adset',
  description:
    'Duplicate an existing ad set with all its settings. Optionally provide a new name and status.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      adset_id: {
        type: 'string',
        description: 'The ad set ID to duplicate',
      },
      new_name: {
        type: 'string',
        description: 'Name for the duplicated ad set (optional, defaults to "[Original Name] (Copy)")',
      },
      status: {
        type: 'string',
        enum: ['ACTIVE', 'PAUSED'],
        description: 'Status for the duplicated ad set (optional)',
      },
    },
    required: ['adset_id'],
  },
};

// Tool handler functions
export class AdSetTools {
  private service: AdSetService;

  constructor(config: MetaAdsConfig) {
    this.service = new AdSetService(config);
  }

  async listAdSets(args: any) {
    logger.info('list_adsets tool called', {
      parentId: args.parent_id,
      fromCampaign: args.from_campaign,
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

    const fromCampaign = args.from_campaign !== false;
    const adSets = await this.service.getAdSets(args.parent_id, options, fromCampaign);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              count: adSets.length,
              adSets,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async getAdSet(args: any) {
    logger.info('get_adset tool called', { adSetId: args.adset_id });

    const adSet = await this.service.getAdSet(args.adset_id, args.fields);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              adSet,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async createAdSet(args: any) {
    logger.info('create_adset tool called', {
      accountId: args.account_id,
      campaignId: args.campaign_id,
      name: args.name,
    });

    const data: any = {
      campaign_id: args.campaign_id,
      name: args.name,
      optimization_goal: args.optimization_goal,
      targeting: args.targeting,
    };

    if (args.status) data.status = args.status;
    if (args.daily_budget) data.daily_budget = args.daily_budget;
    if (args.lifetime_budget) data.lifetime_budget = args.lifetime_budget;
    if (args.bid_amount) data.bid_amount = args.bid_amount;
    if (args.billing_event) data.billing_event = args.billing_event;
    if (args.start_time) data.start_time = args.start_time;
    if (args.end_time) data.end_time = args.end_time;

    const adSet = await this.service.createAdSet(args.account_id, data);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'Ad set created successfully',
              adSet,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async updateAdSet(args: any) {
    logger.info('update_adset tool called', { adSetId: args.adset_id });

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.status !== undefined) updates.status = args.status;
    if (args.daily_budget !== undefined) updates.daily_budget = args.daily_budget;
    if (args.lifetime_budget !== undefined) updates.lifetime_budget = args.lifetime_budget;
    if (args.bid_amount !== undefined) updates.bid_amount = args.bid_amount;
    if (args.optimization_goal !== undefined) updates.optimization_goal = args.optimization_goal;
    if (args.targeting !== undefined) updates.targeting = args.targeting;
    if (args.start_time !== undefined) updates.start_time = args.start_time;
    if (args.end_time !== undefined) updates.end_time = args.end_time;

    const adSet = await this.service.updateAdSet(args.adset_id, updates);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'Ad set updated successfully',
              adSet,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async deleteAdSet(args: any) {
    logger.info('delete_adset tool called', { adSetId: args.adset_id });

    const result = await this.service.deleteAdSet(args.adset_id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'Ad set deleted successfully',
              result,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async duplicateAdSet(args: any) {
    logger.info('duplicate_adset tool called', {
      adSetId: args.adset_id,
      newName: args.new_name,
    });

    const adSet = await this.service.duplicateAdSet(
      args.adset_id,
      args.new_name,
      args.status
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'Ad set duplicated successfully',
              adSet,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
