#!/usr/bin/env node

/**
 * Meta Ads MCP Server
 * Main entry point for the Model Context Protocol server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { loadAuthConfig } from './config/auth.config.js';
import { createMetaConfig } from './config/meta.config.js';
import { CampaignTools, listCampaignsSchema, getCampaignSchema, createCampaignSchema, updateCampaignSchema, deleteCampaignSchema } from './tools/campaign.tools.js';
import { logger } from './utils/logger.js';
import { handleMetaApiError } from './utils/error-handler.js';

async function main() {
  try {
    // Load authentication configuration
    logger.info('Loading authentication configuration...');
    const authConfig = loadAuthConfig();

    // Track if token is available
    let metaConfig = null;
    let campaignTools = null;
    const hasToken = authConfig !== null;

    if (hasToken) {
      // Create Meta API configuration
      metaConfig = createMetaConfig(authConfig.META_ACCESS_TOKEN, {
        apiVersion: authConfig.META_API_VERSION,
      });

      logger.info('Meta Ads API configured', {
        apiVersion: metaConfig.apiVersion || 'default',
      });

      // Initialize campaign tools
      campaignTools = new CampaignTools(metaConfig);
    } else {
      logger.warn('No META_ACCESS_TOKEN found - server will start but tools will require configuration');
    }

    // Initialize MCP Server
    const server = new Server(
      {
        name: 'meta-ads-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Register tool list handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          listCampaignsSchema,
          getCampaignSchema,
          createCampaignSchema,
          updateCampaignSchema,
          deleteCampaignSchema,
        ],
      };
    });

    // Register tool call handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        logger.debug('Tool called', { name, args });

        // Check if token is configured
        if (!hasToken || !campaignTools) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    error: 'Meta Ads MCP Server is not configured with an access token',
                    help: {
                      message: 'To use Meta Ads tools, you need to configure a Meta access token.',
                      steps: [
                        '1. Get a token from Meta Graph API Explorer: https://developers.facebook.com/tools/explorer/',
                        '2. Select your app or create a new one',
                        '3. Request these permissions: ads_management, ads_read, business_management',
                        '4. Generate a User Access Token',
                        '5. Add to Claude Desktop config:',
                        '   "env": { "META_ACCESS_TOKEN": "your_token_here" }',
                        '6. Restart Claude Desktop'
                      ],
                      documentation: 'See docs/SETUP.md for detailed instructions'
                    }
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        switch (name) {
          case 'list_campaigns':
            return await campaignTools.listCampaigns(args);
          case 'get_campaign':
            return await campaignTools.getCampaign(args);
          case 'create_campaign':
            return await campaignTools.createCampaign(args);
          case 'update_campaign':
            return await campaignTools.updateCampaign(args);
          case 'delete_campaign':
            return await campaignTools.deleteCampaign(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error('Tool execution failed', {
          tool: request.params.name,
          error: error instanceof Error ? error.message : String(error),
        });

        // Handle Meta API errors
        const metaError = handleMetaApiError(error);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: metaError.message,
                  code: metaError.code,
                  type: metaError.type,
                  ...(metaError.fbtraceId && { fbtraceId: metaError.fbtraceId }),
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    });

    // Set up graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await server.close();
      process.exit(0);
    });

    // Start server with stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info('Meta Ads MCP Server started successfully');
  } catch (error) {
    logger.error('Failed to start Meta Ads MCP Server', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

main();
