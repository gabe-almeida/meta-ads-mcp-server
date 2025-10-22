/**
 * Account Tools
 * MCP tools for account, page, and Instagram account management
 */

import * as adsSdk from 'facebook-nodejs-business-sdk';
import type { MetaAdsConfig } from '../types/config.types.js';
import { logger } from '../utils/logger.js';
import { ExponentialBackoff } from '../utils/retry.js';
import { handleMetaApiError } from '../utils/error-handler.js';
import { MetaAdsService } from '../services/meta-ads.service.js';

const { AdAccount } = adsSdk;

// Tool schemas

// List ad accounts schema
export const listAdAccountsSchema = {
  name: 'list_ad_accounts',
  description:
    'List all Meta ad accounts accessible by the current user. Returns account details including ID, name, currency, and status.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of ad accounts to return (optional)',
      },
    },
  },
};

// Get ad account schema
export const getAdAccountSchema = {
  name: 'get_ad_account',
  description:
    'Get detailed information about a specific ad account. Returns account settings, spending limits, timezone, and capabilities.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      account_id: {
        type: 'string',
        description: 'The Meta Ads account ID (with or without "act_" prefix)',
      },
    },
    required: ['account_id'],
  },
};

// List pages schema
export const listPagesSchema = {
  name: 'list_pages',
  description:
    'List all Facebook Pages accessible by the current user. Pages are needed for creating ads and managing business assets.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of pages to return (optional)',
      },
    },
  },
};

// List Instagram accounts schema
export const listInstagramAccountsSchema = {
  name: 'list_instagram_accounts',
  description:
    'List all Instagram business accounts accessible through connected Facebook Pages. Returns Instagram account details for ad creation.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      account_id: {
        type: 'string',
        description: 'The Meta Ads account ID (with or without "act_" prefix)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of Instagram accounts to return (optional)',
      },
    },
    required: ['account_id'],
  },
};

// Account service for these operations
class AccountManagementService extends MetaAdsService {
  private readonly backoff: ExponentialBackoff;

  constructor(config: MetaAdsConfig) {
    super(config);
    this.backoff = new ExponentialBackoff({
      baseDelay: 1000,
      maxDelay: 32000,
      maxRetries: 5,
    });
  }

  /**
   * Get all ad accounts for current user
   */
  async getAdAccounts(limit?: number): Promise<any[]> {
    return this.backoff.execute(async () => {
      try {
        logger.info('Fetching ad accounts', { limit });

        // Use API call to get user's ad accounts
        const fields = [
          'id',
          'account_id',
          'name',
          'currency',
          'account_status',
          'timezone_name',
          'timezone_offset_hours_utc',
          'business',
          'created_time',
          'amount_spent',
          'balance',
          'spend_cap',
        ];

        const params: any = { fields: fields.join(',') };
        if (limit) {
          params.limit = limit;
        }

        const response: any = await this.api.call('GET', '/me/adaccounts', params);
        const accounts = response?.data || [];

        logger.info('Ad accounts fetched successfully', {
          count: accounts.length,
        });

        return accounts;
      } catch (error) {
        throw handleMetaApiError(error);
      }
    }, { operation: 'getAdAccounts' });
  }

  /**
   * Get a specific ad account
   */
  async getAdAccount(accountId: string): Promise<any> {
    const normalizedAccountId = this.normalizeAccountId(accountId);

    return this.backoff.execute(async () => {
      try {
        logger.info('Fetching ad account', { accountId: normalizedAccountId });

        const fields = [
          'id',
          'account_id',
          'name',
          'currency',
          'account_status',
          'timezone_name',
          'timezone_offset_hours_utc',
          'business',
          'business_name',
          'created_time',
          'amount_spent',
          'balance',
          'spend_cap',
          'min_campaign_group_spend_cap',
          'min_daily_budget',
          'funding_source',
          'capabilities',
          'age',
        ];

        const account = new AdAccount(normalizedAccountId);
        const result = await account.get(fields);

        logger.info('Ad account fetched successfully', {
          accountId: normalizedAccountId,
          name: result.name,
        });

        return result;
      } catch (error) {
        throw handleMetaApiError(error);
      }
    }, { operation: 'getAdAccount', accountId: normalizedAccountId });
  }

  /**
   * Get all pages for current user
   */
  async getPages(limit?: number): Promise<any[]> {
    return this.backoff.execute(async () => {
      try {
        logger.info('Fetching pages', { limit });

        const fields = [
          'id',
          'name',
          'access_token',
          'category',
          'category_list',
          'tasks',
          'instagram_business_account',
        ];

        const params: any = { fields: fields.join(',') };
        if (limit) {
          params.limit = limit;
        }

        const response: any = await this.api.call('GET', '/me/accounts', params);
        const pages = response?.data || [];

        logger.info('Pages fetched successfully', {
          count: pages.length,
        });

        return pages;
      } catch (error) {
        throw handleMetaApiError(error);
      }
    }, { operation: 'getPages' });
  }

  /**
   * Get Instagram accounts for an ad account
   */
  async getInstagramAccounts(accountId: string, limit?: number): Promise<any[]> {
    const normalizedAccountId = this.normalizeAccountId(accountId);

    return this.backoff.execute(async () => {
      try {
        logger.info('Fetching Instagram accounts', {
          accountId: normalizedAccountId,
          limit,
        });

        const fields = [
          'id',
          'username',
          'name',
          'profile_pic',
          'followers_count',
          'follows_count',
          'media_count',
        ];

        const params: any = { fields: fields.join(',') };
        if (limit) {
          params.limit = limit;
        }

        const response: any = await this.api.call('GET', `/${normalizedAccountId}/instagram_accounts`, params);
        const igAccounts = response?.data || [];

        logger.info('Instagram accounts fetched successfully', {
          accountId: normalizedAccountId,
          count: igAccounts.length,
        });

        return igAccounts;
      } catch (error) {
        throw handleMetaApiError(error);
      }
    }, { operation: 'getInstagramAccounts', accountId: normalizedAccountId });
  }
}

// Tool handler class
export class AccountTools {
  private service: AccountManagementService;

  constructor(config: MetaAdsConfig) {
    this.service = new AccountManagementService(config);
  }

  async listAdAccounts(args: any) {
    logger.info('list_ad_accounts tool called', { limit: args.limit });

    const accounts = await this.service.getAdAccounts(args.limit);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              count: accounts.length,
              adAccounts: accounts,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async getAdAccount(args: any) {
    logger.info('get_ad_account tool called', { accountId: args.account_id });

    const account = await this.service.getAdAccount(args.account_id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              adAccount: account,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async listPages(args: any) {
    logger.info('list_pages tool called', { limit: args.limit });

    const pages = await this.service.getPages(args.limit);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              count: pages.length,
              pages,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async listInstagramAccounts(args: any) {
    logger.info('list_instagram_accounts tool called', {
      accountId: args.account_id,
      limit: args.limit,
    });

    const igAccounts = await this.service.getInstagramAccounts(args.account_id, args.limit);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              count: igAccounts.length,
              instagramAccounts: igAccounts,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
