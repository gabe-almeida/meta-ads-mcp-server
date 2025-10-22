/**
 * Creative Tools
 * MCP tools for managing Meta Ads creatives and assets
 */

import { z } from 'zod';
import { AssetService } from '../services/asset.service.js';
import { CreativeService } from '../services/creative.service.js';
import type { MetaAdsConfig } from '../types/config.types.js';
import type {
  CreateImageCreativeParams,
  CreateVideoCreativeParams,
  CreateCarouselCreativeParams,
  CarouselChildAttachment,
  CallToActionType,
} from '../services/creative.service.js';

/**
 * Define creative tool schemas
 */

const ListCreativesSchema = z.object({
  account_id: z.string().describe('Ad account ID (with or without act_ prefix)'),
  limit: z.number().optional().describe('Maximum number of creatives to return'),
  fields: z.array(z.string()).optional().describe('Fields to include in response'),
});

const GetCreativeSchema = z.object({
  creative_id: z.string().describe('Creative ID to fetch'),
  fields: z.array(z.string()).optional().describe('Fields to include in response'),
});

const UploadImageSchema = z.object({
  account_id: z.string().describe('Ad account ID (with or without act_ prefix)'),
  file_path: z.string().describe('Absolute path to image file (JPG, PNG, GIF)'),
});

const UploadVideoSchema = z.object({
  account_id: z.string().describe('Ad account ID (with or without act_ prefix)'),
  file_path: z.string().describe('Absolute path to video file (MP4, MOV, AVI, MKV)'),
});

const CreateImageCreativeSchema = z.object({
  account_id: z.string().describe('Ad account ID (with or without act_ prefix)'),
  name: z.string().describe('Creative name'),
  page_id: z.string().describe('Facebook Page ID'),
  image_hash: z.string().describe('Image hash from uploaded image'),
  link: z.string().url().describe('Destination URL for the ad'),
  message: z.string().optional().describe('Main text of the ad'),
  title: z.string().optional().describe('Headline text'),
  description: z.string().optional().describe('Description text'),
  call_to_action: z
    .enum([
      'BOOK_TRAVEL',
      'BUY_NOW',
      'CONTACT_US',
      'DOWNLOAD',
      'GET_QUOTE',
      'INSTALL_APP',
      'LEARN_MORE',
      'LIKE_PAGE',
      'SHOP_NOW',
      'SIGN_UP',
      'SUBSCRIBE',
      'WATCH_MORE',
    ])
    .optional()
    .describe('Call-to-action button type'),
});

const CreateVideoCreativeSchema = z.object({
  account_id: z.string().describe('Ad account ID (with or without act_ prefix)'),
  name: z.string().describe('Creative name'),
  page_id: z.string().describe('Facebook Page ID'),
  video_id: z.string().describe('Video ID from uploaded video'),
  link: z.string().url().describe('Destination URL for the ad'),
  message: z.string().optional().describe('Main text of the ad'),
  title: z.string().optional().describe('Video title'),
  call_to_action: z
    .enum([
      'BOOK_TRAVEL',
      'BUY_NOW',
      'CONTACT_US',
      'DOWNLOAD',
      'GET_QUOTE',
      'INSTALL_APP',
      'LEARN_MORE',
      'LIKE_PAGE',
      'SHOP_NOW',
      'SIGN_UP',
      'SUBSCRIBE',
      'WATCH_MORE',
    ])
    .optional()
    .describe('Call-to-action button type'),
});

const CarouselCardSchema = z.object({
  link: z.string().url().describe('Destination URL for this card'),
  name: z.string().optional().describe('Card headline'),
  description: z.string().optional().describe('Card description'),
  picture: z.string().optional().describe('Image URL for card'),
  image_hash: z.string().optional().describe('Image hash for card'),
  video_id: z.string().optional().describe('Video ID for card'),
  call_to_action: z
    .object({
      type: z.enum([
        'BOOK_TRAVEL',
        'BUY_NOW',
        'CONTACT_US',
        'DOWNLOAD',
        'GET_QUOTE',
        'INSTALL_APP',
        'LEARN_MORE',
        'LIKE_PAGE',
        'SHOP_NOW',
        'SIGN_UP',
        'SUBSCRIBE',
        'WATCH_MORE',
      ]),
      value: z
        .object({
          link: z.string().url().optional(),
        })
        .optional(),
    })
    .optional()
    .describe('Call-to-action for this card'),
});

const CreateCarouselCreativeSchema = z.object({
  account_id: z.string().describe('Ad account ID (with or without act_ prefix)'),
  name: z.string().describe('Creative name'),
  page_id: z.string().describe('Facebook Page ID'),
  link: z.string().url().describe('Default destination URL'),
  message: z.string().optional().describe('Main text of the carousel ad'),
  cards: z
    .array(CarouselCardSchema)
    .min(2)
    .max(10)
    .describe('Carousel cards (2-10 cards required)'),
  call_to_action: z
    .enum([
      'BOOK_TRAVEL',
      'BUY_NOW',
      'CONTACT_US',
      'DOWNLOAD',
      'GET_QUOTE',
      'INSTALL_APP',
      'LEARN_MORE',
      'LIKE_PAGE',
      'SHOP_NOW',
      'SIGN_UP',
      'SUBSCRIBE',
      'WATCH_MORE',
    ])
    .optional()
    .describe('Default call-to-action button type'),
});

/**
 * Create creative tools
 */
export function createCreativeTools(config: MetaAdsConfig) {
  const assetService = new AssetService(config);
  const creativeService = new CreativeService(config);

  return [
    {
      name: 'list_creatives',
      description:
        'List all ad creatives for an account. Creatives define the visual content and messaging for ads.',
      inputSchema: ListCreativesSchema,
      handler: async (args: z.infer<typeof ListCreativesSchema>) => {
        const result = await creativeService.getCreatives(args.account_id, {
          limit: args.limit,
          fields: args.fields,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  count: result.length,
                  creatives: result,
                },
                null,
                2
              ),
            },
          ],
        };
      },
    },

    {
      name: 'get_creative',
      description:
        'Get details of a specific ad creative by ID. Returns creative configuration including images, videos, and messaging.',
      inputSchema: GetCreativeSchema,
      handler: async (args: z.infer<typeof GetCreativeSchema>) => {
        const result = await creativeService.getCreative(args.creative_id, args.fields);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  creative: result,
                },
                null,
                2
              ),
            },
          ],
        };
      },
    },

    {
      name: 'upload_image',
      description:
        'Upload an image to Meta Ads. Returns an image hash that can be used when creating image creatives. Supported formats: JPG, PNG, GIF. Max size: 30MB.',
      inputSchema: UploadImageSchema,
      handler: async (args: z.infer<typeof UploadImageSchema>) => {
        const result = await assetService.uploadImage(args.account_id, args.file_path);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Image uploaded successfully',
                  image: result,
                },
                null,
                2
              ),
            },
          ],
        };
      },
    },

    {
      name: 'upload_video',
      description:
        'Upload a video to Meta Ads. Returns a video ID that can be used when creating video creatives. Supported formats: MP4, MOV, AVI, MKV. Max size: 4GB.',
      inputSchema: UploadVideoSchema,
      handler: async (args: z.infer<typeof UploadVideoSchema>) => {
        const result = await assetService.uploadVideo(args.account_id, args.file_path);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Video uploaded successfully',
                  video: result,
                },
                null,
                2
              ),
            },
          ],
        };
      },
    },

    {
      name: 'create_creative_single_image',
      description:
        'Create a single image ad creative. Use after uploading an image with upload_image to get the image_hash. This creative can then be used when creating ads.',
      inputSchema: CreateImageCreativeSchema,
      handler: async (args: z.infer<typeof CreateImageCreativeSchema>) => {
        const params: CreateImageCreativeParams = {
          name: args.name,
          page_id: args.page_id,
          image_hash: args.image_hash,
          link: args.link,
          message: args.message,
          title: args.title,
          description: args.description,
          call_to_action: args.call_to_action as CallToActionType | undefined,
        };

        const result = await creativeService.createImageCreative(args.account_id, params);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Image creative created successfully',
                  creative_id: result.id,
                  creative: result,
                },
                null,
                2
              ),
            },
          ],
        };
      },
    },

    {
      name: 'create_creative_video',
      description:
        'Create a video ad creative. Use after uploading a video with upload_video to get the video_id. This creative can then be used when creating ads.',
      inputSchema: CreateVideoCreativeSchema,
      handler: async (args: z.infer<typeof CreateVideoCreativeSchema>) => {
        const params: CreateVideoCreativeParams = {
          name: args.name,
          page_id: args.page_id,
          video_id: args.video_id,
          link: args.link,
          message: args.message,
          title: args.title,
          call_to_action: args.call_to_action as CallToActionType | undefined,
        };

        const result = await creativeService.createVideoCreative(args.account_id, params);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Video creative created successfully',
                  creative_id: result.id,
                  creative: result,
                },
                null,
                2
              ),
            },
          ],
        };
      },
    },

    {
      name: 'create_creative_carousel',
      description:
        'Create a carousel ad creative with 2-10 cards. Each card can have its own image/video, link, and text. Upload images/videos first to get hashes/IDs for the cards.',
      inputSchema: CreateCarouselCreativeSchema,
      handler: async (args: z.infer<typeof CreateCarouselCreativeSchema>) => {
        const params: CreateCarouselCreativeParams = {
          name: args.name,
          page_id: args.page_id,
          link: args.link,
          message: args.message,
          cards: args.cards as CarouselChildAttachment[],
          call_to_action: args.call_to_action as CallToActionType | undefined,
        };

        const result = await creativeService.createCarouselCreative(args.account_id, params);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Carousel creative created successfully',
                  creative_id: result.id,
                  card_count: args.cards.length,
                  creative: result,
                },
                null,
                2
              ),
            },
          ],
        };
      },
    },

    {
      name: 'get_creative_previews',
      description:
        'Get preview URLs for a creative to see how it will appear on different placements (Facebook, Instagram, etc).',
      inputSchema: z.object({
        creative_id: z.string().describe('Creative ID to preview'),
        ad_format: z
          .enum([
            'DESKTOP_FEED_STANDARD',
            'MOBILE_FEED_STANDARD',
            'INSTAGRAM_STANDARD',
            'INSTAGRAM_STORY',
            'MOBILE_BANNER',
          ])
          .optional()
          .describe('Ad format to preview'),
      }),
      handler: async (args: { creative_id: string; ad_format?: string }) => {
        const result = await creativeService.getCreative(args.creative_id, [
          'id',
          'name',
          'thumbnail_url',
          'image_url',
          'effective_object_story_id',
        ]);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  creative_id: args.creative_id,
                  preview: result,
                },
                null,
                2
              ),
            },
          ],
        };
      },
    },
  ];
}
