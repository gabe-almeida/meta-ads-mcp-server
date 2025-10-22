/**
 * Audience Tools
 * MCP tools for audience management operations
 */

import { AudienceService } from '../services/audience.service.js';
import type { MetaAdsConfig } from '../types/config.types.js';
import { logger } from '../utils/logger.js';

// Tool schemas

// List audiences schema
export const listAudiencesSchema = {
  name: 'list_audiences',
  description:
    'List all custom audiences for a Meta Ads account. Returns audience details including name, size, type, and status.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      account_id: {
        type: 'string',
        description: 'The Meta Ads account ID (with or without "act_" prefix)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of audiences to return (optional)',
      },
    },
    required: ['account_id'],
  },
};

// Get audience schema
export const getAudienceSchema = {
  name: 'get_audience',
  description:
    'Get detailed information about a specific custom audience by ID. Returns all audience properties including size, delivery status, and configuration.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      audience_id: {
        type: 'string',
        description: 'The custom audience ID',
      },
    },
    required: ['audience_id'],
  },
};

// Create custom audience schema
export const createCustomAudienceSchema = {
  name: 'create_custom_audience',
  description:
    'Create a new custom audience for uploading customer lists. Use add_users_to_audience to populate it with customer data.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      account_id: {
        type: 'string',
        description: 'The Meta Ads account ID (with or without "act_" prefix)',
      },
      name: {
        type: 'string',
        description: 'Audience name',
      },
      description: {
        type: 'string',
        description: 'Audience description (optional)',
      },
      subtype: {
        type: 'string',
        enum: ['CUSTOM', 'WEBSITE', 'APP', 'OFFLINE_CONVERSION', 'ENGAGEMENT'],
        description: 'Audience subtype (default: CUSTOM)',
      },
    },
    required: ['account_id', 'name'],
  },
};

// Create lookalike audience schema
export const createLookalikeAudienceSchema = {
  name: 'create_lookalike_audience',
  description:
    'Create a lookalike audience based on an existing custom audience. Meta will find users similar to your source audience.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      account_id: {
        type: 'string',
        description: 'The Meta Ads account ID (with or without "act_" prefix)',
      },
      name: {
        type: 'string',
        description: 'Lookalike audience name',
      },
      origin_audience_id: {
        type: 'string',
        description: 'The source custom audience ID to base the lookalike on',
      },
      country: {
        type: 'string',
        description: 'Two-letter country code (e.g., "US", "GB")',
      },
      ratio: {
        type: 'number',
        description: 'Audience size as ratio 0.01-0.20 (1%-20% of country population, default: 0.01)',
      },
      description: {
        type: 'string',
        description: 'Audience description (optional)',
      },
    },
    required: ['account_id', 'name', 'origin_audience_id', 'country'],
  },
};

// Create saved audience schema
export const createSavedAudienceSchema = {
  name: 'create_saved_audience',
  description:
    'Create a saved audience with specific targeting criteria (demographics, interests, behaviors). Useful for reusing targeting across campaigns.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      account_id: {
        type: 'string',
        description: 'The Meta Ads account ID (with or without "act_" prefix)',
      },
      name: {
        type: 'string',
        description: 'Saved audience name',
      },
      targeting: {
        type: 'object',
        description: 'Targeting specification object with demographics, interests, behaviors, etc.',
      },
      description: {
        type: 'string',
        description: 'Audience description (optional)',
      },
    },
    required: ['account_id', 'name', 'targeting'],
  },
};

// Add users to audience schema
export const addUsersToAudienceSchema = {
  name: 'add_users_to_audience',
  description:
    'Add users to a custom audience. Provide user data (email, phone, etc.) and it will be automatically hashed for privacy. Supports batch uploads.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      audience_id: {
        type: 'string',
        description: 'The custom audience ID to add users to',
      },
      users: {
        type: 'array',
        description: 'Array of user data objects. Each user should have at least one identifier (email, phone, etc.)',
        items: {
          type: 'object',
          properties: {
            email: { type: 'string', description: 'User email address' },
            phone: { type: 'string', description: 'User phone number (E.164 format: +1234567890)' },
            firstName: { type: 'string', description: 'User first name' },
            lastName: { type: 'string', description: 'User last name' },
            city: { type: 'string', description: 'User city' },
            state: { type: 'string', description: 'User state/province code' },
            zip: { type: 'string', description: 'User ZIP/postal code' },
            country: { type: 'string', description: 'User country code (2 letters, e.g., "us")' },
            externalId: { type: 'string', description: 'Your internal user ID' },
          },
        },
      },
      schema: {
        type: 'array',
        description: 'Custom schema array (optional). If not provided, will auto-detect from user data.',
        items: { type: 'string' },
      },
    },
    required: ['audience_id', 'users'],
  },
};

// Remove users from audience schema
export const removeUsersFromAudienceSchema = {
  name: 'remove_users_from_audience',
  description:
    'Remove users from a custom audience. Provide the same user identifiers used when adding them.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      audience_id: {
        type: 'string',
        description: 'The custom audience ID to remove users from',
      },
      users: {
        type: 'array',
        description: 'Array of user data objects matching the users to remove',
        items: {
          type: 'object',
          properties: {
            email: { type: 'string', description: 'User email address' },
            phone: { type: 'string', description: 'User phone number (E.164 format)' },
            firstName: { type: 'string', description: 'User first name' },
            lastName: { type: 'string', description: 'User last name' },
            city: { type: 'string', description: 'User city' },
            state: { type: 'string', description: 'User state/province code' },
            zip: { type: 'string', description: 'User ZIP/postal code' },
            country: { type: 'string', description: 'User country code' },
            externalId: { type: 'string', description: 'Your internal user ID' },
          },
        },
      },
      schema: {
        type: 'array',
        description: 'Custom schema array (optional)',
        items: { type: 'string' },
      },
    },
    required: ['audience_id', 'users'],
  },
};

// Tool handler class
export class AudienceTools {
  private service: AudienceService;

  constructor(config: MetaAdsConfig) {
    this.service = new AudienceService(config);
  }

  async listAudiences(args: any) {
    logger.info('list_audiences tool called', {
      accountId: args.account_id,
      limit: args.limit,
    });

    const audiences = await this.service.getAudiences(args.account_id, args.limit);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              count: audiences.length,
              audiences,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async getAudience(args: any) {
    logger.info('get_audience tool called', { audienceId: args.audience_id });

    const audience = await this.service.getAudience(args.audience_id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              audience,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async createCustomAudience(args: any) {
    logger.info('create_custom_audience tool called', {
      accountId: args.account_id,
      name: args.name,
      subtype: args.subtype,
    });

    const audience = await this.service.createCustomAudience(
      args.account_id,
      args.name,
      args.description,
      args.subtype || 'CUSTOM'
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'Custom audience created successfully',
              audience,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async createLookalikeAudience(args: any) {
    logger.info('create_lookalike_audience tool called', {
      accountId: args.account_id,
      name: args.name,
      originAudienceId: args.origin_audience_id,
      country: args.country,
      ratio: args.ratio,
    });

    const audience = await this.service.createLookalikeAudience(
      args.account_id,
      args.name,
      args.origin_audience_id,
      args.country,
      args.ratio || 0.01,
      args.description
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'Lookalike audience created successfully',
              audience,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async createSavedAudience(args: any) {
    logger.info('create_saved_audience tool called', {
      accountId: args.account_id,
      name: args.name,
    });

    const audience = await this.service.createSavedAudience(
      args.account_id,
      args.name,
      args.targeting,
      args.description
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'Saved audience created successfully',
              audience,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async addUsersToAudience(args: any) {
    logger.info('add_users_to_audience tool called', {
      audienceId: args.audience_id,
      userCount: args.users.length,
    });

    const result = await this.service.addUsersToAudience(
      args.audience_id,
      args.users,
      args.schema
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'Users added to audience successfully',
              numReceived: result.num_received,
              numInvalidEntries: result.num_invalid_entries,
              result,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async removeUsersFromAudience(args: any) {
    logger.info('remove_users_from_audience tool called', {
      audienceId: args.audience_id,
      userCount: args.users.length,
    });

    const result = await this.service.removeUsersFromAudience(
      args.audience_id,
      args.users,
      args.schema
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'Users removed from audience successfully',
              numReceived: result.num_received,
              numInvalidEntries: result.num_invalid_entries,
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
