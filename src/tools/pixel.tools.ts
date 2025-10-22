/**
 * Pixel Tools
 * MCP tools for Meta Pixel and Custom Conversion management
 */

import { PixelService } from '../services/pixel.service.js';
import type { MetaAdsConfig } from '../types/config.types.js';
import { logger } from '../utils/logger.js';

// Tool schemas

// List pixels schema
export const listPixelsSchema = {
  name: 'list_pixels',
  description:
    'List all Meta Pixels for an ad account. Returns pixel details including ID, name, and tracking code.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      account_id: {
        type: 'string',
        description: 'The Meta Ads account ID (with or without "act_" prefix)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of pixels to return (optional)',
      },
    },
    required: ['account_id'],
  },
};

// Get pixel schema
export const getPixelSchema = {
  name: 'get_pixel',
  description:
    'Get detailed information about a specific Meta Pixel by ID. Returns pixel configuration, tracking code, and status.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      pixel_id: {
        type: 'string',
        description: 'The Meta Pixel ID',
      },
    },
    required: ['pixel_id'],
  },
};

// Create pixel schema
export const createPixelSchema = {
  name: 'create_pixel',
  description:
    'Create a new Meta Pixel for tracking website conversions and events. Use the returned pixel code on your website.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      account_id: {
        type: 'string',
        description: 'The Meta Ads account ID (with or without "act_" prefix)',
      },
      name: {
        type: 'string',
        description: 'Pixel name',
      },
    },
    required: ['account_id', 'name'],
  },
};

// List custom conversions schema
export const listCustomConversionsSchema = {
  name: 'list_custom_conversions',
  description:
    'List all custom conversions for a Meta Pixel. Custom conversions let you define specific conversion events based on URL rules.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      pixel_id: {
        type: 'string',
        description: 'The Meta Pixel ID',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of custom conversions to return (optional)',
      },
    },
    required: ['pixel_id'],
  },
};

// Create custom conversion schema
export const createCustomConversionSchema = {
  name: 'create_custom_conversion',
  description:
    'Create a custom conversion for a Meta Pixel. Define conversion rules based on URL patterns and page events.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      account_id: {
        type: 'string',
        description: 'The Meta Ads account ID (with or without "act_" prefix)',
      },
      pixel_id: {
        type: 'string',
        description: 'The Meta Pixel ID to associate with this custom conversion',
      },
      name: {
        type: 'string',
        description: 'Custom conversion name',
      },
      rule: {
        type: 'object',
        description: 'Conversion rule object defining when the conversion fires (e.g., URL contains patterns)',
      },
      custom_event_type: {
        type: 'string',
        enum: [
          'PURCHASE',
          'LEAD',
          'COMPLETE_REGISTRATION',
          'ADD_TO_CART',
          'ADD_TO_WISHLIST',
          'INITIATE_CHECKOUT',
          'ADD_PAYMENT_INFO',
          'CONTACT',
          'CUSTOMIZE_PRODUCT',
          'DONATE',
          'FIND_LOCATION',
          'SCHEDULE',
          'START_TRIAL',
          'SUBMIT_APPLICATION',
          'SUBSCRIBE',
          'SEARCH',
          'VIEW_CONTENT',
          'OTHER',
        ],
        description: 'The standard event type this custom conversion represents (default: OTHER)',
      },
      description: {
        type: 'string',
        description: 'Custom conversion description (optional)',
      },
      default_conversion_value: {
        type: 'number',
        description: 'Default value for this conversion in account currency (optional)',
      },
    },
    required: ['account_id', 'pixel_id', 'name', 'rule'],
  },
};

// Tool handler class
export class PixelTools {
  private service: PixelService;

  constructor(config: MetaAdsConfig) {
    this.service = new PixelService(config);
  }

  async listPixels(args: any) {
    logger.info('list_pixels tool called', {
      accountId: args.account_id,
      limit: args.limit,
    });

    const pixels = await this.service.getPixels(args.account_id, args.limit);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              count: pixels.length,
              pixels,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async getPixel(args: any) {
    logger.info('get_pixel tool called', { pixelId: args.pixel_id });

    const pixel = await this.service.getPixel(args.pixel_id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              pixel,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async createPixel(args: any) {
    logger.info('create_pixel tool called', {
      accountId: args.account_id,
      name: args.name,
    });

    const pixel = await this.service.createPixel(args.account_id, args.name);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'Pixel created successfully',
              pixel,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async listCustomConversions(args: any) {
    logger.info('list_custom_conversions tool called', {
      pixelId: args.pixel_id,
      limit: args.limit,
    });

    const conversions = await this.service.getCustomConversions(args.pixel_id, args.limit);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              count: conversions.length,
              customConversions: conversions,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async createCustomConversion(args: any) {
    logger.info('create_custom_conversion tool called', {
      accountId: args.account_id,
      pixelId: args.pixel_id,
      name: args.name,
      customEventType: args.custom_event_type,
    });

    const conversion = await this.service.createCustomConversion(
      args.account_id,
      args.pixel_id,
      args.name,
      args.rule,
      args.custom_event_type || 'OTHER',
      args.description,
      args.default_conversion_value
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'Custom conversion created successfully',
              customConversion: conversion,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
