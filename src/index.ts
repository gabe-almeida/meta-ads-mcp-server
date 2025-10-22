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

    // Create Meta API configuration
    const metaConfig = createMetaConfig(authConfig.META_ACCESS_TOKEN, {
      apiVersion: authConfig.META_API_VERSION,
    });

    logger.info('Meta Ads API configured', {
      apiVersion: metaConfig.apiVersion || 'default',
    });

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

    // Initialize campaign tools
    const campaignTools = new CampaignTools(metaConfig);

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
