# Meta Ads MCP Server - Technical Specification

## Overview

This specification defines a production-ready Model Context Protocol (MCP) server that enables AI assistants to programmatically manage Meta (Facebook/Instagram) advertising campaigns through natural language interactions. The server will provide comprehensive access to Meta's Marketing API v22.0 while maintaining enterprise-grade reliability, security, and user-friendliness.

## Vision & Goals

### Primary Objectives

1. **User-Friendly Interface**: Provide intuitive, natural-language-friendly tools that abstract away API complexity while maintaining power and flexibility
2. **Comprehensive Coverage**: Support all major Meta Ads functionality including campaigns, ad sets, ads, creatives, audiences, insights, and conversions
3. **Production-Ready Reliability**: Implement exponential backoff, rate limiting, error handling, and retry logic for enterprise deployments
4. **Flexibility**: Support multiple use cases from simple campaign management to complex multi-account automation
5. **Security First**: Implement OAuth 2.1 with PKCE, token rotation, and secure credential management

### Target Users

- **Digital Marketing Teams**: Managing multiple campaigns across accounts
- **Agencies**: Automating client campaign management and reporting
- **Developers**: Building AI-powered advertising automation tools
- **Data Analysts**: Extracting and analyzing advertising performance data
- **Solo Entrepreneurs**: Simplifying their advertising operations

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      AI Assistant                            │
│                  (Claude, GPT, etc.)                         │
└──────────────────┬──────────────────────────────────────────┘
                   │ MCP Protocol (JSON-RPC 2.0)
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                   MCP Server Layer                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Tool Registry (Zod Schema Validation)                 │ │
│  │  - Campaign Tools  - Insights Tools                    │ │
│  │  - Ad Set Tools    - Audience Tools                    │ │
│  │  - Creative Tools  - Conversion Tools                  │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                   Service Layer                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  MetaAdsService (Business Logic)                       │ │
│  │  - API Wrappers    - Response Normalization           │ │
│  │  - Error Handling  - Pagination Logic                 │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Utilities & Middleware                                │ │
│  │  - Retry Logic     - Rate Limiter                      │ │
│  │  - Token Manager   - Logger                            │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│          Meta Marketing API v22.0                            │
│          (facebook-nodejs-business-sdk)                      │
└──────────────────────────────────────────────────────────────┘
```

### Transport Options

1. **Stdio Transport** (Primary)
   - For local AI assistants (Claude Desktop, VS Code, Zed)
   - Direct process communication
   - Simplest configuration

2. **HTTP Transport** (Optional)
   - For cloud deployments
   - Session management with Redis
   - CORS support for browser clients
   - Load balancer compatible

## Functional Requirements

### 1. Campaign Management

#### Tools

##### `list_campaigns`
**Description**: Retrieve campaigns from a Meta Ads account with flexible filtering

**Input Schema**:
```typescript
{
  accountId: string;          // Ad account ID (without act_ prefix)
  status?: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED' | 'IN_PROCESS';
  objectiveFilter?: CampaignObjective[];
  limit?: number;             // Default 100, max 500
  fields?: string[];          // Custom fields to retrieve
}
```

**Output**: Array of campaign objects with id, name, objective, status, budget info, dates

**Annotations**: `readOnlyHint: true`

##### `get_campaign`
**Description**: Retrieve detailed information about a specific campaign

**Input Schema**:
```typescript
{
  campaignId: string;
  fields?: string[];          // Specific fields to retrieve
}
```

**Output**: Detailed campaign object

**Annotations**: `readOnlyHint: true`

##### `create_campaign`
**Description**: Create a new advertising campaign

**Input Schema**:
```typescript
{
  accountId: string;
  name: string;               // 1-255 characters
  objective: CampaignObjective;
  status?: 'ACTIVE' | 'PAUSED'; // Default PAUSED
  dailyBudget?: number;       // Cents, mutually exclusive with lifetimeBudget
  lifetimeBudget?: number;    // Cents, requires startTime and endTime
  bidStrategy?: 'LOWEST_COST_WITHOUT_CAP' | 'LOWEST_COST_WITH_BID_CAP' | 'COST_CAP' | 'LOWEST_COST_WITH_MIN_ROAS';
  specialAdCategories?: ('CREDIT' | 'EMPLOYMENT' | 'HOUSING')[];
  startTime?: string;         // ISO 8601 format
  endTime?: string;           // ISO 8601 format
}
```

**Output**: Created campaign object with ID

**Annotations**: `openWorldHint: true`

##### `update_campaign`
**Description**: Update existing campaign properties

**Input Schema**:
```typescript
{
  campaignId: string;
  name?: string;
  status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  dailyBudget?: number;
  lifetimeBudget?: number;
  bidStrategy?: string;
}
```

**Output**: Success confirmation with updated fields

**Annotations**: `openWorldHint: true`, `idempotentHint: true`

##### `delete_campaign`
**Description**: Delete (archive) a campaign

**Input Schema**:
```typescript
{
  campaignId: string;
  permanent?: boolean;        // Default false (archives instead)
}
```

**Output**: Success confirmation

**Annotations**: `openWorldHint: true`

### 2. Ad Set Management

#### Tools

##### `list_adsets`
**Description**: Retrieve ad sets from campaign or account

**Input Schema**:
```typescript
{
  accountId?: string;         // List all ad sets in account
  campaignId?: string;        // List ad sets in specific campaign
  status?: AdSetStatus;
  effectiveStatus?: string;   // Runtime status
  limit?: number;
  fields?: string[];
}
```

**Output**: Array of ad set objects

**Annotations**: `readOnlyHint: true`

##### `get_adset`
**Description**: Get detailed ad set information

**Input Schema**:
```typescript
{
  adSetId: string;
  fields?: string[];
}
```

**Output**: Detailed ad set object with targeting, placement, optimization info

**Annotations**: `readOnlyHint: true`

##### `create_adset`
**Description**: Create a new ad set with targeting and optimization settings

**Input Schema**:
```typescript
{
  accountId: string;
  campaignId: string;
  name: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
  bidAmount?: number;
  billingEvent?: 'IMPRESSIONS' | 'LINK_CLICKS' | 'POST_ENGAGEMENT';
  optimizationGoal: OptimizationGoal;
  targeting: TargetingSpec;   // Complex nested object
  startTime?: string;
  endTime?: string;
  status?: 'ACTIVE' | 'PAUSED';
}
```

**Targeting Spec Structure**:
```typescript
{
  geoLocations: {
    countries?: string[];     // ISO 3166-1 alpha-2 codes
    cities?: Array<{ key: string; radius?: number; distance_unit?: 'mile' | 'kilometer' }>;
    regions?: Array<{ key: string }>;
    zips?: Array<{ key: string }>;
    location_types?: ('home' | 'recent')[];
  };
  ageMin?: number;            // 13-65+
  ageMax?: number;
  genders?: (1 | 2)[];        // 1=male, 2=female
  locales?: string[];         // Language codes
  interests?: Array<{ id: string; name?: string }>;
  behaviors?: Array<{ id: string; name?: string }>;
  lifeEvents?: Array<{ id: string }>;
  customAudiences?: Array<{ id: string }>;
  excludedCustomAudiences?: Array<{ id: string }>;
  flexibleSpec?: any[];       // Advanced AND/OR targeting logic
  publisherPlatforms?: ('facebook' | 'instagram' | 'audience_network' | 'messenger')[];
  facebookPositions?: string[];
  instagramPositions?: string[];
  devicePlatforms?: ('mobile' | 'desktop')[];
  userDevice?: string[];
  userOs?: string[];
}
```

**Output**: Created ad set object with ID

**Annotations**: `openWorldHint: true`

##### `update_adset`
**Description**: Update ad set properties

**Input Schema**:
```typescript
{
  adSetId: string;
  name?: string;
  status?: AdSetStatus;
  dailyBudget?: number;
  lifetimeBudget?: number;
  bidAmount?: number;
  targeting?: TargetingSpec;  // Partial updates supported
}
```

**Output**: Success confirmation

**Annotations**: `openWorldHint: true`, `idempotentHint: true`

##### `duplicate_adset`
**Description**: Clone an existing ad set with optional modifications

**Input Schema**:
```typescript
{
  adSetId: string;
  newName: string;
  modifications?: {
    dailyBudget?: number;
    targeting?: Partial<TargetingSpec>;
    status?: AdSetStatus;
  };
}
```

**Output**: New ad set object

**Annotations**: `openWorldHint: true`

### 3. Ad Management

#### Tools

##### `list_ads`
**Description**: Retrieve ads from ad set, campaign, or account

**Input Schema**:
```typescript
{
  accountId?: string;
  campaignId?: string;
  adSetId?: string;
  status?: AdStatus;
  effectiveStatus?: string[];
  limit?: number;
  fields?: string[];
}
```

**Output**: Array of ad objects

**Annotations**: `readOnlyHint: true`

##### `get_ad`
**Description**: Get detailed ad information including creative

**Input Schema**:
```typescript
{
  adId: string;
  fields?: string[];
}
```

**Output**: Detailed ad object with creative details

**Annotations**: `readOnlyHint: true`

##### `create_ad`
**Description**: Create a new ad

**Input Schema**:
```typescript
{
  accountId: string;
  adSetId: string;
  name: string;
  creativeId: string;         // Reference to existing creative
  status?: 'ACTIVE' | 'PAUSED';
}
```

**Output**: Created ad object with ID

**Annotations**: `openWorldHint: true`

##### `update_ad`
**Description**: Update ad properties

**Input Schema**:
```typescript
{
  adId: string;
  name?: string;
  status?: AdStatus;
  creativeId?: string;        // Replace creative
}
```

**Output**: Success confirmation

**Annotations**: `openWorldHint: true`, `idempotentHint: true`

### 4. Creative Management

#### Tools

##### `list_creatives`
**Description**: List ad creatives in account

**Input Schema**:
```typescript
{
  accountId: string;
  limit?: number;
  fields?: string[];
}
```

**Output**: Array of creative objects

**Annotations**: `readOnlyHint: true`

##### `get_creative`
**Description**: Get detailed creative information

**Input Schema**:
```typescript
{
  creativeId: string;
  fields?: string[];
}
```

**Output**: Creative object with full specifications

**Annotations**: `readOnlyHint: true`

##### `create_creative_single_image`
**Description**: Create a single image ad creative

**Input Schema**:
```typescript
{
  accountId: string;
  name: string;
  pageId: string;             // Facebook page ID
  instagramActorId?: string;  // Instagram account ID
  imageHash: string;          // From upload_image tool
  title: string;              // Headline
  body: string;               // Primary text
  linkUrl: string;            // Destination URL
  linkDescription?: string;   // Link description
  callToActionType?: 'LEARN_MORE' | 'SHOP_NOW' | 'SIGN_UP' | 'DOWNLOAD' | 'BOOK_NOW' | 'CONTACT_US' | 'GET_QUOTE' | 'SUBSCRIBE' | 'NO_BUTTON';
  urlTags?: string;           // UTM parameters
}
```

**Output**: Created creative object with ID

**Annotations**: `openWorldHint: true`

##### `create_creative_video`
**Description**: Create a video ad creative

**Input Schema**:
```typescript
{
  accountId: string;
  name: string;
  pageId: string;
  instagramActorId?: string;
  videoId: string;            // From upload_video tool
  title: string;
  body: string;
  linkUrl: string;
  callToActionType?: string;
  thumbnailUrl?: string;
}
```

**Output**: Created creative object with ID

**Annotations**: `openWorldHint: true`

##### `create_creative_carousel`
**Description**: Create a carousel ad creative with multiple cards

**Input Schema**:
```typescript
{
  accountId: string;
  name: string;
  pageId: string;
  instagramActorId?: string;
  cards: Array<{
    imageHash?: string;
    videoId?: string;
    title: string;
    body: string;
    linkUrl: string;
    callToActionType?: string;
  }>;
  body: string;               // Primary text for whole carousel
}
```

**Output**: Created creative object with ID

**Annotations**: `openWorldHint: true`

##### `upload_image`
**Description**: Upload an image to use in creatives

**Input Schema**:
```typescript
{
  accountId: string;
  filePath: string;           // Local file path or URL
  name?: string;
}
```

**Output**: Image hash and ID for use in creatives

**Annotations**: `openWorldHint: true`

##### `upload_video`
**Description**: Upload a video to use in creatives

**Input Schema**:
```typescript
{
  accountId: string;
  filePath: string;           // Local file path or URL
  title?: string;
  description?: string;
}
```

**Output**: Video ID for use in creatives

**Annotations**: `openWorldHint: true`

### 5. Insights & Analytics

#### Tools

##### `get_campaign_insights`
**Description**: Retrieve performance metrics for campaigns

**Input Schema**:
```typescript
{
  campaignId: string;
  datePreset?: 'today' | 'yesterday' | 'last_7d' | 'last_14d' | 'last_30d' | 'last_90d' | 'lifetime';
  timeRange?: {
    since: string;            // YYYY-MM-DD
    until: string;            // YYYY-MM-DD
  };
  level?: 'campaign' | 'adset' | 'ad';
  breakdowns?: ('age' | 'gender' | 'country' | 'region' | 'dma' | 'placement' | 'device_platform' | 'publisher_platform' | 'product_id')[];
  timeIncrement?: number;     // 1=daily, monthly, all_days
  fields?: string[];          // Specific metrics
  actionAttributionWindows?: string[];
}
```

**Default Metrics**: spend, impressions, reach, frequency, clicks, unique_clicks, ctr, cpc, cpm, cpp

**Output**: Array of insight objects with requested metrics and breakdowns

**Annotations**: `readOnlyHint: true`

##### `get_adset_insights`
**Description**: Retrieve performance metrics for ad sets

**Input Schema**: Same as `get_campaign_insights` but with `adSetId`

**Output**: Ad set performance data

**Annotations**: `readOnlyHint: true`

##### `get_ad_insights`
**Description**: Retrieve performance metrics for specific ads

**Input Schema**: Same as `get_campaign_insights` but with `adId`

**Output**: Ad performance data

**Annotations**: `readOnlyHint: true`

##### `get_account_insights`
**Description**: Retrieve account-level performance overview

**Input Schema**:
```typescript
{
  accountId: string;
  datePreset?: string;
  timeRange?: { since: string; until: string };
  breakdowns?: string[];
  fields?: string[];
}
```

**Output**: Account-level metrics

**Annotations**: `readOnlyHint: true`

##### `get_conversion_metrics`
**Description**: Retrieve conversion and action data

**Input Schema**:
```typescript
{
  entityId: string;           // Campaign, ad set, or ad ID
  entityType: 'campaign' | 'adset' | 'ad';
  datePreset?: string;
  actionTypes?: string[];     // Filter specific action types
}
```

**Output**: Detailed conversion data with action types, values, and attribution

**Annotations**: `readOnlyHint: true`

### 6. Audience Management

#### Tools

##### `list_audiences`
**Description**: List custom and saved audiences

**Input Schema**:
```typescript
{
  accountId: string;
  type?: 'custom' | 'saved' | 'lookalike';
  fields?: string[];
}
```

**Output**: Array of audience objects

**Annotations**: `readOnlyHint: true`

##### `get_audience`
**Description**: Get detailed audience information

**Input Schema**:
```typescript
{
  audienceId: string;
  fields?: string[];
}
```

**Output**: Audience object with size, targeting specs, and metadata

**Annotations**: `readOnlyHint: true`

##### `create_custom_audience`
**Description**: Create a custom audience from customer data

**Input Schema**:
```typescript
{
  accountId: string;
  name: string;
  description?: string;
  subtype: 'CUSTOM' | 'WEBSITE' | 'APP' | 'OFFLINE_CONVERSION' | 'CLAIM' | 'PARTNER' | 'MANAGED' | 'VIDEO' | 'LOOKALIKE' | 'ENGAGEMENT' | 'DATA_SET' | 'BAG_OF_ACCOUNTS';
  customerFileSource?: 'USER_PROVIDED_ONLY' | 'PARTNER_PROVIDED_ONLY' | 'BOTH_USER_AND_PARTNER_PROVIDED';
}
```

**Output**: Created audience object with ID

**Annotations**: `openWorldHint: true`

##### `add_users_to_audience`
**Description**: Add users to a custom audience

**Input Schema**:
```typescript
{
  audienceId: string;
  schema: ('EMAIL' | 'PHONE' | 'MADID' | 'FN' | 'LN' | 'ZIP' | 'CT' | 'ST' | 'COUNTRY')[];
  data: string[][];           // Array of arrays matching schema
}
```

**Output**: Success confirmation with number of users added

**Annotations**: `openWorldHint: true`

##### `create_lookalike_audience`
**Description**: Create a lookalike audience from a source audience

**Input Schema**:
```typescript
{
  accountId: string;
  name: string;
  originAudienceId: string;
  country: string;            // Target country
  ratio: number;              // 0.01 to 0.20 (1% to 20%)
  description?: string;
}
```

**Output**: Created lookalike audience object

**Annotations**: `openWorldHint: true`

##### `create_saved_audience`
**Description**: Create a reusable saved audience with targeting criteria

**Input Schema**:
```typescript
{
  accountId: string;
  name: string;
  targeting: TargetingSpec;
  description?: string;
}
```

**Output**: Created saved audience object

**Annotations**: `openWorldHint: true`

### 7. Pixel & Conversion Tracking

#### Tools

##### `list_pixels`
**Description**: List Meta Pixels in account

**Input Schema**:
```typescript
{
  accountId: string;
}
```

**Output**: Array of pixel objects

**Annotations**: `readOnlyHint: true`

##### `get_pixel`
**Description**: Get pixel details and code

**Input Schema**:
```typescript
{
  pixelId: string;
  fields?: string[];
}
```

**Output**: Pixel object with code snippet and stats

**Annotations**: `readOnlyHint: true`

##### `create_pixel`
**Description**: Create a new Meta Pixel

**Input Schema**:
```typescript
{
  accountId: string;
  name: string;
}
```

**Output**: Created pixel object with code

**Annotations**: `openWorldHint: true`

##### `list_custom_conversions`
**Description**: List custom conversion events

**Input Schema**:
```typescript
{
  accountId: string;
}
```

**Output**: Array of custom conversion objects

**Annotations**: `readOnlyHint: true`

##### `create_custom_conversion`
**Description**: Create a custom conversion event

**Input Schema**:
```typescript
{
  accountId: string;
  pixelId: string;
  name: string;
  description?: string;
  customEventType: 'PURCHASE' | 'ADD_TO_CART' | 'LEAD' | 'COMPLETE_REGISTRATION' | 'SEARCH' | 'VIEW_CONTENT' | 'ADD_TO_WISHLIST' | 'INITIATE_CHECKOUT' | 'ADD_PAYMENT_INFO' | 'CONTACT' | 'CUSTOMIZE_PRODUCT' | 'DONATE' | 'FIND_LOCATION' | 'SCHEDULE' | 'START_TRIAL' | 'SUBMIT_APPLICATION' | 'SUBSCRIBE' | 'OTHER';
  rule: {
    url?: { contains?: string; equals?: string };
    event?: string;
  };
  defaultConversionValue?: number;
}
```

**Output**: Created custom conversion object

**Annotations**: `openWorldHint: true`

### 8. Budget & Bidding

#### Tools

##### `update_campaign_budget`
**Description**: Update campaign budget and bid strategy

**Input Schema**:
```typescript
{
  campaignId: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
  bidStrategy?: string;
  budgetRebalanceFlag?: boolean; // Enable Campaign Budget Optimization
}
```

**Output**: Success confirmation with new budget settings

**Annotations**: `openWorldHint: true`, `idempotentHint: true`

##### `update_adset_budget`
**Description**: Update ad set budget and bid

**Input Schema**:
```typescript
{
  adSetId: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
  bidAmount?: number;
}
```

**Output**: Success confirmation

**Annotations**: `openWorldHint: true`, `idempotentHint: true`

### 9. A/B Testing

#### Tools

##### `create_ab_test`
**Description**: Create a split test

**Input Schema**:
```typescript
{
  accountId: string;
  name: string;
  description?: string;
  type: 'SPLIT_TEST';
  cells: Array<{
    name: string;
    adsetIds: string[];
    budget: number;
  }>;
}
```

**Output**: Created A/B test object

**Annotations**: `openWorldHint: true`

##### `get_ab_test_results`
**Description**: Retrieve A/B test performance and winner

**Input Schema**:
```typescript
{
  testId: string;
}
```

**Output**: Test results with performance by cell and winner declaration

**Annotations**: `readOnlyHint: true`

### 10. Account & Asset Management

#### Tools

##### `list_ad_accounts`
**Description**: List accessible ad accounts

**Input Schema**: None (uses authenticated user)

**Output**: Array of ad account objects

**Annotations**: `readOnlyHint: true`

##### `get_ad_account`
**Description**: Get detailed account information

**Input Schema**:
```typescript
{
  accountId: string;
  fields?: string[];
}
```

**Output**: Account object with currency, timezone, spend limits, etc.

**Annotations**: `readOnlyHint: true`

##### `list_pages`
**Description**: List Facebook Pages accessible to authenticated user

**Input Schema**: None

**Output**: Array of page objects

**Annotations**: `readOnlyHint: true`

##### `list_instagram_accounts`
**Description**: List Instagram Business accounts

**Input Schema**:
```typescript
{
  pageId?: string;            // Get Instagram account for specific page
}
```

**Output**: Array of Instagram account objects

**Annotations**: `readOnlyHint: true`

### 11. Batch Operations

#### Tools

##### `batch_update_status`
**Description**: Update status for multiple entities at once

**Input Schema**:
```typescript
{
  entityType: 'campaign' | 'adset' | 'ad';
  updates: Array<{
    id: string;
    status: string;
  }>;
}
```

**Output**: Batch operation results with successes and failures

**Annotations**: `openWorldHint: true`

##### `batch_update_budgets`
**Description**: Update budgets for multiple entities

**Input Schema**:
```typescript
{
  entityType: 'campaign' | 'adset';
  updates: Array<{
    id: string;
    dailyBudget?: number;
    lifetimeBudget?: number;
  }>;
}
```

**Output**: Batch operation results

**Annotations**: `openWorldHint: true`

## Non-Functional Requirements

### Performance

1. **Response Time**
   - Read operations (list, get): < 2 seconds
   - Write operations (create, update): < 3 seconds
   - Insights queries: < 5 seconds
   - Batch operations: < 10 seconds

2. **Throughput**
   - Support up to 80% of Meta rate limits
   - Automatic throttling at 80% capacity
   - Concurrent request handling (up to 5 parallel)

3. **Pagination**
   - Default limit: 100 items
   - Maximum limit: 500 items
   - Automatic cursor-based pagination for large datasets

### Reliability

1. **Error Handling**
   - Exponential backoff with jitter (1s base, 32s max)
   - Maximum 5 retry attempts
   - Distinguish retriable vs. permanent errors
   - Return structured error responses with fbtraceId

2. **Rate Limiting**
   - Monitor `X-Business-Use-Case-Usage` header
   - Track call_count, total_cputime, total_time
   - Proactive throttling at 80% threshold
   - Automatic cooldown periods

3. **Circuit Breaker**
   - Open circuit after 5 consecutive failures
   - Half-open state after 30 seconds
   - Closed after 3 successful requests

### Security

1. **Authentication**
   - Support environment variable tokens (development)
   - OAuth 2.1 with PKCE (production)
   - System user tokens (enterprise)
   - Token validation before operations

2. **Authorization**
   - Scope validation per tool
   - Required scopes: `ads_management`, `ads_read`, `business_management`
   - Optional scopes: `pages_read_engagement`, `instagram_basic`, `leads_retrieval`

3. **Data Protection**
   - No logging of access tokens
   - Secure token storage (environment, vault)
   - Token rotation support
   - HTTPS-only API communication

4. **Input Validation**
   - Zod schema validation for all inputs
   - Sanitize user-provided data
   - Validate account ID access rights
   - Prevent injection attacks

### Scalability

1. **Multi-Account Support**
   - Support multiple ad accounts per user
   - Account-level configuration
   - Concurrent account operations

2. **Caching Strategy** (Optional)
   - Cache account metadata (15 minutes)
   - Cache audience sizes (1 hour)
   - Cache-Control header respect
   - Redis for distributed caching

3. **Resource Management**
   - Connection pooling
   - Memory-efficient pagination
   - Stream large result sets
   - Graceful degradation

### Observability

1. **Logging**
   - Structured JSON logs to stderr
   - Log levels: ERROR, WARN, INFO, DEBUG
   - Contextual metadata (accountId, campaignId, etc.)
   - Request/response correlation IDs

2. **Metrics** (Optional)
   - Request count by tool
   - Error rate by error type
   - API latency percentiles
   - Rate limit usage

3. **Debugging**
   - MCP Inspector compatibility
   - Debug mode (env variable)
   - Meta SDK debug logging
   - Request/response logging (dev only)

### User Experience

1. **Error Messages**
   - Clear, actionable error descriptions
   - Include remedy suggestions
   - Link to relevant documentation
   - Expose Meta's error details when helpful

2. **Tool Descriptions**
   - Natural language friendly
   - Include examples in descriptions
   - Document all parameters
   - Specify units (cents for money, etc.)

3. **Response Format**
   - Human-readable text content
   - Structured data for programmatic use
   - Consistent field naming
   - ISO 8601 dates, UTC timezone

4. **Documentation**
   - Comprehensive README
   - Setup guide with examples
   - Tool reference documentation
   - Troubleshooting guide

## Technology Stack

### Core Dependencies

```json
{
  "@modelcontextprotocol/sdk": "^1.20.0",
  "facebook-nodejs-business-sdk": "^22.0.2",
  "zod": "^3.24.0"
}
```

### Optional Dependencies

```json
{
  "express": "^4.18.0",          // HTTP transport
  "cors": "^2.8.5",              // HTTP CORS
  "ioredis": "^5.3.0",           // Caching & sessions
  "winston": "^3.11.0"           // Structured logging
}
```

### Development Dependencies

```json
{
  "@types/node": "^20.11.0",
  "typescript": "^5.3.0",
  "tsx": "^4.7.0",               // Development server
  "@types/express": "^4.17.21"
}
```

### Build Configuration

- **TypeScript**: ES2022, strict mode, ESM modules
- **Node.js**: >= 20.0.0
- **Package Type**: ESM (`"type": "module"`)

## Project Structure

```
meta-ads-mcp-server/
├── src/
│   ├── index.ts                    # Main entry point (stdio)
│   ├── http-server.ts              # HTTP transport entry point
│   │
│   ├── config/
│   │   ├── auth.config.ts          # Authentication configuration
│   │   └── meta.config.ts          # Meta API configuration
│   │
│   ├── services/
│   │   ├── meta-ads.service.ts     # Core Meta Ads service
│   │   ├── campaign.service.ts     # Campaign operations
│   │   ├── adset.service.ts        # Ad set operations
│   │   ├── ad.service.ts           # Ad operations
│   │   ├── creative.service.ts     # Creative operations
│   │   ├── insights.service.ts     # Analytics operations
│   │   ├── audience.service.ts     # Audience operations
│   │   └── asset.service.ts        # Media upload operations
│   │
│   ├── tools/
│   │   ├── campaign.tools.ts       # Campaign tool definitions
│   │   ├── adset.tools.ts          # Ad set tool definitions
│   │   ├── ad.tools.ts             # Ad tool definitions
│   │   ├── creative.tools.ts       # Creative tool definitions
│   │   ├── insights.tools.ts       # Analytics tool definitions
│   │   ├── audience.tools.ts       # Audience tool definitions
│   │   ├── pixel.tools.ts          # Pixel & conversion tools
│   │   ├── budget.tools.ts         # Budget management tools
│   │   ├── batch.tools.ts          # Batch operation tools
│   │   └── account.tools.ts        # Account & asset tools
│   │
│   ├── utils/
│   │   ├── retry.ts                # Exponential backoff
│   │   ├── rate-limiter.ts         # Rate limit monitoring
│   │   ├── error-handler.ts        # Error handling utilities
│   │   ├── logger.ts               # Structured logging
│   │   ├── validator.ts            # Input validation helpers
│   │   └── pagination.ts           # Pagination utilities
│   │
│   └── types/
│       ├── meta-ads.types.ts       # Meta Ads type definitions
│       ├── mcp.types.ts            # MCP extension types
│       └── config.types.ts         # Configuration types
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   ├── tools/
│   │   └── utils/
│   ├── integration/
│   │   └── meta-api.test.ts
│   └── fixtures/
│       └── mock-responses.ts
│
├── docs/
│   ├── README.md                   # Main documentation
│   ├── SETUP.md                    # Setup guide
│   ├── TOOLS.md                    # Tool reference
│   ├── EXAMPLES.md                 # Usage examples
│   └── TROUBLESHOOTING.md          # Common issues
│
├── .env.example                    # Environment template
├── package.json
├── tsconfig.json
└── LICENSE
```

## Configuration

### Environment Variables

```bash
# Required
META_ACCESS_TOKEN=your_access_token_here

# Optional
META_API_VERSION=v22.0                # Default: v22.0
META_APP_ID=your_app_id               # For OAuth
META_APP_SECRET=your_app_secret       # For OAuth
AUTH_MODE=token                       # token | oauth
NODE_ENV=production                   # development | production
DEBUG=false                           # Enable debug logging
LOG_LEVEL=info                        # error | warn | info | debug

# Rate Limiting
RATE_LIMIT_THRESHOLD=80               # Percentage (default 80)

# HTTP Transport (Optional)
HTTP_PORT=3000
ENABLE_CORS=true
SESSION_SECRET=random_secret
REDIS_URL=redis://localhost:6379
```

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "meta-ads": {
      "command": "node",
      "args": ["/path/to/meta-ads-mcp-server/build/index.js"],
      "env": {
        "META_ACCESS_TOKEN": "your_token_here",
        "META_API_VERSION": "v22.0"
      }
    }
  }
}
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Basic MCP server with read-only campaign operations

**Deliverables**:
- Project scaffolding with TypeScript
- Basic MetaAdsService with SDK initialization
- Campaign listing and retrieval tools
- Stdio transport with MCP server
- Error handling utilities
- Environment configuration
- Basic logging

**Success Criteria**:
- Can list campaigns from test account
- Can get campaign details
- Proper error handling and retry logic
- MCP Inspector compatibility

### Phase 2: Core Write Operations (Week 2)
**Goal**: Campaign, ad set, and ad creation/updates

**Deliverables**:
- Campaign CRUD operations
- Ad set CRUD operations
- Ad CRUD operations
- Input validation with Zod
- Rate limit monitoring
- Comprehensive error messages

**Success Criteria**:
- Can create campaigns, ad sets, ads
- Can update statuses and budgets
- Handles rate limits gracefully
- Clear error messages for common issues

### Phase 3: Creative & Media (Week 3)
**Goal**: Creative management and media uploads

**Deliverables**:
- Image upload tool
- Video upload tool
- Single image creative creation
- Video creative creation
- Carousel creative creation
- Creative listing and retrieval

**Success Criteria**:
- Can upload images and videos
- Can create all creative types
- Media processing status monitoring

### Phase 4: Analytics & Insights (Week 4)
**Goal**: Comprehensive reporting capabilities

**Deliverables**:
- Campaign insights tool
- Ad set insights tool
- Ad insights tool
- Account insights tool
- Conversion metrics tool
- Support for breakdowns and custom date ranges
- Efficient pagination for large datasets

**Success Criteria**:
- Can retrieve performance data
- Breakdowns work correctly
- Custom date ranges supported
- Handles large datasets efficiently

### Phase 5: Advanced Features (Week 5)
**Goal**: Audiences, pixels, and advanced operations

**Deliverables**:
- Audience management tools
- Custom audience creation
- Lookalike audience creation
- Pixel management
- Custom conversion tracking
- A/B testing tools
- Batch operation tools

**Success Criteria**:
- Full audience lifecycle management
- Pixel and conversion tracking setup
- Batch operations for efficiency

### Phase 6: Production Hardening (Week 6)
**Goal**: Enterprise-ready reliability and security

**Deliverables**:
- OAuth 2.1 with PKCE implementation
- Token rotation support
- Circuit breaker pattern
- Enhanced logging with correlation IDs
- HTTP transport with sessions
- Comprehensive testing
- Documentation completion

**Success Criteria**:
- OAuth flow working end-to-end
- Zero production incidents during testing
- Full test coverage (>80%)
- Complete documentation

## Testing Strategy

### Unit Tests

```typescript
// Example: Campaign service tests
describe('MetaAdsService.getCampaigns', () => {
  test('returns campaigns with default fields', async () => {
    // Mock Meta SDK response
    const service = new MetaAdsService({ accessToken: 'test' });
    const campaigns = await service.getCampaigns('123456789');
    expect(campaigns).toBeInstanceOf(Array);
  });

  test('filters by status', async () => {
    const service = new MetaAdsService({ accessToken: 'test' });
    const campaigns = await service.getCampaigns('123456789', {
      status: 'ACTIVE'
    });
    expect(campaigns.every(c => c.status === 'ACTIVE')).toBe(true);
  });

  test('handles rate limit errors with retry', async () => {
    // Mock rate limit error then success
    const service = new MetaAdsService({ accessToken: 'test' });
    const campaigns = await service.getCampaigns('123456789');
    expect(campaigns).toBeDefined();
  });
});
```

### Integration Tests

```typescript
// Example: Full tool execution test
describe('list_campaigns tool', () => {
  test('executes successfully with valid account', async () => {
    const result = await executeTool('list_campaigns', {
      accountId: process.env.TEST_ACCOUNT_ID,
      limit: 10
    });

    expect(result.isError).toBe(false);
    expect(result.structuredContent.campaigns).toBeInstanceOf(Array);
  });

  test('returns error for invalid account', async () => {
    const result = await executeTool('list_campaigns', {
      accountId: 'invalid_account'
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Invalid account');
  });
});
```

### MCP Inspector Testing

```bash
# Launch server in inspector
npx @modelcontextprotocol/inspector build/index.js

# Test in browser at http://localhost:6274
# - View available tools
# - Test tool invocations
# - Inspect responses
# - Debug errors
```

## Documentation Requirements

### README.md
- Project overview and features
- Quick start guide
- Installation instructions
- Basic usage examples
- Configuration reference
- Contributing guidelines

### SETUP.md
- Detailed setup instructions
- Meta developer account setup
- Access token generation
- App creation and configuration
- Permission configuration
- Claude Desktop integration
- Troubleshooting common setup issues

### TOOLS.md
- Complete tool reference
- Parameter descriptions with types
- Example usage for each tool
- Response format documentation
- Common patterns and workflows

### EXAMPLES.md
- Real-world usage scenarios
- Multi-step workflows
- Campaign creation examples
- Analytics queries
- Audience building
- Batch operations

### TROUBLESHOOTING.md
- Common errors and solutions
- Rate limiting issues
- Authentication problems
- Permission errors
- API version compatibility
- Debug mode usage

## Success Criteria

### Functional Completeness
- ✅ All 50+ tools implemented
- ✅ Full CRUD operations for core entities
- ✅ Advanced features (audiences, pixels, A/B testing)
- ✅ Batch operations for efficiency

### User Experience
- ✅ Clear, actionable error messages
- ✅ Natural language tool descriptions
- ✅ Comprehensive examples
- ✅ Fast response times (<3s average)

### Reliability
- ✅ 99.9% uptime during testing
- ✅ Automatic retry for transient errors
- ✅ Graceful rate limit handling
- ✅ Zero data loss

### Security
- ✅ OAuth 2.1 implementation
- ✅ Scope validation
- ✅ Secure token management
- ✅ No token leakage in logs

### Code Quality
- ✅ >80% test coverage
- ✅ TypeScript strict mode
- ✅ ESLint compliance
- ✅ Comprehensive documentation

### Performance
- ✅ Handles 1000+ API calls/hour
- ✅ Efficient pagination
- ✅ Memory usage <100MB
- ✅ CPU usage <10% average

## Risk Management

### Technical Risks

1. **Meta API Changes**
   - **Risk**: API version deprecation, breaking changes
   - **Mitigation**: Version pinning, API version configuration, deprecation monitoring

2. **Rate Limiting**
   - **Risk**: Exceeding rate limits, service blocking
   - **Mitigation**: Proactive throttling, usage monitoring, exponential backoff

3. **Authentication Issues**
   - **Risk**: Token expiration, permission changes
   - **Mitigation**: Token refresh logic, graceful error handling, clear error messages

4. **Large Data Sets**
   - **Risk**: Memory exhaustion, timeout errors
   - **Mitigation**: Streaming pagination, result limits, chunked processing

### Operational Risks

1. **User Configuration Errors**
   - **Risk**: Invalid tokens, wrong account IDs, missing permissions
   - **Mitigation**: Validation on startup, clear setup documentation, helpful error messages

2. **Concurrent Operations**
   - **Risk**: Race conditions, state inconsistency
   - **Mitigation**: Idempotent operations, optimistic locking where needed

3. **Network Failures**
   - **Risk**: Transient errors, partial failures
   - **Mitigation**: Retry logic, circuit breaker, graceful degradation

## Future Enhancements

### Phase 7+ (Post-MVP)

1. **Advanced Analytics**
   - Custom metric calculations
   - Comparative analysis tools
   - Anomaly detection
   - ROI calculators

2. **Automation Features**
   - Scheduled budget adjustments
   - Rule-based optimizations
   - Automated reporting
   - Alert triggers

3. **Multi-Platform Support**
   - Cross-platform campaign creation
   - Unified reporting
   - Platform-specific optimizations

4. **AI-Powered Features**
   - Creative suggestions
   - Audience recommendations
   - Bid optimization suggestions
   - Performance predictions

5. **Collaboration Features**
   - Multi-user access
   - Change approvals
   - Audit logs
   - Team notifications

6. **Enhanced Monitoring**
   - Real-time dashboards
   - Performance alerting
   - Budget monitoring
   - Anomaly detection

## Appendix

### Meta API Resources
- Marketing API Documentation: https://developers.facebook.com/docs/marketing-apis
- Graph API Explorer: https://developers.facebook.com/tools/explorer
- Business SDK for Node.js: https://github.com/facebook/facebook-nodejs-business-sdk
- API Changelog: https://developers.facebook.com/docs/graph-api/changelog

### MCP Resources
- MCP Specification: https://modelcontextprotocol.io/
- TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- MCP Inspector: https://github.com/modelcontextprotocol/inspector
- Claude Desktop Configuration: https://docs.anthropic.com/claude/docs/mcp

### Type Definitions

#### CampaignObjective
```typescript
type CampaignObjective =
  | 'OUTCOME_TRAFFIC'
  | 'OUTCOME_SALES'
  | 'OUTCOME_LEADS'
  | 'OUTCOME_AWARENESS'
  | 'OUTCOME_ENGAGEMENT'
  | 'OUTCOME_APP_PROMOTION';
```

#### OptimizationGoal
```typescript
type OptimizationGoal =
  | 'REACH'
  | 'IMPRESSIONS'
  | 'LINK_CLICKS'
  | 'LANDING_PAGE_VIEWS'
  | 'POST_ENGAGEMENT'
  | 'VIDEO_VIEWS'
  | 'LEAD_GENERATION'
  | 'OFFSITE_CONVERSIONS'
  | 'VALUE'
  | 'APP_INSTALLS'
  | 'CONVERSATIONS';
```

#### AdStatus
```typescript
type AdStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'DELETED'
  | 'ARCHIVED'
  | 'IN_PROCESS'
  | 'WITH_ISSUES';
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-22
**Author**: Meta Ads MCP Server Team
**Status**: Final - Ready for Implementation
