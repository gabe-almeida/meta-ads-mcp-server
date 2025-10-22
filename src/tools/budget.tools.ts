/**
 * Budget Tools
 * MCP tools for campaign and ad set budget management
 */

import { CampaignService } from '../services/campaign.service.js';
import { AdSetService } from '../services/adset.service.js';
import type { MetaAdsConfig } from '../types/config.types.js';
import { logger } from '../utils/logger.js';
import { validateBudget, batchValidate } from '../utils/validator.js';

// Tool schemas

// Update campaign budget schema
export const updateCampaignBudgetSchema = {
  name: 'update_campaign_budget',
  description:
    'Update the budget for a campaign. Can set daily budget or lifetime budget (not both). Budget is specified in cents (e.g., 1000 = $10.00).',
  inputSchema: {
    type: 'object' as const,
    properties: {
      campaign_id: {
        type: 'string',
        description: 'The campaign ID to update',
      },
      daily_budget: {
        type: 'number',
        description: 'New daily budget in cents (mutually exclusive with lifetime_budget)',
      },
      lifetime_budget: {
        type: 'number',
        description: 'New lifetime budget in cents (mutually exclusive with daily_budget)',
      },
    },
    required: ['campaign_id'],
  },
};

// Update ad set budget schema
export const updateAdSetBudgetSchema = {
  name: 'update_adset_budget',
  description:
    'Update the budget for an ad set. Can set daily budget or lifetime budget (not both). Budget is specified in cents.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      adset_id: {
        type: 'string',
        description: 'The ad set ID to update',
      },
      daily_budget: {
        type: 'number',
        description: 'New daily budget in cents (mutually exclusive with lifetime_budget)',
      },
      lifetime_budget: {
        type: 'number',
        description: 'New lifetime budget in cents (mutually exclusive with daily_budget)',
      },
      bid_amount: {
        type: 'number',
        description: 'New bid amount in cents (optional)',
      },
    },
    required: ['adset_id'],
  },
};

// Tool handler class
export class BudgetTools {
  private campaignService: CampaignService;
  private adsetService: AdSetService;

  constructor(config: MetaAdsConfig) {
    this.campaignService = new CampaignService(config);
    this.adsetService = new AdSetService(config);
  }

  async updateCampaignBudget(args: any) {
    logger.info('update_campaign_budget tool called', {
      campaignId: args.campaign_id,
      dailyBudget: args.daily_budget,
      lifetimeBudget: args.lifetime_budget,
    });

    // Validate inputs
    const validations = [];

    // Must specify either daily_budget or lifetime_budget, but not both
    if (!args.daily_budget && !args.lifetime_budget) {
      throw new Error('Must specify either daily_budget or lifetime_budget');
    }

    if (args.daily_budget && args.lifetime_budget) {
      throw new Error('Cannot specify both daily_budget and lifetime_budget');
    }

    // Validate budget values
    if (args.daily_budget !== undefined) {
      validations.push({
        name: 'daily_budget',
        result: validateBudget(args.daily_budget),
      });
    }

    if (args.lifetime_budget !== undefined) {
      validations.push({
        name: 'lifetime_budget',
        result: validateBudget(args.lifetime_budget),
      });
    }

    // Check validation results
    const errors = batchValidate(validations);
    if (errors) {
      throw new Error(`Validation failed:\n${errors.join('\n')}`);
    }

    // Build update object
    const updates: any = {};

    if (args.daily_budget !== undefined) {
      updates.daily_budget = args.daily_budget;
      // Clear lifetime budget when setting daily budget
      updates.lifetime_budget = 0;
    }

    if (args.lifetime_budget !== undefined) {
      updates.lifetime_budget = args.lifetime_budget;
      // Clear daily budget when setting lifetime budget
      updates.daily_budget = 0;
    }

    // Update campaign
    const campaign = await this.campaignService.updateCampaign(args.campaign_id, updates);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'Campaign budget updated successfully',
              campaignId: args.campaign_id,
              dailyBudget: args.daily_budget || null,
              lifetimeBudget: args.lifetime_budget || null,
              campaign,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async updateAdSetBudget(args: any) {
    logger.info('update_adset_budget tool called', {
      adsetId: args.adset_id,
      dailyBudget: args.daily_budget,
      lifetimeBudget: args.lifetime_budget,
      bidAmount: args.bid_amount,
    });

    // Validate inputs
    const validations = [];

    // Check that at least one budget parameter is provided
    if (!args.daily_budget && !args.lifetime_budget && !args.bid_amount) {
      throw new Error('Must specify at least one of: daily_budget, lifetime_budget, or bid_amount');
    }

    // Cannot specify both daily and lifetime budget
    if (args.daily_budget && args.lifetime_budget) {
      throw new Error('Cannot specify both daily_budget and lifetime_budget');
    }

    // Validate budget values
    if (args.daily_budget !== undefined) {
      validations.push({
        name: 'daily_budget',
        result: validateBudget(args.daily_budget),
      });
    }

    if (args.lifetime_budget !== undefined) {
      validations.push({
        name: 'lifetime_budget',
        result: validateBudget(args.lifetime_budget),
      });
    }

    if (args.bid_amount !== undefined) {
      validations.push({
        name: 'bid_amount',
        result: validateBudget(args.bid_amount),
      });
    }

    // Check validation results
    const errors = batchValidate(validations);
    if (errors) {
      throw new Error(`Validation failed:\n${errors.join('\n')}`);
    }

    // Build update object
    const updates: any = {};

    if (args.daily_budget !== undefined) {
      updates.daily_budget = args.daily_budget;
      // Clear lifetime budget when setting daily budget
      updates.lifetime_budget = 0;
    }

    if (args.lifetime_budget !== undefined) {
      updates.lifetime_budget = args.lifetime_budget;
      // Clear daily budget when setting lifetime budget
      updates.daily_budget = 0;
    }

    if (args.bid_amount !== undefined) {
      updates.bid_amount = args.bid_amount;
    }

    // Update ad set
    const adset = await this.adsetService.updateAdSet(args.adset_id, updates);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'Ad set budget updated successfully',
              adsetId: args.adset_id,
              dailyBudget: args.daily_budget || null,
              lifetimeBudget: args.lifetime_budget || null,
              bidAmount: args.bid_amount || null,
              adset,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
