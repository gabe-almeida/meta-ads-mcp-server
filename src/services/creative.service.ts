/**
 * Creative Service
 * Handles ad creative management and creation for Meta Ads
 */

import { MetaAdsService } from './meta-ads.service.js';
import { logger } from '../utils/logger.js';
import { handleMetaApiError } from '../utils/error-handler.js';
import { createDefaultBackoff } from '../utils/retry.js';
import type { GetOptions } from '../types/meta-ads.types.js';

/**
 * Creative call-to-action types
 */
export type CallToActionType =
  | 'BOOK_TRAVEL'
  | 'BUY_NOW'
  | 'CONTACT_US'
  | 'DOWNLOAD'
  | 'GET_QUOTE'
  | 'INSTALL_APP'
  | 'LEARN_MORE'
  | 'LIKE_PAGE'
  | 'SHOP_NOW'
  | 'SIGN_UP'
  | 'SUBSCRIBE'
  | 'WATCH_MORE';

/**
 * Link data for creative
 */
export interface LinkData {
  link: string;
  message?: string;
  name?: string;
  description?: string;
  caption?: string;
  picture?: string;
  call_to_action?: {
    type: CallToActionType;
    value?: {
      link?: string;
      app_destination?: string;
    };
  };
}

/**
 * Carousel child attachment
 */
export interface CarouselChildAttachment {
  link: string;
  name?: string;
  description?: string;
  picture?: string;
  image_hash?: string;
  video_id?: string;
  call_to_action?: {
    type: CallToActionType;
    value?: {
      link?: string;
    };
  };
}

/**
 * Object story spec for creatives
 */
export interface ObjectStorySpec {
  page_id: string;
  link_data?: LinkData;
  video_data?: {
    video_id: string;
    image_url?: string;
    title?: string;
    message?: string;
    call_to_action?: {
      type: CallToActionType;
      value?: {
        link?: string;
      };
    };
  };
  template_data?: {
    name?: string;
    message?: string;
    link?: string;
    call_to_action?: {
      type: CallToActionType;
    };
    child_attachments?: CarouselChildAttachment[];
  };
}

/**
 * Parameters for creating an image creative
 */
export interface CreateImageCreativeParams {
  name: string;
  page_id: string;
  image_hash: string;
  link: string;
  message?: string;
  title?: string;
  description?: string;
  call_to_action?: CallToActionType;
}

/**
 * Parameters for creating a video creative
 */
export interface CreateVideoCreativeParams {
  name: string;
  page_id: string;
  video_id: string;
  link: string;
  message?: string;
  title?: string;
  call_to_action?: CallToActionType;
}

/**
 * Parameters for creating a carousel creative
 */
export interface CreateCarouselCreativeParams {
  name: string;
  page_id: string;
  link: string;
  message?: string;
  cards: CarouselChildAttachment[];
  call_to_action?: CallToActionType;
}

export class CreativeService extends MetaAdsService {
  private readonly backoff = createDefaultBackoff();

  /**
   * Get all creatives for an account
   */
  async getCreatives(accountId: string, options?: GetOptions): Promise<any[]> {
    const normalizedAccountId = this.normalizeAccountId(accountId);

    logger.info('Fetching creatives', {
      accountId: normalizedAccountId,
      options,
    });

    try {
      const result = await this.backoff.execute(async () => {
        const account = new this.AdAccount(normalizedAccountId);
        const cursor = await account.getAdCreatives(
          options?.fields || [
            'id',
            'name',
            'status',
            'object_story_spec',
            'thumbnail_url',
            'image_url',
            'video_id',
            'body',
            'title',
            'effective_object_story_id',
          ],
          {}
        );

        if (options?.limit) {
          return this.paginateWithLimit(cursor, options.limit);
        }
        return this.paginateAll(cursor);
      }, { operation: 'getCreatives', accountId: normalizedAccountId });

      logger.info('Creatives fetched successfully', {
        accountId: normalizedAccountId,
        count: result.length,
      });

      return result;
    } catch (error) {
      const metaError = handleMetaApiError(error);
      logger.error('Failed to fetch creatives', {
        accountId: normalizedAccountId,
        error: metaError.toLogObject(),
      });
      throw metaError;
    }
  }

  /**
   * Get a single creative by ID
   */
  async getCreative(creativeId: string, fields?: string[]): Promise<any> {
    logger.info('Fetching creative', { creativeId });

    try {
      const result = await this.backoff.execute(async () => {
        const creative = new this.AdCreative(creativeId);
        return await creative.get(
          fields || [
            'id',
            'name',
            'status',
            'object_story_spec',
            'thumbnail_url',
            'image_url',
            'video_id',
            'body',
            'title',
            'effective_object_story_id',
          ]
        );
      }, { operation: 'getCreative', creativeId });

      logger.info('Creative fetched successfully', { creativeId });

      return result;
    } catch (error) {
      const metaError = handleMetaApiError(error);
      logger.error('Failed to fetch creative', {
        creativeId,
        error: metaError.toLogObject(),
      });
      throw metaError;
    }
  }

  /**
   * Build object story spec for single image creative
   */
  private buildImageObjectStorySpec(params: CreateImageCreativeParams): ObjectStorySpec {
    return {
      page_id: params.page_id,
      link_data: {
        link: params.link,
        message: params.message,
        name: params.title,
        description: params.description,
        picture: params.image_hash,
        call_to_action: params.call_to_action
          ? {
              type: params.call_to_action,
              value: { link: params.link },
            }
          : undefined,
      },
    };
  }

  /**
   * Build object story spec for video creative
   */
  private buildVideoObjectStorySpec(params: CreateVideoCreativeParams): ObjectStorySpec {
    return {
      page_id: params.page_id,
      video_data: {
        video_id: params.video_id,
        title: params.title,
        message: params.message,
        call_to_action: params.call_to_action
          ? {
              type: params.call_to_action,
              value: { link: params.link },
            }
          : undefined,
      },
    };
  }

  /**
   * Build object story spec for carousel creative
   */
  private buildCarouselObjectStorySpec(params: CreateCarouselCreativeParams): ObjectStorySpec {
    return {
      page_id: params.page_id,
      template_data: {
        message: params.message,
        link: params.link,
        call_to_action: params.call_to_action
          ? { type: params.call_to_action }
          : undefined,
        child_attachments: params.cards,
      },
    };
  }

  /**
   * Create a single image creative
   */
  async createImageCreative(
    accountId: string,
    params: CreateImageCreativeParams
  ): Promise<any> {
    const normalizedAccountId = this.normalizeAccountId(accountId);

    logger.info('Creating image creative', {
      accountId: normalizedAccountId,
      creativeName: params.name,
    });

    try {
      const objectStorySpec = this.buildImageObjectStorySpec(params);

      const result = await this.backoff.execute(async () => {
        const account = new this.AdAccount(normalizedAccountId);
        return await account.createAdCreative([], {
          name: params.name,
          object_story_spec: objectStorySpec,
        });
      }, {
        operation: 'createImageCreative',
        accountId: normalizedAccountId,
        creativeName: params.name,
      });

      logger.info('Image creative created successfully', {
        accountId: normalizedAccountId,
        creativeId: result.id,
        creativeName: params.name,
      });

      return result;
    } catch (error) {
      const metaError = handleMetaApiError(error);
      logger.error('Failed to create image creative', {
        accountId: normalizedAccountId,
        creativeName: params.name,
        error: metaError.toLogObject(),
      });
      throw metaError;
    }
  }

  /**
   * Create a video creative
   */
  async createVideoCreative(
    accountId: string,
    params: CreateVideoCreativeParams
  ): Promise<any> {
    const normalizedAccountId = this.normalizeAccountId(accountId);

    logger.info('Creating video creative', {
      accountId: normalizedAccountId,
      creativeName: params.name,
    });

    try {
      const objectStorySpec = this.buildVideoObjectStorySpec(params);

      const result = await this.backoff.execute(async () => {
        const account = new this.AdAccount(normalizedAccountId);
        return await account.createAdCreative([], {
          name: params.name,
          object_story_spec: objectStorySpec,
        });
      }, {
        operation: 'createVideoCreative',
        accountId: normalizedAccountId,
        creativeName: params.name,
      });

      logger.info('Video creative created successfully', {
        accountId: normalizedAccountId,
        creativeId: result.id,
        creativeName: params.name,
      });

      return result;
    } catch (error) {
      const metaError = handleMetaApiError(error);
      logger.error('Failed to create video creative', {
        accountId: normalizedAccountId,
        creativeName: params.name,
        error: metaError.toLogObject(),
      });
      throw metaError;
    }
  }

  /**
   * Create a carousel creative
   */
  async createCarouselCreative(
    accountId: string,
    params: CreateCarouselCreativeParams
  ): Promise<any> {
    const normalizedAccountId = this.normalizeAccountId(accountId);

    logger.info('Creating carousel creative', {
      accountId: normalizedAccountId,
      creativeName: params.name,
      cardCount: params.cards.length,
    });

    try {
      // Validate carousel has 2-10 cards
      if (params.cards.length < 2 || params.cards.length > 10) {
        throw new Error('Carousel must have between 2 and 10 cards');
      }

      const objectStorySpec = this.buildCarouselObjectStorySpec(params);

      const result = await this.backoff.execute(async () => {
        const account = new this.AdAccount(normalizedAccountId);
        return await account.createAdCreative([], {
          name: params.name,
          object_story_spec: objectStorySpec,
        });
      }, {
        operation: 'createCarouselCreative',
        accountId: normalizedAccountId,
        creativeName: params.name,
      });

      logger.info('Carousel creative created successfully', {
        accountId: normalizedAccountId,
        creativeId: result.id,
        creativeName: params.name,
        cardCount: params.cards.length,
      });

      return result;
    } catch (error) {
      const metaError = handleMetaApiError(error);
      logger.error('Failed to create carousel creative', {
        accountId: normalizedAccountId,
        creativeName: params.name,
        error: metaError.toLogObject(),
      });
      throw metaError;
    }
  }

  /**
   * Delete a creative
   */
  async deleteCreative(creativeId: string): Promise<boolean> {
    logger.info('Deleting creative', { creativeId });

    try {
      const result = await this.backoff.execute(async () => {
        const creative = new this.AdCreative(creativeId);
        return await creative.delete();
      }, { operation: 'deleteCreative', creativeId });

      logger.info('Creative deleted successfully', { creativeId });

      return result.success || false;
    } catch (error) {
      const metaError = handleMetaApiError(error);
      logger.error('Failed to delete creative', {
        creativeId,
        error: metaError.toLogObject(),
      });
      throw metaError;
    }
  }

  /**
   * Get ads using a creative
   */
  async getCreativeAds(creativeId: string, options?: GetOptions): Promise<any[]> {
    logger.info('Fetching ads for creative', { creativeId });

    try {
      const result = await this.backoff.execute(async () => {
        const creative = new this.AdCreative(creativeId);
        const cursor = await creative.getAds(
          options?.fields || ['id', 'name', 'status', 'adset_id', 'campaign_id'],
          {}
        );

        if (options?.limit) {
          return this.paginateWithLimit(cursor, options.limit);
        }
        return this.paginateAll(cursor);
      }, { operation: 'getCreativeAds', creativeId });

      logger.info('Creative ads fetched successfully', {
        creativeId,
        count: result.length,
      });

      return result;
    } catch (error) {
      const metaError = handleMetaApiError(error);
      logger.error('Failed to fetch creative ads', {
        creativeId,
        error: metaError.toLogObject(),
      });
      throw metaError;
    }
  }
}
