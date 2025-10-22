/**
 * Ad Tools
 * MCP tools for ad management operations
 */

import { AdService } from '../services/ad.service.js';
import type { MetaAdsConfig } from '../types/config.types.js';
import { logger } from '../utils/logger.js';

// List ads schema
export const listAdsSchema = {
  name: 'list_ads',
  description:
    'List all ads for an ad set or account. Returns ad details including name, status, creative ID, and campaign information.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      parent_id: {
        type: 'string',
        description: 'The ad set ID or account ID (with "act_" prefix)',
      },
      from_adset: {
        type: 'boolean',
        description: 'Whether parent_id is an ad set (true) or account (false). Default: true',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of ads to return (default: 100)',
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
        description: 'Filter ads by status (optional)',
      },
    },
    required: ['parent_id'],
  },
};

// Get ad schema
export const getAdSchema = {
  name: 'get_ad',
  description:
    'Get detailed information about a specific ad by ID. Returns all ad properties including creative details, status, and associated campaign/ad set.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      ad_id: {
        type: 'string',
        description: 'The ad ID',
      },
      fields: {
        type: 'array',
        description: 'Specific fields to return (optional)',
        items: {
          type: 'string',
        },
      },
    },
    required: ['ad_id'],
  },
};

// Create ad schema
export const createAdSchema = {
  name: 'create_ad',
  description:
    'Create a new ad. Requires ad set ID, ad name, and creative ID. The creative must already exist in your ad account.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      account_id: {
        type: 'string',
        description: 'The Meta Ads account ID (with or without "act_" prefix)',
      },
      adset_id: {
        type: 'string',
        description: 'The ad set ID this ad belongs to',
      },
      name: {
        type: 'string',
        description: 'Ad name',
      },
      creative_id: {
        type: 'string',
        description: 'The creative ID to use for this ad',
      },
      status: {
        type: 'string',
        enum: ['ACTIVE', 'PAUSED'],
        description: 'Ad status (default: PAUSED)',
      },
    },
    required: ['account_id', 'adset_id', 'name', 'creative_id'],
  },
};

// Update ad schema
export const updateAdSchema = {
  name: 'update_ad',
  description:
    'Update an existing ad. Can modify name, status, and creative. Note: Some properties may require the ad to be paused first.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      ad_id: {
        type: 'string',
        description: 'The ad ID to update',
      },
      name: {
        type: 'string',
        description: 'New ad name (optional)',
      },
      status: {
        type: 'string',
        enum: ['ACTIVE', 'PAUSED', 'ARCHIVED'],
        description: 'New ad status (optional)',
      },
      creative_id: {
        type: 'string',
        description: 'New creative ID (optional, may require ad to be paused)',
      },
    },
    required: ['ad_id'],
  },
};

// Delete ad schema
export const deleteAdSchema = {
  name: 'delete_ad',
  description:
    'Delete (archive) an ad. This action cannot be undone. The ad will be permanently archived.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      ad_id: {
        type: 'string',
        description: 'The ad ID to delete',
      },
    },
    required: ['ad_id'],
  },
};

// Tool handler functions
export class AdTools {
  private service: AdService;

  constructor(config: MetaAdsConfig) {
    this.service = new AdService(config);
  }

  async listAds(args: any) {
    logger.info('list_ads tool called', {
      parentId: args.parent_id,
      fromAdSet: args.from_adset,
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

    const fromAdSet = args.from_adset !== false;
    const ads = await this.service.getAds(args.parent_id, options, fromAdSet);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              count: ads.length,
              ads,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async getAd(args: any) {
    logger.info('get_ad tool called', { adId: args.ad_id });

    const ad = await this.service.getAd(args.ad_id, args.fields);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              ad,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async createAd(args: any) {
    logger.info('create_ad tool called', {
      accountId: args.account_id,
      adsetId: args.adset_id,
      name: args.name,
      creativeId: args.creative_id,
    });

    const data: any = {
      adset_id: args.adset_id,
      name: args.name,
      creative_id: args.creative_id,
    };

    if (args.status) data.status = args.status;

    const ad = await this.service.createAd(args.account_id, data);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'Ad created successfully',
              ad,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async updateAd(args: any) {
    logger.info('update_ad tool called', { adId: args.ad_id });

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.status !== undefined) updates.status = args.status;
    if (args.creative_id !== undefined) updates.creative_id = args.creative_id;

    const ad = await this.service.updateAd(args.ad_id, updates);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'Ad updated successfully',
              ad,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async deleteAd(args: any) {
    logger.info('delete_ad tool called', { adId: args.ad_id });

    const result = await this.service.deleteAd(args.ad_id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'Ad deleted successfully',
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
