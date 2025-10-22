/**
 * Batch Tools
 * MCP tools for batch operations on campaigns, ad sets, and ads
 */

import { CampaignService } from '../services/campaign.service.js';
import { AdSetService } from '../services/adset.service.js';
import { AdService } from '../services/ad.service.js';
import type { MetaAdsConfig } from '../types/config.types.js';
import { logger } from '../utils/logger.js';
import {
  validateStatus,
  validateBudget,
  validateStringArray,
  batchValidate,
} from '../utils/validator.js';

// Tool schemas

// Batch update status schema
export const batchUpdateStatusSchema = {
  name: 'batch_update_status',
  description:
    'Update the status of multiple campaigns, ad sets, or ads at once. Useful for pausing/activating multiple items efficiently.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      object_type: {
        type: 'string',
        enum: ['campaign', 'adset', 'ad'],
        description: 'The type of objects to update',
      },
      object_ids: {
        type: 'array',
        description: 'Array of object IDs to update',
        items: {
          type: 'string',
        },
      },
      status: {
        type: 'string',
        enum: ['ACTIVE', 'PAUSED', 'ARCHIVED'],
        description: 'The new status to set for all objects',
      },
    },
    required: ['object_type', 'object_ids', 'status'],
  },
};

// Batch update budgets schema
export const batchUpdateBudgetsSchema = {
  name: 'batch_update_budgets',
  description:
    'Update budgets for multiple campaigns or ad sets at once. Can set daily or lifetime budgets in a single operation.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      object_type: {
        type: 'string',
        enum: ['campaign', 'adset'],
        description: 'The type of objects to update (campaigns or ad sets)',
      },
      updates: {
        type: 'array',
        description: 'Array of budget update objects',
        items: {
          type: 'object',
          properties: {
            object_id: {
              type: 'string',
              description: 'The campaign or ad set ID',
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
          required: ['object_id'],
        },
      },
    },
    required: ['object_type', 'updates'],
  },
};

// Tool handler class
export class BatchTools {
  private campaignService: CampaignService;
  private adsetService: AdSetService;
  private adService: AdService;

  constructor(config: MetaAdsConfig) {
    this.campaignService = new CampaignService(config);
    this.adsetService = new AdSetService(config);
    this.adService = new AdService(config);
  }

  async batchUpdateStatus(args: any) {
    logger.info('batch_update_status tool called', {
      objectType: args.object_type,
      count: args.object_ids.length,
      status: args.status,
    });

    // Validate inputs
    const validations = [];

    // Validate object IDs array
    validations.push({
      name: 'object_ids',
      result: validateStringArray(args.object_ids, 'object_ids', 1, 50), // Max 50 for safety
    });

    // Validate status
    validations.push({
      name: 'status',
      result: validateStatus(args.status, ['ACTIVE', 'PAUSED', 'ARCHIVED']),
    });

    // Check validation results
    const errors = batchValidate(validations);
    if (errors) {
      throw new Error(`Validation failed:\n${errors.join('\n')}`);
    }

    // Process batch updates
    const results = [];
    const failures = [];

    logger.info('Starting batch status update', {
      objectType: args.object_type,
      totalObjects: args.object_ids.length,
      newStatus: args.status,
    });

    for (let i = 0; i < args.object_ids.length; i++) {
      const objectId = args.object_ids[i];
      try {
        let result;

        switch (args.object_type) {
          case 'campaign':
            result = await this.campaignService.updateCampaign(objectId, {
              status: args.status,
            });
            break;
          case 'adset':
            result = await this.adsetService.updateAdSet(objectId, {
              status: args.status,
            });
            break;
          case 'ad':
            result = await this.adService.updateAd(objectId, {
              status: args.status,
            });
            break;
          default:
            throw new Error(`Invalid object_type: ${args.object_type}`);
        }

        results.push({
          objectId,
          success: true,
          result,
        });

        logger.debug('Batch update succeeded', {
          objectType: args.object_type,
          objectId,
          index: i + 1,
          total: args.object_ids.length,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        failures.push({
          objectId,
          success: false,
          error: errorMessage,
        });

        logger.error('Batch update failed for object', {
          objectType: args.object_type,
          objectId,
          error: errorMessage,
          index: i + 1,
          total: args.object_ids.length,
        });
      }
    }

    const summary = {
      success: failures.length === 0,
      message: `Batch update completed: ${results.length} succeeded, ${failures.length} failed`,
      objectType: args.object_type,
      newStatus: args.status,
      totalRequested: args.object_ids.length,
      succeeded: results.length,
      failed: failures.length,
      successfulUpdates: results,
      failedUpdates: failures,
    };

    logger.info('Batch status update complete', {
      objectType: args.object_type,
      totalRequested: args.object_ids.length,
      succeeded: results.length,
      failed: failures.length,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  }

  async batchUpdateBudgets(args: any) {
    logger.info('batch_update_budgets tool called', {
      objectType: args.object_type,
      count: args.updates.length,
    });

    // Validate inputs
    if (!args.updates || args.updates.length === 0) {
      throw new Error('Updates array cannot be empty');
    }

    if (args.updates.length > 50) {
      throw new Error('Cannot update more than 50 objects at once');
    }

    // Validate each update
    for (let i = 0; i < args.updates.length; i++) {
      const update = args.updates[i];

      // Must have object_id
      if (!update.object_id) {
        throw new Error(`Update at index ${i} missing object_id`);
      }

      // Must have at least one budget parameter
      if (!update.daily_budget && !update.lifetime_budget) {
        throw new Error(`Update at index ${i} must specify daily_budget or lifetime_budget`);
      }

      // Cannot have both
      if (update.daily_budget && update.lifetime_budget) {
        throw new Error(`Update at index ${i} cannot specify both daily_budget and lifetime_budget`);
      }

      // Validate budget values
      if (update.daily_budget !== undefined) {
        const result = validateBudget(update.daily_budget);
        if (!result.valid) {
          throw new Error(`Update at index ${i}: ${result.error}`);
        }
      }

      if (update.lifetime_budget !== undefined) {
        const result = validateBudget(update.lifetime_budget);
        if (!result.valid) {
          throw new Error(`Update at index ${i}: ${result.error}`);
        }
      }
    }

    // Process batch updates
    const results = [];
    const failures = [];

    logger.info('Starting batch budget update', {
      objectType: args.object_type,
      totalObjects: args.updates.length,
    });

    for (let i = 0; i < args.updates.length; i++) {
      const update = args.updates[i];
      try {
        const updateParams: any = {};

        if (update.daily_budget !== undefined) {
          updateParams.daily_budget = update.daily_budget;
          updateParams.lifetime_budget = 0; // Clear lifetime budget
        }

        if (update.lifetime_budget !== undefined) {
          updateParams.lifetime_budget = update.lifetime_budget;
          updateParams.daily_budget = 0; // Clear daily budget
        }

        let result;

        switch (args.object_type) {
          case 'campaign':
            result = await this.campaignService.updateCampaign(update.object_id, updateParams);
            break;
          case 'adset':
            result = await this.adsetService.updateAdSet(update.object_id, updateParams);
            break;
          default:
            throw new Error(`Invalid object_type: ${args.object_type}`);
        }

        results.push({
          objectId: update.object_id,
          success: true,
          dailyBudget: update.daily_budget || null,
          lifetimeBudget: update.lifetime_budget || null,
          result,
        });

        logger.debug('Batch budget update succeeded', {
          objectType: args.object_type,
          objectId: update.object_id,
          index: i + 1,
          total: args.updates.length,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        failures.push({
          objectId: update.object_id,
          success: false,
          error: errorMessage,
        });

        logger.error('Batch budget update failed for object', {
          objectType: args.object_type,
          objectId: update.object_id,
          error: errorMessage,
          index: i + 1,
          total: args.updates.length,
        });
      }
    }

    const summary = {
      success: failures.length === 0,
      message: `Batch budget update completed: ${results.length} succeeded, ${failures.length} failed`,
      objectType: args.object_type,
      totalRequested: args.updates.length,
      succeeded: results.length,
      failed: failures.length,
      successfulUpdates: results,
      failedUpdates: failures,
    };

    logger.info('Batch budget update complete', {
      objectType: args.object_type,
      totalRequested: args.updates.length,
      succeeded: results.length,
      failed: failures.length,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  }
}
