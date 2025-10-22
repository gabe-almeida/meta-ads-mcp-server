/**
 * Audience Service
 * Handles Custom Audiences, Lookalike Audiences, and Saved Audiences
 */

import * as adsSdk from 'facebook-nodejs-business-sdk';
import { MetaAdsService } from './meta-ads.service.js';
import type { MetaAdsConfig } from '../types/config.types.js';
import { logger } from '../utils/logger.js';
import { ExponentialBackoff } from '../utils/retry.js';
import { handleMetaApiError } from '../utils/error-handler.js';
import { hashUserDataBatch, type UserData } from '../utils/hasher.js';

const { CustomAudience } = adsSdk;

/**
 * Audience Service
 * Provides methods for managing Meta advertising audiences
 */
export class AudienceService extends MetaAdsService {
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
   * Get all custom audiences for an account
   */
  async getAudiences(accountId: string, limit?: number): Promise<any[]> {
    const normalizedAccountId = this.normalizeAccountId(accountId);

    return this.backoff.execute(async () => {
      try {
        logger.info('Fetching custom audiences', { accountId: normalizedAccountId, limit });

        const account = new this.AdAccount(normalizedAccountId);
        const fields = [
          'id',
          'name',
          'description',
          'subtype',
          'approximate_count',
          'customer_file_source',
          'delivery_status',
          'operation_status',
          'permission_for_actions',
          'time_created',
          'time_updated',
        ];

        const params: any = { fields };
        if (limit) {
          params.limit = limit;
        }

        const cursor = await account.getCustomAudiences(fields, params);

        // If limit specified, use limited pagination
        const audiences = limit
          ? await this.paginateWithLimit(cursor, limit)
          : await this.paginateAll(cursor);

        logger.info('Custom audiences fetched successfully', {
          accountId: normalizedAccountId,
          count: audiences.length,
        });

        return audiences;
      } catch (error) {
        throw handleMetaApiError(error);
      }
    }, { operation: 'getAudiences', accountId: normalizedAccountId });
  }

  /**
   * Get a specific custom audience by ID
   */
  async getAudience(audienceId: string): Promise<any> {
    return this.backoff.execute(async () => {
      try {
        logger.info('Fetching custom audience', { audienceId });

        const audience = new CustomAudience(audienceId);
        const fields = [
          'id',
          'name',
          'description',
          'subtype',
          'approximate_count',
          'customer_file_source',
          'delivery_status',
          'operation_status',
          'permission_for_actions',
          'time_created',
          'time_updated',
          'lookalike_spec',
        ];

        const result = await audience.read(fields);

        logger.info('Custom audience fetched successfully', {
          audienceId,
          name: result.name,
        });

        return result;
      } catch (error) {
        throw handleMetaApiError(error);
      }
    }, { operation: 'getAudience', audienceId });
  }

  /**
   * Create a custom audience
   */
  async createCustomAudience(
    accountId: string,
    name: string,
    description?: string,
    subtype: string = 'CUSTOM'
  ): Promise<any> {
    const normalizedAccountId = this.normalizeAccountId(accountId);

    return this.backoff.execute(async () => {
      try {
        logger.info('Creating custom audience', {
          accountId: normalizedAccountId,
          name,
          subtype,
        });

        const account = new this.AdAccount(normalizedAccountId);

        const params: any = {
          name,
          subtype,
        };

        if (description) {
          params.description = description;
        }

        // For customer file custom audiences
        if (subtype === 'CUSTOM') {
          params.customer_file_source = 'USER_PROVIDED_ONLY';
        }

        const result = await account.createCustomAudience([], params);

        logger.info('Custom audience created successfully', {
          accountId: normalizedAccountId,
          audienceId: result.id,
          name,
        });

        return result;
      } catch (error) {
        throw handleMetaApiError(error);
      }
    }, { operation: 'createCustomAudience', accountId: normalizedAccountId, name });
  }

  /**
   * Create a lookalike audience
   */
  async createLookalikeAudience(
    accountId: string,
    name: string,
    originAudienceId: string,
    country: string,
    ratio: number = 0.01,
    description?: string
  ): Promise<any> {
    const normalizedAccountId = this.normalizeAccountId(accountId);

    return this.backoff.execute(async () => {
      try {
        logger.info('Creating lookalike audience', {
          accountId: normalizedAccountId,
          name,
          originAudienceId,
          country,
          ratio,
        });

        const account = new this.AdAccount(normalizedAccountId);

        const params: any = {
          name,
          subtype: 'LOOKALIKE',
          lookalike_spec: JSON.stringify({
            origin: [
              {
                id: originAudienceId,
                type: 'custom_audience',
              },
            ],
            starting_ratio: 0,
            ratio,
            country,
          }),
        };

        if (description) {
          params.description = description;
        }

        const result = await account.createCustomAudience([], params);

        logger.info('Lookalike audience created successfully', {
          accountId: normalizedAccountId,
          audienceId: result.id,
          name,
          ratio,
        });

        return result;
      } catch (error) {
        throw handleMetaApiError(error);
      }
    }, {
      operation: 'createLookalikeAudience',
      accountId: normalizedAccountId,
      name,
      originAudienceId,
    });
  }

  /**
   * Create a saved audience (targeting spec)
   */
  async createSavedAudience(
    accountId: string,
    name: string,
    targetingSpec: any,
    description?: string
  ): Promise<any> {
    const normalizedAccountId = this.normalizeAccountId(accountId);

    return this.backoff.execute(async () => {
      try {
        logger.info('Creating saved audience', {
          accountId: normalizedAccountId,
          name,
        });

        const account = new this.AdAccount(normalizedAccountId);

        const params: any = {
          name,
          targeting: targetingSpec,
        };

        if (description) {
          params.description = description;
        }

        const result = await account.createSavedAudience([], params);

        logger.info('Saved audience created successfully', {
          accountId: normalizedAccountId,
          audienceId: result.id,
          name,
        });

        return result;
      } catch (error) {
        throw handleMetaApiError(error);
      }
    }, { operation: 'createSavedAudience', accountId: normalizedAccountId, name });
  }

  /**
   * Add users to a custom audience
   * Automatically hashes PII data
   */
  async addUsersToAudience(
    audienceId: string,
    users: UserData[],
    schema?: string[]
  ): Promise<any> {
    return this.backoff.execute(async () => {
      try {
        logger.info('Adding users to custom audience', {
          audienceId,
          userCount: users.length,
        });

        // Hash user data
        const hashedUsers = hashUserDataBatch(users);

        const audience = new CustomAudience(audienceId);

        // Convert hashed user data to array format expected by Meta
        const payload: any[] = hashedUsers.map(user => {
          // Default schema if not provided
          const defaultSchema = [];
          const row = [];

          if (user.em) {
            defaultSchema.push('EMAIL');
            row.push(user.em);
          }
          if (user.ph) {
            defaultSchema.push('PHONE');
            row.push(user.ph);
          }
          if (user.fn) {
            defaultSchema.push('FN');
            row.push(user.fn);
          }
          if (user.ln) {
            defaultSchema.push('LN');
            row.push(user.ln);
          }
          if (user.zip) {
            defaultSchema.push('ZIP');
            row.push(user.zip);
          }
          if (user.ct) {
            defaultSchema.push('CT');
            row.push(user.ct);
          }
          if (user.st) {
            defaultSchema.push('ST');
            row.push(user.st);
          }
          if (user.country) {
            defaultSchema.push('COUNTRY');
            row.push(user.country);
          }

          return row;
        });

        // Determine schema
        const finalSchema = schema || ['EMAIL', 'PHONE', 'FN', 'LN', 'ZIP', 'CT', 'ST', 'COUNTRY'];

        const params = {
          payload: {
            schema: finalSchema,
            data: payload,
          },
        };

        const result = await audience.createUser([], params);

        logger.info('Users added to custom audience successfully', {
          audienceId,
          userCount: users.length,
          numReceived: result.num_received,
          numInvalidEntries: result.num_invalid_entries,
        });

        return result;
      } catch (error) {
        throw handleMetaApiError(error);
      }
    }, { operation: 'addUsersToAudience', audienceId, userCount: users.length });
  }

  /**
   * Remove users from a custom audience
   * Automatically hashes PII data
   */
  async removeUsersFromAudience(
    audienceId: string,
    users: UserData[],
    schema?: string[]
  ): Promise<any> {
    return this.backoff.execute(async () => {
      try {
        logger.info('Removing users from custom audience', {
          audienceId,
          userCount: users.length,
        });

        // Hash user data
        const hashedUsers = hashUserDataBatch(users);

        const audience = new CustomAudience(audienceId);

        // Convert hashed user data to array format expected by Meta
        const payload: any[] = hashedUsers.map(user => {
          const row = [];

          if (user.em) row.push(user.em);
          if (user.ph) row.push(user.ph);
          if (user.fn) row.push(user.fn);
          if (user.ln) row.push(user.ln);
          if (user.zip) row.push(user.zip);
          if (user.ct) row.push(user.ct);
          if (user.st) row.push(user.st);
          if (user.country) row.push(user.country);

          return row;
        });

        // Determine schema
        const finalSchema = schema || ['EMAIL', 'PHONE', 'FN', 'LN', 'ZIP', 'CT', 'ST', 'COUNTRY'];

        const params = {
          payload: {
            schema: finalSchema,
            data: payload,
          },
        };

        const result = await audience.deleteUsers([], params);

        logger.info('Users removed from custom audience successfully', {
          audienceId,
          userCount: users.length,
          numReceived: result.num_received,
          numInvalidEntries: result.num_invalid_entries,
        });

        return result;
      } catch (error) {
        throw handleMetaApiError(error);
      }
    }, { operation: 'removeUsersFromAudience', audienceId, userCount: users.length });
  }

  /**
   * Delete a custom audience
   */
  async deleteAudience(audienceId: string): Promise<any> {
    return this.backoff.execute(async () => {
      try {
        logger.info('Deleting custom audience', { audienceId });

        const audience = new CustomAudience(audienceId);
        const result = await audience.delete();

        logger.info('Custom audience deleted successfully', { audienceId });

        return result;
      } catch (error) {
        throw handleMetaApiError(error);
      }
    }, { operation: 'deleteAudience', audienceId });
  }
}
