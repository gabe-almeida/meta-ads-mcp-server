# Building a Comprehensive Meta Ads MCP Server in TypeScript

**The Meta Marketing API v22.0 combined with the MCP TypeScript SDK (@modelcontextprotocol/sdk v1.20+) enables programmatic advertising automation through AI assistants.** This integration requires understanding Facebook's Graph API structure, implementing proper authentication flows, handling rate limits, and structuring MCP tools for campaign management, analytics, and creative operations. Production-ready implementations demand exponential backoff, cursor-based pagination, and OAuth 2.1 with PKCE for secure token management.

Meta's Marketing API exposes the complete advertising platform—campaigns, ad sets, creatives, audiences, insights, and conversions—through a RESTful Graph API using JSON-RPC 2.0. The official `facebook-nodejs-business-sdk` provides TypeScript-compatible classes with promise-based interfaces. MCP servers act as bridges, translating these API capabilities into AI-accessible tools with structured schemas using Zod validation. The architecture follows a three-tier pattern: service layer (Meta SDK wrapper), tool layer (MCP tool definitions), and transport layer (stdio or HTTP). This guide provides production-tested patterns for building enterprise-grade integrations handling thousands of API calls daily.

## Meta Ads API integration fundamentals

The Marketing API sits atop Facebook's Graph API v22.0, exposing advertising functionality through hierarchical objects: ad accounts contain campaigns, campaigns contain ad sets, ad sets contain ads, and ads reference creatives. **Every API call requires an access token passed via the Authorization header.** Base URL structure follows `https://graph.facebook.com/v22.0/{object-id}/{edge}?fields={fields}` where objects are nodes (campaigns, ads), edges are relationships (campaign's ad sets), and fields are properties (name, status).

Authentication uses three token types. Short-lived tokens expire in 1-2 hours, suitable only for development. Long-lived tokens last 60 days but require periodic renewal. **System user tokens—the production standard—never expire unless permissions change.** Create system users in Business Manager under Business Settings → Users → System Users, assign admin roles, grant asset access, then generate non-expiring tokens with `ads_management` and `ads_read` scopes. Store tokens in secure vaults like AWS Secrets Manager, never in environment variables or code repositories.

The official SDK installs via `npm install facebook-nodejs-business-sdk` (v22.0.2). Initialize with `FacebookAdsApi.init(accessToken)` and access object classes: AdAccount, Campaign, AdSet, Ad, AdCreative. The SDK returns promises and includes cursor-based pagination through `hasNext()` and `next()` methods. Enable debugging with `api.setDebug(true)` during development, which logs requests to stderr without interfering with MCP's stdout communication channel.

```typescript
import * as adsSdk from 'facebook-nodejs-business-sdk';

const api = adsSdk.FacebookAdsApi.init(process.env.META_ACCESS_TOKEN!);
const { AdAccount, Campaign, AdSet, Ad, AdCreative } = adsSdk;

const account = new AdAccount('act_123456789');
const campaigns = await account.getCampaigns(
  [Campaign.Fields.id, Campaign.Fields.name, Campaign.Fields.status],
  { limit: 100 }
);

// Pagination
let allCampaigns = [...campaigns];
while (campaigns.hasNext()) {
  const nextPage = await campaigns.next();
  allCampaigns.push(...nextPage);
}
```

Rate limiting follows the formula `Calls/Hour = 60 + (400 × Active Ads) - (0.001 × User Errors)`. Development tier accounts cap at 300 calls/hour; Standard Access scales to 100,000+ calls/hour based on active ads. **Monitor the `X-Business-Use-Case-Usage` response header** containing JSON with `call_count`, `total_cputime`, and `total_time` metrics. When any metric approaches 100, throttling kicks in. Implement client-side rate limiting at 80% threshold to prevent blocking. Error codes 17 (user limit), 80004 (account limit), and 613 (temporarily blocked) indicate rate limit violations requiring exponential backoff.

## MCP server implementation architecture

The Model Context Protocol TypeScript SDK provides two APIs: high-level `McpServer` for rapid development and low-level `Server` for granular control. **Use McpServer for most implementations**—it handles request routing, schema validation, and tool registration automatically. Install with `npm install @modelcontextprotocol/sdk zod` and import from `@modelcontextprotocol/sdk/server/mcp.js`. Zod v3+ provides runtime validation with TypeScript type inference, eliminating duplicate type definitions.

Initialize servers with name and version metadata: `new McpServer({ name: 'meta-ads-server', version: '1.0.0' })`. The MCP protocol uses JSON-RPC 2.0 over stdio (local processes) or Streamable HTTP (remote servers). **Stdio transport is recommended for desktop AI assistants** like Claude Desktop, VS Code, and Zed. HTTP transport enables cloud deployments and browser integrations. Both transports are non-blocking and support bidirectional communication—servers can request LLM completions through sampling and user input through elicitation.

Tool registration uses `server.registerTool(name, config, handler)` where config defines schemas and handler implements business logic. Tools execute actions with side effects (create campaign, update budget). Resources expose read-only data (campaign list, insights report). Prompts are reusable templates for LLM interactions. **Tools return ToolResponse objects** with `content` (user-facing text/images), `structuredContent` (parsed data), and optional `isError` flag. Never throw protocol-level errors for tool failures—return `isError: true` instead.

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
  name: 'meta-ads-mcp-server',
  version: '1.0.0'
});

server.registerTool(
  'list_campaigns',
  {
    title: 'List Ad Campaigns',
    description: 'Retrieve campaigns from Meta Ads account',
    inputSchema: {
      accountId: z.string().describe('Ad account ID (without act_ prefix)'),
      status: z.enum(['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED']).optional(),
      limit: z.number().int().positive().max(500).default(100)
    },
    outputSchema: {
      campaigns: z.array(z.object({
        id: z.string(),
        name: z.string(),
        objective: z.string(),
        status: z.string()
      }))
    }
  },
  async ({ accountId, status, limit }) => {
    try {
      const account = new AdAccount(`act_${accountId}`);
      const filters = status ? { filtering: [{ field: 'status', operator: 'IN', value: [status] }] } : {};
      const campaigns = await account.getCampaigns(
        [Campaign.Fields.id, Campaign.Fields.name, Campaign.Fields.objective, Campaign.Fields.status],
        { ...filters, limit }
      );
      
      const data = campaigns.map(c => ({
        id: c.id,
        name: c.name,
        objective: c.objective,
        status: c.status
      }));
      
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        structuredContent: { campaigns: data }
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

// Start server with stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
```

Error handling distinguishes protocol errors from tool errors. Protocol errors use standard JSON-RPC codes: -32700 (parse error), -32600 (invalid request), -32601 (method not found), -32602 (invalid params), -32603 (internal error). **Tool execution errors use the isError flag in results**, not protocol-level errors. This separation ensures AI assistants receive structured error information they can act on rather than encountering hard failures.

Tool annotations (MCP 2025-03-26 protocol) provide semantic hints: `readOnlyHint: true` indicates no environment modification, `idempotentHint: true` means repeated calls produce identical results, `openWorldHint: true` signals external system interaction. These annotations help AI assistants reason about tool safety and optimize execution strategies—read-only tools can run in parallel, idempotent tools are retry-safe, open-world tools require confirmation.

## Comprehensive Meta Ads functionality to expose

Meta's advertising platform offers 11 major capability areas, each requiring dedicated tool sets. **Campaign management** handles the top-level container defining objectives (OUTCOME_TRAFFIC, OUTCOME_SALES, OUTCOME_LEADS, OUTCOME_AWARENESS, OUTCOME_ENGAGEMENT, OUTCOME_APP_PROMOTION), budget allocation (daily or lifetime), bid strategies (LOWEST_COST_WITHOUT_CAP, LOWEST_COST_WITH_BID_CAP, COST_CAP, LOWEST_COST_WITH_MIN_ROAS), and status (ACTIVE, PAUSED, DELETED, ARCHIVED). Create campaigns with `POST /act_{id}/campaigns`, update with `POST /{campaign-id}`, and read with `GET /{campaign-id}?fields=id,name,objective,status,daily_budget,lifetime_budget,bid_strategy`.

**Ad set management** controls targeting, placement, scheduling, and optimization. Targeting specifications use nested objects: `geo_locations` with countries/cities/regions, `age_min`/`age_max` (13-65+), `genders` (1=male, 2=female), `interests` (ID-based), `behaviors`, `life_events`, `custom_audiences`, `excluded_custom_audiences`, and `flexible_spec` for complex AND/OR logic. Placements span Facebook Feed, Instagram Feed, Stories, Reels, Messenger, Audience Network with device targeting (mobile, desktop, iOS, Android). Optimization goals include REACH, IMPRESSIONS, LINK_CLICKS, LANDING_PAGE_VIEWS, POST_ENGAGEMENT, VIDEO_VIEWS, CONVERSATIONS, LEAD_GENERATION, OFFSITE_CONVERSIONS.

**Ad creative management** requires multi-step operations: upload media to `/act_{id}/adimages` or `/act_{id}/advideos` receiving hash values, create ad creatives with `POST /act_{id}/adcreatives` specifying `object_story_spec` (single image/video/carousel) or `asset_feed_spec` (dynamic creative), then reference creative IDs in ads. Creative specs include `page_id`, `instagram_actor_id`, `link_data` (headline, description, link, call_to_action_type), `video_data`, `carousel_data`, `collection_data`. Dynamic creative optimization (DCO) tests multiple headlines, descriptions, images, and calls-to-action automatically.

```typescript
// Ad Set Creation Example
server.registerTool(
  'create_adset',
  {
    title: 'Create Ad Set',
    inputSchema: {
      accountId: z.string(),
      campaignId: z.string(),
      name: z.string(),
      dailyBudget: z.number().int().positive(),
      targeting: z.object({
        geoLocations: z.object({
          countries: z.array(z.string()).optional(),
          cities: z.array(z.object({ key: z.string() })).optional()
        }),
        ageMin: z.number().int().min(13).max(65).optional(),
        ageMax: z.number().int().min(13).max(65).optional(),
        genders: z.array(z.number().int().min(1).max(2)).optional()
      }),
      optimizationGoal: z.enum(['REACH', 'LINK_CLICKS', 'IMPRESSIONS', 'LANDING_PAGE_VIEWS']),
      bidAmount: z.number().int().optional()
    }
  },
  async ({ accountId, campaignId, name, dailyBudget, targeting, optimizationGoal, bidAmount }) => {
    try {
      const account = new AdAccount(`act_${accountId}`);
      const adSet = await account.createAdSet([AdSet.Fields.id], {
        [AdSet.Fields.name]: name,
        [AdSet.Fields.campaign_id]: campaignId,
        [AdSet.Fields.daily_budget]: dailyBudget,
        [AdSet.Fields.targeting]: targeting,
        [AdSet.Fields.optimization_goal]: optimizationGoal,
        [AdSet.Fields.billing_event]: 'IMPRESSIONS',
        [AdSet.Fields.bid_amount]: bidAmount,
        [AdSet.Fields.status]: 'PAUSED'
      });
      
      return {
        content: [{ type: 'text', text: `Ad set created: ${adSet.id}` }],
        structuredContent: { success: true, adSetId: adSet.id }
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Failed: ${error.message}` }],
        isError: true
      };
    }
  }
);
```

**Audience targeting tools** span four categories. Saved audiences define targeting criteria reused across campaigns. Custom audiences import customer lists (email, phone, mobile advertiser ID), website traffic (pixel-based), app activity, offline activity, or engagement (video viewers, lead form submitters). Lookalike audiences find users similar to custom audiences with 1-10% similarity ranges. **Dynamic audiences automatically target catalog viewers and cart abandoners** for retargeting. API endpoints: `POST /act_{id}/customaudiences`, `POST /act_{id}/saved_audiences`, `POST /{custom-audience-id}/users` for adding members.

**Analytics and insights retrieval** uses the specialized `/insights` edge available on ad accounts, campaigns, ad sets, and ads. Request metrics through `fields` parameter: spend, impressions, reach, frequency, clicks, unique_clicks, ctr, cpc, cpm, cpp, conversions, conversion_values, actions (array of action types), cost_per_action_type. **Breakdowns segment data** by age, gender, country, region, dma, placement, device_platform, publisher_platform, product_id. Time parameters include `date_preset` (today, yesterday, last_7d, last_30d, lifetime) or custom `time_range` with since/until dates. Time increment options: 1 (daily), monthly, all_days.

```typescript
// Insights Retrieval with Breakdowns
server.registerTool(
  'get_campaign_insights',
  {
    title: 'Get Campaign Performance',
    inputSchema: {
      campaignId: z.string(),
      datePreset: z.enum(['today', 'yesterday', 'last_7d', 'last_14d', 'last_30d', 'lifetime']),
      breakdowns: z.array(z.enum(['age', 'gender', 'country', 'placement', 'device_platform'])).optional(),
      level: z.enum(['campaign', 'adset', 'ad']).default('campaign')
    },
    outputSchema: {
      insights: z.array(z.object({
        spend: z.string(),
        impressions: z.string(),
        clicks: z.string(),
        ctr: z.string(),
        cpc: z.string(),
        cpm: z.string()
      }))
    }
  },
  async ({ campaignId, datePreset, breakdowns, level }) => {
    try {
      const campaign = new Campaign(campaignId);
      const params: any = {
        date_preset: datePreset,
        time_increment: 1,
        level: level
      };
      
      if (breakdowns && breakdowns.length > 0) {
        params.breakdowns = breakdowns;
      }
      
      const insights = await campaign.getInsights(
        ['spend', 'impressions', 'clicks', 'ctr', 'cpc', 'cpm', 'reach', 'frequency', 'actions'],
        params
      );
      
      const data = insights.map(i => ({
        date_start: i.date_start,
        spend: i.spend,
        impressions: i.impressions,
        clicks: i.clicks,
        ctr: i.ctr,
        cpc: i.cpc,
        cpm: i.cpm
      }));
      
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        structuredContent: { insights: data }
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);
```

**Pixel and conversion tracking** enables website event monitoring through the Meta Pixel. Create pixels with `POST /act_{id}/adspixels`, retrieve pixel code with `GET /{pixel-id}?fields=code`, and track custom conversions with `POST /act_{id}/customconversions` specifying `pixel_id`, `rule` (URL matching conditions), and `custom_event_type` (PURCHASE, ADD_TO_CART, LEAD, COMPLETE_REGISTRATION). Offline conversions upload via `POST /act_{id}/offlineconversions` or server-to-server events API. Conversion values, currencies, and attribution windows customize tracking.

**Budget and bidding management** operates at campaign or ad set level. Daily budgets distribute spend evenly across days; lifetime budgets optimize across the entire schedule. Campaign Budget Optimization (CBO) automatically allocates budget to best-performing ad sets. **Bid strategies control costs**: LOWEST_COST_WITHOUT_CAP maximizes results without bid constraints, LOWEST_COST_WITH_BID_CAP sets maximum bid per result, COST_CAP maintains average cost per result, LOWEST_COST_WITH_MIN_ROAS ensures minimum return on ad spend. Update budgets and bids with `POST /{campaign-id}` or `POST /{adset-id}` setting `daily_budget`, `lifetime_budget`, `bid_amount`, or `bid_strategy`.

**A/B testing** creates split tests comparing campaigns, ad sets, or ads across variables: creative (images, videos, text), audience (targeting differences), placement (platform combinations), delivery optimization (bid strategies). Create with `POST /act_{id}/abtests` specifying `type` (SPLIT_TEST), `name`, `description`, and `cells` array containing test variants with their treatments and budgets. Monitor with `GET /{abtest-id}?fields=id,name,status,cells,results` retrieving winner declarations and confidence intervals.

**Lead ads integration** captures form submissions directly in Facebook. Create lead forms with `POST /{page-id}/leadgen_forms` defining custom questions, privacy policies, and follow-up actions. Retrieve leads with `GET /{form-id}/leads` or subscribe to real-time webhooks at `/{page-id}/subscribed_apps` with `leadgen` subscription field. Download leads instantly after submission for immediate follow-up, critical for high-intent prospects.

**Catalog and dynamic ads** power product retargeting. Upload product catalogs with `POST /act_{id}/product_catalogs`, add products via `POST /{catalog-id}/products` or bulk feeds, create product sets with filtering rules, then enable dynamic ads showing relevant products to users based on browsing behavior. Advantage+ catalog ads automate creative generation combining product data with optimized layouts.

Additional capabilities include **Business Manager integration** (managing ad accounts, pages, pixels, catalogs across organizations), **Instagram integration** (posting to Instagram accounts, accessing Instagram insights), **Messenger ads** (conversation starters), **WhatsApp ads** (click-to-WhatsApp), and **attribution settings** (conversion windows, attribution models).

## Production-ready code patterns

Service layer architecture isolates Meta SDK complexity from MCP tool definitions. **Create a dedicated MetaAdsService class** wrapping SDK operations with error handling, retry logic, and response normalization. This separation enables unit testing, mocking, and SDK version upgrades without modifying tool implementations.

```typescript
// services/meta-ads.service.ts
import { FacebookAdsApi, AdAccount, Campaign, AdSet, Ad } from 'facebook-nodejs-business-sdk';

export class MetaAdsService {
  private api: typeof FacebookAdsApi;
  
  constructor(private config: { accessToken: string; apiVersion?: string }) {
    this.api = FacebookAdsApi.init(config.accessToken);
    if (config.apiVersion) {
      this.api.setVersion(config.apiVersion);
    }
  }

  async getCampaigns(accountId: string, options: {
    fields?: string[];
    limit?: number;
    status?: string;
  } = {}): Promise<any[]> {
    const account = new AdAccount(`act_${accountId}`);
    const fields = options.fields || [
      Campaign.Fields.id,
      Campaign.Fields.name,
      Campaign.Fields.status,
      Campaign.Fields.objective
    ];
    
    const params: any = { limit: options.limit || 100 };
    if (options.status) {
      params.filtering = [{ field: 'status', operator: 'IN', value: [options.status] }];
    }
    
    const campaigns = await account.getCampaigns(fields, params);
    return this.paginateAll(campaigns);
  }
  
  async createCampaign(accountId: string, data: {
    name: string;
    objective: string;
    status?: string;
    dailyBudget?: number;
    lifetimeBudget?: number;
    specialAdCategories?: string[];
  }): Promise<any> {
    const account = new AdAccount(`act_${accountId}`);
    const campaignData: any = {
      [Campaign.Fields.name]: data.name,
      [Campaign.Fields.objective]: data.objective,
      [Campaign.Fields.status]: data.status || 'PAUSED',
      [Campaign.Fields.special_ad_categories]: data.specialAdCategories || []
    };
    
    if (data.dailyBudget) {
      campaignData[Campaign.Fields.daily_budget] = data.dailyBudget;
    }
    if (data.lifetimeBudget) {
      campaignData[Campaign.Fields.lifetime_budget] = data.lifetimeBudget;
    }
    
    return await account.createCampaign([Campaign.Fields.id, Campaign.Fields.name], campaignData);
  }
  
  async updateCampaign(campaignId: string, updates: Record<string, any>): Promise<any> {
    const campaign = new Campaign(campaignId);
    Object.entries(updates).forEach(([key, value]) => {
      campaign.set(key, value);
    });
    return await campaign.update();
  }
  
  async getInsights(entityId: string, options: {
    datePreset?: string;
    timeRange?: { since: string; until: string };
    level?: string;
    breakdowns?: string[];
    fields?: string[];
  } = {}): Promise<any[]> {
    const campaign = new Campaign(entityId);
    const fields = options.fields || ['spend', 'impressions', 'clicks', 'ctr', 'cpc', 'cpm'];
    const params: any = {
      level: options.level || 'campaign',
      time_increment: 1
    };
    
    if (options.datePreset) {
      params.date_preset = options.datePreset;
    } else if (options.timeRange) {
      params.time_range = options.timeRange;
    }
    
    if (options.breakdowns && options.breakdowns.length > 0) {
      params.breakdowns = options.breakdowns;
    }
    
    const insights = await campaign.getInsights(fields, params);
    return this.paginateAll(insights);
  }
  
  private async paginateAll(cursor: any): Promise<any[]> {
    const results = [...cursor];
    while (cursor.hasNext()) {
      cursor = await cursor.next();
      results.push(...cursor);
    }
    return results;
  }
}
```

**Modular tool organization** groups related functionality into separate files. Create `tools/campaign.tools.ts`, `tools/adset.tools.ts`, `tools/creative.tools.ts`, `tools/insights.tools.ts`, each exporting registration functions accepting server and service instances.

```typescript
// tools/campaign.tools.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { MetaAdsService } from '../services/meta-ads.service';

export function registerCampaignTools(server: McpServer, metaAds: MetaAdsService) {
  server.registerTool(
    'list_campaigns',
    {
      title: 'List Ad Campaigns',
      description: 'Retrieve all campaigns from a Meta Ads account',
      inputSchema: {
        accountId: z.string().describe('Ad account ID (numeric, without act_ prefix)'),
        status: z.enum(['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED']).optional(),
        limit: z.number().int().positive().max(500).default(100)
      }
    },
    async ({ accountId, status, limit }) => {
      try {
        const campaigns = await metaAds.getCampaigns(accountId, { status, limit });
        return {
          content: [{ type: 'text', text: JSON.stringify(campaigns, null, 2) }],
          structuredContent: { campaigns, count: campaigns.length }
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error listing campaigns: ${error.message}` }],
          isError: true
        };
      }
    }
  );
  
  server.registerTool(
    'create_campaign',
    {
      title: 'Create Campaign',
      description: 'Create a new advertising campaign',
      inputSchema: {
        accountId: z.string(),
        name: z.string().min(1).max(255),
        objective: z.enum([
          'OUTCOME_TRAFFIC',
          'OUTCOME_SALES',
          'OUTCOME_LEADS',
          'OUTCOME_AWARENESS',
          'OUTCOME_ENGAGEMENT',
          'OUTCOME_APP_PROMOTION'
        ]),
        dailyBudget: z.number().int().positive().optional().describe('Daily budget in cents/pence'),
        lifetimeBudget: z.number().int().positive().optional().describe('Lifetime budget in cents/pence'),
        status: z.enum(['ACTIVE', 'PAUSED']).default('PAUSED'),
        specialAdCategories: z.array(z.enum(['CREDIT', 'EMPLOYMENT', 'HOUSING'])).optional()
      },
      annotations: {
        openWorldHint: true
      }
    },
    async (params) => {
      try {
        const campaign = await metaAds.createCampaign(params.accountId, params);
        return {
          content: [{ type: 'text', text: `Campaign created successfully: ${campaign.id}` }],
          structuredContent: { success: true, campaignId: campaign.id, name: campaign.name }
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Failed to create campaign: ${error.message}` }],
          isError: true
        };
      }
    }
  );
  
  server.registerTool(
    'update_campaign',
    {
      title: 'Update Campaign',
      description: 'Update campaign properties like name, budget, or status',
      inputSchema: {
        campaignId: z.string(),
        name: z.string().optional(),
        status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
        dailyBudget: z.number().int().positive().optional(),
        lifetimeBudget: z.number().int().positive().optional()
      },
      annotations: {
        openWorldHint: true
      }
    },
    async ({ campaignId, ...updates }) => {
      try {
        const cleanUpdates = Object.fromEntries(
          Object.entries(updates).filter(([_, v]) => v !== undefined)
        );
        
        if (Object.keys(cleanUpdates).length === 0) {
          return {
            content: [{ type: 'text', text: 'No updates provided' }],
            isError: true
          };
        }
        
        await metaAds.updateCampaign(campaignId, cleanUpdates);
        return {
          content: [{ type: 'text', text: `Campaign ${campaignId} updated successfully` }],
          structuredContent: { success: true, updates: cleanUpdates }
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Update failed: ${error.message}` }],
          isError: true
        };
      }
    }
  );
}
```

**TypeScript type definitions** provide compile-time safety and IDE autocomplete. Define interfaces for API objects, request parameters, and response shapes.

```typescript
// types/meta-ads.types.ts
export interface MetaAdsConfig {
  accessToken: string;
  apiVersion?: string;
}

export type CampaignObjective = 
  | 'OUTCOME_TRAFFIC'
  | 'OUTCOME_SALES'
  | 'OUTCOME_LEADS'
  | 'OUTCOME_AWARENESS'
  | 'OUTCOME_ENGAGEMENT'
  | 'OUTCOME_APP_PROMOTION';

export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';

export type OptimizationGoal = 
  | 'REACH'
  | 'IMPRESSIONS'
  | 'LINK_CLICKS'
  | 'LANDING_PAGE_VIEWS'
  | 'POST_ENGAGEMENT'
  | 'VIDEO_VIEWS'
  | 'LEAD_GENERATION'
  | 'OFFSITE_CONVERSIONS';

export interface TargetingSpec {
  geo_locations?: {
    countries?: string[];
    cities?: Array<{ key: string; name?: string }>;
    regions?: Array<{ key: string }>;
  };
  age_min?: number;
  age_max?: number;
  genders?: number[];
  interests?: Array<{ id: string; name?: string }>;
  behaviors?: Array<{ id: string; name?: string }>;
  custom_audiences?: Array<{ id: string }>;
  excluded_custom_audiences?: Array<{ id: string }>;
  flexible_spec?: any[];
}

export interface CampaignCreateParams {
  name: string;
  objective: CampaignObjective;
  status?: CampaignStatus;
  dailyBudget?: number;
  lifetimeBudget?: number;
  specialAdCategories?: string[];
}

export interface AdSetCreateParams {
  campaignId: string;
  name: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
  targeting: TargetingSpec;
  optimizationGoal: OptimizationGoal;
  billingEvent?: string;
  bidAmount?: number;
  status?: CampaignStatus;
}

export interface InsightsParams {
  datePreset?: string;
  timeRange?: { since: string; until: string };
  level?: 'campaign' | 'adset' | 'ad';
  breakdowns?: string[];
  fields?: string[];
}
```

**Authentication flow implementation** supports both environment-based tokens and OAuth 2.1 with PKCE for production deployments.

```typescript
// config/auth.config.ts
import { z } from 'zod';
import { ProxyOAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/providers/proxyProvider.js';

const AuthConfigSchema = z.object({
  META_ACCESS_TOKEN: z.string().min(1),
  META_APP_SECRET: z.string().optional(),
  META_API_VERSION: z.string().default('v22.0'),
  AUTH_MODE: z.enum(['token', 'oauth']).default('token')
});

export function loadAuthConfig() {
  return AuthConfigSchema.parse({
    META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN,
    META_APP_SECRET: process.env.META_APP_SECRET,
    META_API_VERSION: process.env.META_API_VERSION,
    AUTH_MODE: process.env.AUTH_MODE
  });
}

export function createOAuthProvider(config: { clientId: string; clientSecret: string }) {
  return new ProxyOAuthServerProvider({
    endpoints: {
      authorizationUrl: 'https://www.facebook.com/v22.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v22.0/oauth/access_token'
    },
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    scopes: ['ads_management', 'ads_read', 'business_management'],
    verifyAccessToken: async (token: string) => {
      const response = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${token}`
      );
      const data = await response.json();
      
      if (!data.data?.is_valid) {
        throw new Error('Invalid token');
      }
      
      return {
        token,
        clientId: data.data.app_id,
        scopes: data.data.scopes || ['ads_management'],
        expiresAt: data.data.expires_at ? new Date(data.data.expires_at * 1000) : undefined
      };
    }
  });
}
```

**Main server entrypoint** assembles components and starts the transport layer.

```typescript
// src/index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadAuthConfig } from './config/auth.config';
import { MetaAdsService } from './services/meta-ads.service';
import { registerCampaignTools } from './tools/campaign.tools';
import { registerAdSetTools } from './tools/adset.tools';
import { registerInsightsTools } from './tools/insights.tools';

async function main() {
  const config = loadAuthConfig();
  
  const server = new McpServer({
    name: 'meta-ads-mcp-server',
    version: '1.0.0'
  });
  
  const metaAdsService = new MetaAdsService({
    accessToken: config.META_ACCESS_TOKEN,
    apiVersion: config.META_API_VERSION
  });
  
  // Register all tools
  registerCampaignTools(server, metaAdsService);
  registerAdSetTools(server, metaAdsService);
  registerInsightsTools(server, metaAdsService);
  
  // Error handling
  server.onerror = (error) => {
    console.error('[MCP Server Error]', error);
  };
  
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });
  
  // Connect transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Meta Ads MCP Server running');
}

main().catch((error) => {
  console.error('[Fatal Error]', error);
  process.exit(1);
});
```

For HTTP deployments, replace stdio transport with Express-based HTTP transport supporting session management and CORS.

```typescript
// src/http-server.ts
import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'node:crypto';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

const app = express();
app.use(express.json());
app.use(cors({
  origin: '*',
  exposedHeaders: ['Mcp-Session-Id'],
  allowedHeaders: ['Content-Type', 'mcp-session-id']
}));

const server = new McpServer({ name: 'meta-ads-http', version: '1.0.0' });
// Register tools...

const sessions: Record<string, StreamableHTTPServerTransport> = {};

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  
  if (sessionId && sessions[sessionId]) {
    await sessions[sessionId].handleRequest(req, res, req.body);
  } else if (!sessionId && isInitializeRequest(req.body)) {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => { sessions[id] = transport; },
      enableDnsRebindingProtection: true,
      allowedHosts: ['127.0.0.1', 'localhost']
    });
    
    transport.onclose = () => {
      if (transport.sessionId) delete sessions[transport.sessionId];
    };
    
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } else {
    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Invalid request' },
      id: null
    });
  }
});

app.listen(3000, () => console.log('HTTP MCP server on port 3000'));
```

## Essential best practices for production

**Exponential backoff with jitter** prevents cascading failures when rate limits or transient errors occur. Implement retry logic with 1-second base delay doubling to 32-second maximum, adding 10% random jitter to prevent thundering herd.

```typescript
// utils/retry.ts
export class ExponentialBackoff {
  constructor(
    private options: {
      baseDelay?: number;
      maxDelay?: number;
      maxRetries?: number;
      jitterFactor?: number;
    } = {}
  ) {
    this.options = {
      baseDelay: 1000,
      maxDelay: 32000,
      maxRetries: 5,
      jitterFactor: 0.1,
      ...options
    };
  }
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < this.options.maxRetries!; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        if (!this.isRetriable(error) || attempt === this.options.maxRetries! - 1) {
          throw error;
        }
        
        const exponentialDelay = Math.min(
          this.options.baseDelay! * Math.pow(2, attempt),
          this.options.maxDelay!
        );
        const jitter = exponentialDelay * this.options.jitterFactor! * Math.random();
        const delay = exponentialDelay + jitter;
        
        console.error(`Retry ${attempt + 1}/${this.options.maxRetries} after ${delay.toFixed(0)}ms`);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }
  
  private isRetriable(error: any): boolean {
    const retriableCodes = [429, 500, 502, 503, 504];
    const retriableErrors = [17, 4, 80004, 613]; // Meta rate limit codes
    const retriableTypes = ['TRANSIENT_ERROR', 'INTERNAL_ERROR'];
    
    return (
      retriableCodes.includes(error.status) ||
      retriableCodes.includes(error.statusCode) ||
      retriableErrors.includes(error.code) ||
      retriableTypes.includes(error.type) ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNRESET'
    );
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage in service
export class MetaAdsService {
  private backoff = new ExponentialBackoff();
  
  async getCampaigns(accountId: string, options: any = {}): Promise<any[]> {
    return await this.backoff.execute(async () => {
      const account = new AdAccount(`act_${accountId}`);
      return await account.getCampaigns(options.fields || [], options);
    });
  }
}
```

**Rate limit monitoring** tracks API usage through response headers, implementing proactive throttling at 80% capacity.

```typescript
// utils/rate-limiter.ts
export class MetaRateLimiter {
  private callCount = 0;
  private cpuTime = 0;
  private totalTime = 0;
  private resetTime = Date.now() + 3600000; // 1 hour
  
  async checkAndWait(response?: any): Promise<void> {
    if (response?.headers) {
      const usage = this.parseUsageHeader(response.headers['x-business-use-case-usage']);
      if (usage) {
        this.callCount = usage.call_count;
        this.cpuTime = usage.total_cputime;
        this.totalTime = usage.total_time;
      }
    }
    
    // Throttle at 80% of limits
    if (this.callCount > 80 || this.cpuTime > 80 || this.totalTime > 80) {
      const waitTime = Math.max(0, this.resetTime - Date.now());
      console.error(`Rate limit approaching, waiting ${waitTime}ms`);
      await this.sleep(waitTime);
      this.reset();
    }
  }
  
  private parseUsageHeader(header?: string): any {
    if (!header) return null;
    try {
      const parsed = JSON.parse(header);
      return Object.values(parsed)[0];
    } catch {
      return null;
    }
  }
  
  private reset(): void {
    this.callCount = 0;
    this.cpuTime = 0;
    this.totalTime = 0;
    this.resetTime = Date.now() + 3600000;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

**Structured error handling** distinguishes permanent errors (invalid parameters, permission denied) from transient errors (rate limits, network timeouts).

```typescript
// utils/error-handler.ts
export class MetaAdsError extends Error {
  constructor(
    message: string,
    public code: string | number,
    public type: string,
    public statusCode: number = 500,
    public fbtraceId?: string
  ) {
    super(message);
    this.name = 'MetaAdsError';
  }
  
  isRetriable(): boolean {
    const retriableCodes = [17, 4, 80004, 613, 429, 500, 502, 503, 504];
    const retriableTypes = ['TRANSIENT_ERROR', 'INTERNAL_ERROR'];
    return retriableCodes.includes(Number(this.code)) || retriableTypes.includes(this.type);
  }
}

export function handleMetaApiError(error: any): MetaAdsError {
  if (error.response?.error) {
    const fbError = error.response.error;
    return new MetaAdsError(
      fbError.message || 'Meta API error',
      fbError.code || 'UNKNOWN',
      fbError.type || 'API_ERROR',
      error.response.status || 500,
      fbError.fbtrace_id
    );
  }
  
  return new MetaAdsError(
    error.message || 'Unknown error',
    'INTERNAL_ERROR',
    'INTERNAL_ERROR'
  );
}

// Wrap service methods
export class MetaAdsService {
  async getCampaigns(accountId: string, options: any = {}): Promise<any[]> {
    try {
      return await this.backoff.execute(async () => {
        const account = new AdAccount(`act_${accountId}`);
        const campaigns = await account.getCampaigns(options.fields || [], options);
        return this.paginateAll(campaigns);
      });
    } catch (error) {
      throw handleMetaApiError(error);
    }
  }
}
```

**Pagination efficiency** requires cursor-based iteration with field filtering to minimize data transfer and API calls.

```typescript
// Efficient pagination with streaming
async function* streamCampaigns(
  accountId: string,
  batchSize: number = 100
): AsyncGenerator<any[], void, unknown> {
  const account = new AdAccount(`act_${accountId}`);
  let campaigns = await account.getCampaigns(
    [Campaign.Fields.id, Campaign.Fields.name], // Only needed fields
    { limit: batchSize }
  );
  
  yield [...campaigns];
  
  while (campaigns.hasNext()) {
    campaigns = await campaigns.next();
    yield [...campaigns];
  }
}

// Usage
for await (const batch of streamCampaigns('123456789', 100)) {
  console.log(`Processing ${batch.length} campaigns`);
  // Process batch...
}
```

**Security hardening** implements token rotation, scope validation, and secure storage.

```typescript
// Token rotation
export class TokenManager {
  async refreshToken(shortLivedToken: string): Promise<string> {
    const response = await fetch(
      `https://graph.facebook.com/v22.0/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${process.env.META_APP_ID}` +
      `&client_secret=${process.env.META_APP_SECRET}` +
      `&fb_exchange_token=${shortLivedToken}`
    );
    
    const data = await response.json();
    return data.access_token;
  }
  
  async scheduleRotation(): Promise<void> {
    // Rotate every 30 days (tokens last 60 days)
    setInterval(async () => {
      const newToken = await this.refreshToken(currentToken);
      await this.storeSecurely(newToken);
    }, 30 * 24 * 60 * 60 * 1000);
  }
}

// Scope validation in tools
server.registerTool('create_campaign', schema, async (params, { authInfo }) => {
  if (!authInfo?.scopes?.includes('ads_management')) {
    return {
      content: [{ type: 'text', text: 'Missing required scope: ads_management' }],
      isError: true
    };
  }
  // Proceed...
});
```

**Webhook verification** for Lead Ads requires HMAC signature validation and immediate 200 OK responses.

```typescript
// Webhook handler for Lead Ads
import crypto from 'crypto';

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-hub-signature'];
  const expectedSignature = 'sha1=' + crypto
    .createHmac('sha1', process.env.APP_SECRET!)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.sendStatus(403);
  }
  
  res.sendStatus(200); // Acknowledge immediately
  
  // Process asynchronously
  processWebhookAsync(req.body).catch(console.error);
});
```

**Logging strategy** writes debug information to stderr (not stdout, which MCP uses for JSON-RPC) with structured context.

```typescript
// utils/logger.ts
export const logger = {
  error: (message: string, context?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      ...context
    }));
  },
  
  info: (message: string, context?: any) => {
    console.error(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...context
    }));
  }
};

// Usage
logger.info('Campaign created', { campaignId: '123', accountId: 'act_456' });
```

## Implementation roadmap and testing

Build incrementally starting with read-only operations, then progress to write operations, advanced features, and production hardening. **Phase 1** implements basic campaign listing, insights retrieval, and MCP server scaffolding with stdio transport. Test with MCP Inspector: `npx @modelcontextprotocol/inspector build/index.js`. Phase 2 adds campaign/ad set/ad creation and updates with validation. Phase 3 implements audiences, creatives, and pixel management. Phase 4 adds error handling, retry logic, rate limiting, and OAuth. Phase 5 deploys HTTP transport with session management for production.

Unit test service methods independently by mocking Meta SDK responses. Integration test full tool execution with test ad accounts (Meta provides sandbox accounts). Use MCP Inspector for interactive debugging—it provides a visual interface showing tool schemas, testing invocations, and inspecting responses. For automated testing, create a test client that sends JSON-RPC requests directly to the server process.

```typescript
// Example test setup
import { test } from 'node:test';
import assert from 'node:assert';
import { MetaAdsService } from './services/meta-ads.service';

test('getCampaigns returns campaigns', async () => {
  const service = new MetaAdsService({ accessToken: process.env.TEST_TOKEN! });
  const campaigns = await service.getCampaigns('123456789', { limit: 5 });
  
  assert.ok(Array.isArray(campaigns));
  assert.ok(campaigns.length <= 5);
  assert.ok(campaigns[0].id);
  assert.ok(campaigns[0].name);
});
```

Configure Claude Desktop to use your server by editing `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "meta-ads": {
      "command": "node",
      "args": ["/path/to/build/index.js"],
      "env": {
        "META_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

Package for distribution with proper TypeScript configuration and executable permissions.

```json
{
  "name": "meta-ads-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "meta-ads-mcp": "./build/index.js"
  },
  "scripts": {
    "build": "tsc && chmod +x build/index.js",
    "dev": "tsx watch src/index.ts",
    "test": "node --test build/**/*.test.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.20.0",
    "facebook-nodejs-business-sdk": "^22.0.2",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0"
  }
}
```

## Conclusion

Building production-ready Meta Ads MCP servers demands mastery of three domains: Meta's Marketing API structure and rate limiting, MCP's tool-based architecture and error handling conventions, and TypeScript's type system for runtime safety. **The critical success factors are proper authentication with system user tokens, exponential backoff for reliability, cursor pagination for efficiency, and structured error responses for AI assistant comprehension.** Start with read-only tools, validate with MCP Inspector, progressively add write operations, then harden with retry logic and rate limiting before production deployment. This architecture enables AI assistants to autonomously manage advertising campaigns, analyze performance data, and optimize budgets through natural language interactions while maintaining safety through tool annotations and confirmation workflows.