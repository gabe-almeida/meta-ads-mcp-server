# Meta Ads MCP Server - Implementation Tasks

## Task Breakdown

This document provides a detailed, sequential task breakdown for implementing the Meta Ads MCP Server. Tasks are organized by implementation phase and marked with priority levels.

---

## Phase 1: Foundation (Week 1)

### 1.1 Project Setup
**Priority**: P0 (Blocker)
**Estimated Time**: 2 hours

- [ ] Initialize npm project with `npm init`
- [ ] Configure package.json with ESM type and dependencies
- [ ] Install core dependencies: `@modelcontextprotocol/sdk`, `facebook-nodejs-business-sdk`, `zod`
- [ ] Install dev dependencies: `typescript`, `tsx`, `@types/node`
- [ ] Create tsconfig.json with strict mode and ESM target
- [ ] Set up directory structure (src/, tests/, docs/)
- [ ] Create .gitignore with node_modules, build/, .env
- [ ] Create .env.example template
- [ ] Initialize git repository
- [ ] Create README.md skeleton

**Acceptance Criteria**:
- `npm install` completes without errors
- TypeScript compiles successfully
- Directory structure matches spec

### 1.2 Configuration System
**Priority**: P0 (Blocker)
**Estimated Time**: 3 hours

- [ ] Create `src/types/config.types.ts` with configuration interfaces
- [ ] Create `src/config/auth.config.ts` for authentication settings
- [ ] Implement environment variable loading with Zod validation
- [ ] Create `src/config/meta.config.ts` for Meta API settings
- [ ] Add default values for optional configuration
- [ ] Implement configuration error handling
- [ ] Add configuration validation tests

**Acceptance Criteria**:
- Can load and validate META_ACCESS_TOKEN
- Throws clear errors for missing required config
- Supports optional configuration with defaults
- Config validation tests pass

### 1.3 Core Service Layer
**Priority**: P0 (Blocker)
**Estimated Time**: 4 hours

- [ ] Create `src/types/meta-ads.types.ts` with type definitions
- [ ] Create `src/services/meta-ads.service.ts` base class
- [ ] Initialize FacebookAdsApi in constructor
- [ ] Implement pagination helper method `paginateAll()`
- [ ] Create `src/utils/logger.ts` with structured logging
- [ ] Add debug mode support
- [ ] Implement basic error wrapping
- [ ] Add service initialization tests

**Acceptance Criteria**:
- MetaAdsService initializes with valid token
- Pagination helper handles cursors correctly
- Logger writes to stderr (not stdout)
- Service tests pass with mocked SDK

### 1.4 Error Handling Utilities
**Priority**: P0 (Blocker)
**Estimated Time**: 4 hours

- [ ] Create `src/utils/error-handler.ts`
- [ ] Define `MetaAdsError` class with code, type, statusCode
- [ ] Implement `handleMetaApiError()` function
- [ ] Add `isRetriable()` method for error classification
- [ ] Create error type constants
- [ ] Implement error message formatting
- [ ] Add error handling tests
- [ ] Document common error codes

**Acceptance Criteria**:
- Distinguishes retriable vs. permanent errors
- Preserves fbtraceId for debugging
- Clear error messages with remediation hints
- Error handler tests cover all error types

### 1.5 Retry Logic with Exponential Backoff
**Priority**: P0 (Blocker)
**Estimated Time**: 3 hours

- [ ] Create `src/utils/retry.ts`
- [ ] Implement `ExponentialBackoff` class
- [ ] Add configurable base delay, max delay, max retries
- [ ] Implement jitter calculation (10% random)
- [ ] Add `isRetriable()` check for Meta error codes
- [ ] Implement `sleep()` helper
- [ ] Add retry logging
- [ ] Create retry tests with mocked delays

**Acceptance Criteria**:
- Retries on codes 17, 4, 80004, 613, 429, 500-504
- Delays increase exponentially (1s, 2s, 4s, 8s, 16s, 32s)
- Jitter prevents thundering herd
- Retry tests verify exponential backoff behavior

### 1.6 Campaign Service Methods
**Priority**: P0 (Blocker)
**Estimated Time**: 5 hours

- [ ] Create `src/services/campaign.service.ts`
- [ ] Implement `getCampaigns(accountId, options)` method
- [ ] Implement `getCampaign(campaignId, fields)` method
- [ ] Implement `createCampaign(accountId, data)` method
- [ ] Implement `updateCampaign(campaignId, updates)` method
- [ ] Implement `deleteCampaign(campaignId)` method
- [ ] Add field filtering support
- [ ] Add status filtering support
- [ ] Wrap methods with retry logic
- [ ] Add service method tests

**Acceptance Criteria**:
- All CRUD operations work with test account
- Field filtering returns only requested fields
- Status filtering works correctly
- Retry logic applies to all methods
- Service tests pass with mocked SDK responses

### 1.7 Campaign Tools Implementation
**Priority**: P0 (Blocker)
**Estimated Time**: 6 hours

- [ ] Create `src/tools/campaign.tools.ts`
- [ ] Implement `list_campaigns` tool with Zod schema
- [ ] Implement `get_campaign` tool
- [ ] Implement `create_campaign` tool
- [ ] Implement `update_campaign` tool
- [ ] Implement `delete_campaign` tool
- [ ] Add clear tool descriptions
- [ ] Add parameter documentation in schemas
- [ ] Implement proper error responses with isError flag
- [ ] Add tool annotation hints
- [ ] Create tool registration function

**Acceptance Criteria**:
- All campaign tools registered successfully
- Zod validation rejects invalid inputs
- Error responses use isError instead of exceptions
- Tool descriptions are clear and helpful
- Structured content includes all relevant data

### 1.8 MCP Server Setup
**Priority**: P0 (Blocker)
**Estimated Time**: 4 hours

- [ ] Create `src/index.ts` main entry point
- [ ] Initialize McpServer with name and version
- [ ] Import and register campaign tools
- [ ] Set up stdio transport
- [ ] Implement graceful shutdown (SIGINT handler)
- [ ] Add server error handler
- [ ] Add startup logging
- [ ] Make build/index.js executable
- [ ] Test with MCP Inspector

**Acceptance Criteria**:
- Server starts without errors
- Campaign tools visible in MCP Inspector
- Can execute list_campaigns from Inspector
- Graceful shutdown on Ctrl+C
- Logs written to stderr

### 1.9 Basic Testing Infrastructure
**Priority**: P1 (High)
**Estimated Time**: 3 hours

- [ ] Create `tests/fixtures/mock-responses.ts`
- [ ] Add mock campaign data
- [ ] Create test utilities for service mocking
- [ ] Set up test script in package.json
- [ ] Add example unit test
- [ ] Add example integration test
- [ ] Document testing approach

**Acceptance Criteria**:
- `npm test` runs successfully
- Mock data represents real API responses
- Test utilities make mocking easy
- Tests can run offline with mocks

### 1.10 Phase 1 Documentation
**Priority**: P1 (High)
**Estimated Time**: 2 hours

- [ ] Write SETUP.md with token generation steps
- [ ] Document Claude Desktop configuration
- [ ] Add basic usage examples to README
- [ ] Document available campaign tools
- [ ] Add troubleshooting section
- [ ] Document environment variables

**Acceptance Criteria**:
- New user can set up from docs
- Claude Desktop integration works following docs
- All Phase 1 tools documented with examples

---

## Phase 2: Core Write Operations (Week 2)

### 2.1 Ad Set Service Methods
**Priority**: P0 (Blocker)
**Estimated Time**: 6 hours

- [ ] Create `src/services/adset.service.ts`
- [ ] Implement `getAdSets(options)` with account/campaign filtering
- [ ] Implement `getAdSet(adSetId, fields)` method
- [ ] Implement `createAdSet(accountId, data)` method
- [ ] Implement `updateAdSet(adSetId, updates)` method
- [ ] Implement `deleteAdSet(adSetId)` method
- [ ] Implement `duplicateAdSet(adSetId, modifications)` method
- [ ] Add comprehensive targeting spec handling
- [ ] Add placement validation
- [ ] Add service tests

**Acceptance Criteria**:
- All CRUD operations work
- Complex targeting specs handled correctly
- Placement validation prevents invalid combinations
- Tests cover edge cases

### 2.2 Targeting Schema Definition
**Priority**: P0 (Blocker)
**Estimated Time**: 4 hours

- [ ] Create comprehensive TargetingSpec interface in types
- [ ] Define Zod schema for geo_locations
- [ ] Define Zod schema for demographics (age, gender)
- [ ] Define Zod schema for interests and behaviors
- [ ] Define Zod schema for custom audiences
- [ ] Define Zod schema for flexible_spec
- [ ] Define placement enums and schemas
- [ ] Add validation for placement conflicts
- [ ] Document targeting parameters
- [ ] Add targeting validation tests

**Acceptance Criteria**:
- Schema accepts all valid targeting combinations
- Schema rejects invalid combinations
- Clear validation error messages
- Documented targeting options

### 2.3 Ad Set Tools Implementation
**Priority**: P0 (Blocker)
**Estimated Time**: 6 hours

- [ ] Create `src/tools/adset.tools.ts`
- [ ] Implement `list_adsets` tool
- [ ] Implement `get_adset` tool
- [ ] Implement `create_adset` tool with full targeting
- [ ] Implement `update_adset` tool
- [ ] Implement `duplicate_adset` tool
- [ ] Add user-friendly targeting parameter descriptions
- [ ] Add examples in tool descriptions
- [ ] Register tools with server
- [ ] Add tool tests

**Acceptance Criteria**:
- All ad set tools work end-to-end
- Targeting parameters are user-friendly
- Can create ad sets with complex targeting
- Tool descriptions include examples

### 2.4 Ad Service Methods
**Priority**: P0 (Blocker)
**Estimated Time**: 4 hours

- [ ] Create `src/services/ad.service.ts`
- [ ] Implement `getAds(options)` with filtering
- [ ] Implement `getAd(adId, fields)` method
- [ ] Implement `createAd(accountId, data)` method
- [ ] Implement `updateAd(adId, updates)` method
- [ ] Implement `deleteAd(adId)` method
- [ ] Add effective status handling
- [ ] Add service tests

**Acceptance Criteria**:
- All CRUD operations work
- Can filter by multiple levels (account, campaign, ad set)
- Effective status correctly reported
- Tests pass

### 2.5 Ad Tools Implementation
**Priority**: P0 (Blocker)
**Estimated Time**: 4 hours

- [ ] Create `src/tools/ad.tools.ts`
- [ ] Implement `list_ads` tool
- [ ] Implement `get_ad` tool
- [ ] Implement `create_ad` tool
- [ ] Implement `update_ad` tool
- [ ] Register tools with server
- [ ] Add tool tests

**Acceptance Criteria**:
- All ad tools functional
- Can create and update ads
- Error messages are clear
- Tools integrated with server

### 2.6 Input Validation Helpers
**Priority**: P1 (High)
**Estimated Time**: 3 hours

- [ ] Create `src/utils/validator.ts`
- [ ] Add account ID validation (numeric, act_ prefix handling)
- [ ] Add budget validation (min values, mutual exclusivity)
- [ ] Add date validation (ISO 8601, future dates)
- [ ] Add status transition validation
- [ ] Add URL validation for link creatives
- [ ] Create reusable validation schemas
- [ ] Add validation tests

**Acceptance Criteria**:
- Common validation logic centralized
- Clear error messages on validation failures
- Prevents common user mistakes
- Validation tests cover edge cases

### 2.7 Rate Limit Monitoring
**Priority**: P1 (High)
**Estimated Time**: 4 hours

- [ ] Create `src/utils/rate-limiter.ts`
- [ ] Implement `MetaRateLimiter` class
- [ ] Parse `X-Business-Use-Case-Usage` header
- [ ] Track call_count, total_cputime, total_time
- [ ] Implement proactive throttling at 80% threshold
- [ ] Add automatic cooldown period
- [ ] Add rate limit logging
- [ ] Integrate with service layer
- [ ] Add rate limiter tests

**Acceptance Criteria**:
- Tracks usage from response headers
- Throttles at 80% capacity
- Prevents rate limit violations
- Logs rate limit warnings

### 2.8 Batch Operation Foundation
**Priority**: P2 (Medium)
**Estimated Time**: 3 hours

- [ ] Create `src/services/batch.service.ts`
- [ ] Implement parallel request handling with concurrency limit
- [ ] Implement batch error handling (partial failures)
- [ ] Add batch result aggregation
- [ ] Create batch response format
- [ ] Add batch service tests

**Acceptance Criteria**:
- Can execute multiple operations in parallel
- Handles partial failures gracefully
- Returns clear results for each operation
- Respects concurrency limits

### 2.9 Status Management Tools
**Priority**: P1 (High)
**Estimated Time**: 2 hours

- [ ] Add status update convenience methods to services
- [ ] Implement bulk status update helper
- [ ] Add status validation (valid transitions)
- [ ] Document status meanings and effects

**Acceptance Criteria**:
- Easy status updates across all entity types
- Invalid status transitions prevented
- Clear documentation of status effects

### 2.10 Phase 2 Documentation
**Priority**: P1 (High)
**Estimated Time**: 2 hours

- [ ] Document ad set creation workflow
- [ ] Add targeting examples
- [ ] Document placement options
- [ ] Add budget management examples
- [ ] Update TOOLS.md with new tools
- [ ] Add troubleshooting for common targeting errors

**Acceptance Criteria**:
- Complete workflow examples
- Targeting documentation is clear
- Common errors documented with solutions

---

## Phase 3: Creative & Media (Week 3)

### 3.1 Asset Upload Service
**Priority**: P0 (Blocker)
**Estimated Time**: 5 hours

- [ ] Create `src/services/asset.service.ts`
- [ ] Implement `uploadImage(accountId, filePath)` method
- [ ] Implement `uploadVideo(accountId, filePath)` method
- [ ] Add file validation (size, format, dimensions)
- [ ] Add URL upload support
- [ ] Implement upload progress tracking for videos
- [ ] Add upload retry logic
- [ ] Handle upload errors gracefully
- [ ] Add asset upload tests

**Acceptance Criteria**:
- Can upload images from local paths
- Can upload videos from local paths
- Can upload from URLs
- File validation prevents invalid uploads
- Returns hash/ID for use in creatives

### 3.2 Creative Service Methods
**Priority**: P0 (Blocker)
**Estimated Time**: 6 hours

- [ ] Create `src/services/creative.service.ts`
- [ ] Implement `getCreatives(accountId, options)` method
- [ ] Implement `getCreative(creativeId, fields)` method
- [ ] Implement `createImageCreative(accountId, spec)` method
- [ ] Implement `createVideoCreative(accountId, spec)` method
- [ ] Implement `createCarouselCreative(accountId, spec)` method
- [ ] Add object_story_spec builder helpers
- [ ] Add link_data formatting
- [ ] Add creative service tests

**Acceptance Criteria**:
- All creative types can be created
- Specs formatted correctly for Meta API
- Helper methods simplify spec building
- Tests cover all creative types

### 3.3 Creative Tools Implementation
**Priority**: P0 (Blocker)
**Estimated Time**: 7 hours

- [ ] Create `src/tools/creative.tools.ts`
- [ ] Implement `list_creatives` tool
- [ ] Implement `get_creative` tool
- [ ] Implement `upload_image` tool
- [ ] Implement `upload_video` tool
- [ ] Implement `create_creative_single_image` tool
- [ ] Implement `create_creative_video` tool
- [ ] Implement `create_creative_carousel` tool
- [ ] Add call-to-action type enums
- [ ] Add clear parameter descriptions
- [ ] Register tools with server
- [ ] Add tool tests

**Acceptance Criteria**:
- Can upload and create creatives end-to-end
- All creative types supported
- Parameter descriptions include examples
- Tools properly integrated

### 3.4 Creative Validation
**Priority**: P1 (High)
**Estimated Time**: 3 hours

- [ ] Add creative spec validation
- [ ] Validate image dimensions and aspect ratios
- [ ] Validate text length limits (headline, body)
- [ ] Validate URL formats
- [ ] Validate carousel requirements (min/max cards)
- [ ] Add validation error messages with limits
- [ ] Add creative validation tests

**Acceptance Criteria**:
- Validation prevents API errors
- Clear messages include acceptable ranges
- Validates all creative types
- Tests cover edge cases

### 3.5 Media Library Management
**Priority**: P2 (Medium)
**Estimated Time**: 4 hours

- [ ] Implement `listImages(accountId)` method
- [ ] Implement `listVideos(accountId)` method
- [ ] Implement `getImage(imageHash)` details
- [ ] Implement `getVideo(videoId)` details and status
- [ ] Add image search by hash
- [ ] Add video processing status checking
- [ ] Create corresponding tools
- [ ] Add tests

**Acceptance Criteria**:
- Can browse uploaded media
- Video processing status visible
- Can look up media by ID/hash

### 3.6 Dynamic Creative Optimization Support
**Priority**: P2 (Medium)
**Estimated Time**: 3 hours

- [ ] Add asset_feed_spec support
- [ ] Implement multi-asset creative creation
- [ ] Add asset variation helpers
- [ ] Document DCO best practices
- [ ] Add DCO tests

**Acceptance Criteria**:
- Can create DCO-enabled creatives
- Supports multiple headlines, images, descriptions
- Documentation explains DCO benefits

### 3.7 Creative Preview
**Priority**: P3 (Low)
**Estimated Time**: 2 hours

- [ ] Implement creative preview generation
- [ ] Add preview tool
- [ ] Support different placements for preview
- [ ] Add preview to tool responses where helpful

**Acceptance Criteria**:
- Can generate preview links
- Previews show placement variations

### 3.8 Phase 3 Documentation
**Priority**: P1 (High)
**Estimated Time**: 2 hours

- [ ] Document creative creation workflow
- [ ] Add media upload examples
- [ ] Document creative specifications
- [ ] Add carousel creation examples
- [ ] Document creative best practices
- [ ] Add troubleshooting for upload errors

**Acceptance Criteria**:
- Complete creative workflow documented
- Examples for all creative types
- Best practices clearly explained

---

## Phase 4: Analytics & Insights (Week 4)

### 4.1 Insights Service Methods
**Priority**: P0 (Blocker)
**Estimated Time**: 6 hours

- [ ] Create `src/services/insights.service.ts`
- [ ] Implement `getCampaignInsights(campaignId, params)` method
- [ ] Implement `getAdSetInsights(adSetId, params)` method
- [ ] Implement `getAdInsights(adId, params)` method
- [ ] Implement `getAccountInsights(accountId, params)` method
- [ ] Add breakdown support
- [ ] Add custom field selection
- [ ] Add date range handling
- [ ] Implement efficient pagination for insights
- [ ] Add insights service tests

**Acceptance Criteria**:
- All entity levels supported
- Breakdowns work correctly
- Custom date ranges supported
- Pagination handles large datasets
- Tests validate data structure

### 4.2 Insights Tools Implementation
**Priority**: P0 (Blocker)
**Estimated Time**: 5 hours

- [ ] Create `src/tools/insights.tools.ts`
- [ ] Implement `get_campaign_insights` tool
- [ ] Implement `get_adset_insights` tool
- [ ] Implement `get_ad_insights` tool
- [ ] Implement `get_account_insights` tool
- [ ] Add clear metric descriptions
- [ ] Add breakdown documentation
- [ ] Add date preset enums
- [ ] Register tools with server
- [ ] Add tool tests

**Acceptance Criteria**:
- All insights tools functional
- Metric names and descriptions clear
- Breakdowns easy to use
- Date presets convenient

### 4.3 Conversion Metrics Handling
**Priority**: P1 (High)
**Estimated Time**: 4 hours

- [ ] Implement `getConversionMetrics(entityId, params)` method
- [ ] Parse actions array from insights
- [ ] Add action type filtering
- [ ] Add conversion value extraction
- [ ] Create `get_conversion_metrics` tool
- [ ] Add attribution window support
- [ ] Document action types
- [ ] Add conversion tests

**Acceptance Criteria**:
- Conversion data correctly parsed
- Action types filtered properly
- Attribution windows supported
- Clear documentation of action types

### 4.4 Metric Formatting & Presentation
**Priority**: P1 (High)
**Estimated Time**: 3 hours

- [ ] Create `src/utils/formatter.ts`
- [ ] Implement currency formatting
- [ ] Implement percentage formatting
- [ ] Implement large number formatting (K, M, B)
- [ ] Add metric comparison helpers
- [ ] Add formatted output to insights responses
- [ ] Add formatter tests

**Acceptance Criteria**:
- Numbers formatted for readability
- Currency respects account settings
- Percentages displayed correctly
- Comparisons show change clearly

### 4.5 Pagination for Large Datasets
**Priority**: P1 (High)
**Estimated Time**: 3 hours

- [ ] Create `src/utils/pagination.ts`
- [ ] Implement streaming pagination for insights
- [ ] Add result limiting
- [ ] Add cursor management
- [ ] Implement batched result fetching
- [ ] Add pagination tests

**Acceptance Criteria**:
- Handles datasets > 1000 rows
- Memory efficient
- Respects result limits
- Cursors managed correctly

### 4.6 Insights Aggregation
**Priority**: P2 (Medium)
**Estimated Time**: 4 hours

- [ ] Implement totals calculation across breakdowns
- [ ] Add time series aggregation
- [ ] Implement percentage calculations
- [ ] Add year-over-year comparison helpers
- [ ] Create aggregation tool
- [ ] Add aggregation tests

**Acceptance Criteria**:
- Can aggregate across breakdowns
- Time series summaries work
- Comparison calculations correct

### 4.7 Export Functionality
**Priority**: P2 (Medium)
**Estimated Time**: 3 hours

- [ ] Add CSV export formatting
- [ ] Add JSON export formatting
- [ ] Implement export tool
- [ ] Add export file generation
- [ ] Document export formats

**Acceptance Criteria**:
- Can export insights to CSV
- Can export insights to JSON
- Files are well-formatted

### 4.8 Phase 4 Documentation
**Priority**: P1 (High)
**Estimated Time**: 2 hours

- [ ] Document analytics workflow
- [ ] Add breakdown examples
- [ ] Document available metrics
- [ ] Add date range examples
- [ ] Document conversion tracking
- [ ] Add performance analysis examples

**Acceptance Criteria**:
- Analytics workflow clearly documented
- All metrics explained
- Example queries provided

---

## Phase 5: Advanced Features (Week 5)

### 5.1 Audience Service Methods
**Priority**: P0 (Blocker)
**Estimated Time**: 6 hours

- [ ] Create `src/services/audience.service.ts`
- [ ] Implement `getAudiences(accountId, options)` method
- [ ] Implement `getAudience(audienceId, fields)` method
- [ ] Implement `createCustomAudience(accountId, spec)` method
- [ ] Implement `createLookalikeAudience(accountId, spec)` method
- [ ] Implement `createSavedAudience(accountId, spec)` method
- [ ] Implement `addUsersToAudience(audienceId, data)` method
- [ ] Implement `removeUsersFromAudience(audienceId, data)` method
- [ ] Add audience size monitoring
- [ ] Add service tests

**Acceptance Criteria**:
- All audience types supported
- User data hashing implemented
- Audience sizes tracked
- Tests cover all operations

### 5.2 Audience Tools Implementation
**Priority**: P0 (Blocker)
**Estimated Time**: 5 hours

- [ ] Create `src/tools/audience.tools.ts`
- [ ] Implement `list_audiences` tool
- [ ] Implement `get_audience` tool
- [ ] Implement `create_custom_audience` tool
- [ ] Implement `add_users_to_audience` tool
- [ ] Implement `create_lookalike_audience` tool
- [ ] Implement `create_saved_audience` tool
- [ ] Add audience type documentation
- [ ] Register tools with server
- [ ] Add tool tests

**Acceptance Criteria**:
- All audience tools functional
- User data privacy maintained
- Clear documentation
- Tools integrated

### 5.3 Data Hashing for Custom Audiences
**Priority**: P0 (Blocker)
**Estimated Time**: 3 hours

- [ ] Implement SHA-256 hashing for PII
- [ ] Add email normalization (lowercase, trim)
- [ ] Add phone normalization (E.164 format)
- [ ] Add data validation before hashing
- [ ] Create hashing utility
- [ ] Add hashing tests
- [ ] Document data format requirements

**Acceptance Criteria**:
- PII properly hashed before upload
- Normalization prevents matching issues
- Validation catches format errors
- Tests verify hash correctness

### 5.4 Pixel Service Methods
**Priority**: P0 (Blocker)
**Estimated Time**: 4 hours

- [ ] Create `src/services/pixel.service.ts`
- [ ] Implement `getPixels(accountId)` method
- [ ] Implement `getPixel(pixelId, fields)` method
- [ ] Implement `createPixel(accountId, name)` method
- [ ] Implement `getPixelCode(pixelId)` method
- [ ] Implement custom conversion methods
- [ ] Add pixel service tests

**Acceptance Criteria**:
- Pixel CRUD operations work
- Pixel code generation works
- Custom conversions supported
- Tests pass

### 5.5 Pixel & Conversion Tools
**Priority**: P0 (Blocker)
**Estimated Time**: 4 hours

- [ ] Create `src/tools/pixel.tools.ts`
- [ ] Implement `list_pixels` tool
- [ ] Implement `get_pixel` tool
- [ ] Implement `create_pixel` tool
- [ ] Implement `list_custom_conversions` tool
- [ ] Implement `create_custom_conversion` tool
- [ ] Register tools with server
- [ ] Add tool tests

**Acceptance Criteria**:
- All pixel tools functional
- Conversion tracking configurable
- Clear setup instructions
- Tools integrated

### 5.6 Budget Management Tools
**Priority**: P1 (High)
**Estimated Time**: 3 hours

- [ ] Create `src/tools/budget.tools.ts`
- [ ] Implement `update_campaign_budget` tool
- [ ] Implement `update_adset_budget` tool
- [ ] Add budget validation
- [ ] Add CBO configuration support
- [ ] Register tools with server
- [ ] Add tool tests

**Acceptance Criteria**:
- Budget updates work at all levels
- CBO can be enabled/disabled
- Validation prevents errors
- Tools integrated

### 5.7 A/B Testing Service & Tools
**Priority**: P2 (Medium)
**Estimated Time**: 5 hours

- [ ] Add A/B test methods to appropriate service
- [ ] Implement `createABTest(accountId, spec)` method
- [ ] Implement `getABTest(testId)` method
- [ ] Implement `getABTestResults(testId)` method
- [ ] Create `src/tools/abtest.tools.ts`
- [ ] Implement `create_ab_test` tool
- [ ] Implement `get_ab_test_results` tool
- [ ] Register tools with server
- [ ] Add tests

**Acceptance Criteria**:
- Can create split tests
- Can retrieve results and winners
- Clear result presentation
- Tools functional

### 5.8 Batch Operation Tools
**Priority**: P1 (High)
**Estimated Time**: 4 hours

- [ ] Create `src/tools/batch.tools.ts`
- [ ] Implement `batch_update_status` tool
- [ ] Implement `batch_update_budgets` tool
- [ ] Add batch result formatting
- [ ] Add partial failure handling
- [ ] Register tools with server
- [ ] Add tool tests

**Acceptance Criteria**:
- Batch operations handle concurrency
- Partial failures reported clearly
- Significant performance improvement
- Tools integrated

### 5.9 Account & Asset Tools
**Priority**: P1 (High)
**Estimated Time**: 3 hours

- [ ] Create `src/tools/account.tools.ts`
- [ ] Implement `list_ad_accounts` tool
- [ ] Implement `get_ad_account` tool
- [ ] Implement `list_pages` tool
- [ ] Implement `list_instagram_accounts` tool
- [ ] Register tools with server
- [ ] Add tool tests

**Acceptance Criteria**:
- Can discover accessible accounts
- Page and Instagram account linking clear
- Tools functional

### 5.10 Phase 5 Documentation
**Priority**: P1 (High)
**Estimated Time**: 2 hours

- [ ] Document audience creation workflow
- [ ] Add pixel setup guide
- [ ] Document conversion tracking
- [ ] Add batch operation examples
- [ ] Document A/B testing workflow
- [ ] Update TOOLS.md with all Phase 5 tools

**Acceptance Criteria**:
- Complete workflow documentation
- Setup guides clear and accurate
- Examples for all features

---

## Phase 6: Production Hardening (Week 6)

### 6.1 OAuth 2.1 with PKCE Implementation
**Priority**: P1 (High)
**Estimated Time**: 8 hours

- [ ] Install OAuth dependencies
- [ ] Create `src/config/oauth.config.ts`
- [ ] Implement PKCE code verifier generation
- [ ] Implement authorization URL generation
- [ ] Implement token exchange flow
- [ ] Implement token refresh flow
- [ ] Add OAuth provider to MCP server
- [ ] Add OAuth state validation
- [ ] Add scope validation
- [ ] Test OAuth flow end-to-end
- [ ] Document OAuth setup

**Acceptance Criteria**:
- OAuth flow completes successfully
- PKCE prevents interception attacks
- Token refresh works automatically
- Scope validation enforced
- Documentation includes app setup

### 6.2 Token Management & Rotation
**Priority**: P1 (High)
**Estimated Time**: 4 hours

- [ ] Create `src/utils/token-manager.ts`
- [ ] Implement token validation
- [ ] Implement token refresh scheduling
- [ ] Implement secure token storage interface
- [ ] Add token expiration checking
- [ ] Add token rotation logging
- [ ] Add token manager tests

**Acceptance Criteria**:
- Tokens validated before use
- Automatic refresh before expiration
- Secure storage interface defined
- Tests verify rotation logic

### 6.3 Circuit Breaker Pattern
**Priority**: P1 (High)
**Estimated Time**: 4 hours

- [ ] Create `src/utils/circuit-breaker.ts`
- [ ] Implement `CircuitBreaker` class
- [ ] Add state machine (closed, open, half-open)
- [ ] Add failure threshold configuration
- [ ] Add timeout and reset logic
- [ ] Integrate with service layer
- [ ] Add circuit breaker tests

**Acceptance Criteria**:
- Opens after 5 consecutive failures
- Half-open after 30 second timeout
- Closes after 3 successes
- Prevents cascade failures

### 6.4 HTTP Transport with Session Management
**Priority**: P2 (Medium)
**Estimated Time**: 6 hours

- [ ] Install Express and CORS dependencies
- [ ] Create `src/http-server.ts`
- [ ] Set up Express app with CORS
- [ ] Implement session ID generation
- [ ] Implement session storage (memory + Redis option)
- [ ] Implement MCP HTTP transport handler
- [ ] Add session cleanup
- [ ] Add HTTP server tests
- [ ] Document HTTP deployment

**Acceptance Criteria**:
- HTTP server starts successfully
- Session management works
- CORS configured correctly
- Redis optional but supported
- Documentation includes deployment guide

### 6.5 Enhanced Logging with Correlation IDs
**Priority**: P1 (High)
**Estimated Time**: 3 hours

- [ ] Add correlation ID generation
- [ ] Add correlation ID to all log entries
- [ ] Add request/response logging (debug mode)
- [ ] Add performance timing logs
- [ ] Add structured metadata to logs
- [ ] Integrate with all services
- [ ] Document log format

**Acceptance Criteria**:
- Every request has unique correlation ID
- Logs traceable across service layers
- Performance metrics logged
- Log format documented

### 6.6 Comprehensive Unit Tests
**Priority**: P0 (Blocker)
**Estimated Time**: 8 hours

- [ ] Write tests for all service methods
- [ ] Write tests for all utility functions
- [ ] Write tests for error handling
- [ ] Write tests for retry logic
- [ ] Write tests for rate limiting
- [ ] Write tests for validation
- [ ] Achieve >80% code coverage
- [ ] Fix any failing tests

**Acceptance Criteria**:
- All services have test coverage
- All utilities have test coverage
- Code coverage >80%
- All tests pass

### 6.7 Integration Tests
**Priority**: P1 (High)
**Estimated Time**: 6 hours

- [ ] Set up test ad account
- [ ] Write integration tests for campaign flow
- [ ] Write integration tests for ad set flow
- [ ] Write integration tests for creative flow
- [ ] Write integration tests for insights
- [ ] Write integration tests for audiences
- [ ] Add integration test documentation
- [ ] Add test cleanup procedures

**Acceptance Criteria**:
- Full workflows tested end-to-end
- Tests clean up after themselves
- Tests can run against test account
- Documentation explains test setup

### 6.8 Performance Testing
**Priority**: P2 (Medium)
**Estimated Time**: 4 hours

- [ ] Create performance test suite
- [ ] Test response times under load
- [ ] Test pagination performance with large datasets
- [ ] Test concurrent request handling
- [ ] Test memory usage
- [ ] Document performance benchmarks
- [ ] Optimize bottlenecks

**Acceptance Criteria**:
- Response times meet spec (<3s average)
- Memory usage <100MB
- Can handle 1000+ API calls/hour
- Performance documented

### 6.9 Security Audit
**Priority**: P1 (High)
**Estimated Time**: 4 hours

- [ ] Review token handling for leaks
- [ ] Review input validation completeness
- [ ] Review error messages for information disclosure
- [ ] Review dependency vulnerabilities
- [ ] Add security best practices documentation
- [ ] Fix any security issues found

**Acceptance Criteria**:
- No tokens in logs
- All inputs validated
- Error messages safe
- No critical vulnerabilities
- Security documentation complete

### 6.10 Complete Documentation
**Priority**: P0 (Blocker)
**Estimated Time**: 6 hours

- [ ] Complete README.md with all features
- [ ] Complete SETUP.md with all auth methods
- [ ] Complete TOOLS.md with all 50+ tools
- [ ] Complete EXAMPLES.md with real workflows
- [ ] Complete TROUBLESHOOTING.md
- [ ] Add API reference documentation
- [ ] Add architecture documentation
- [ ] Review and polish all docs

**Acceptance Criteria**:
- All tools documented
- All workflows have examples
- Setup instructions complete
- Troubleshooting covers common issues
- Documentation professional quality

---

## Post-MVP Tasks (Phase 7+)

### Automation Features
**Priority**: P3 (Low)
**Estimated Time**: TBD

- [ ] Implement scheduled budget adjustments
- [ ] Implement rule-based optimizations
- [ ] Implement automated reporting
- [ ] Implement alert triggers

### Advanced Analytics
**Priority**: P3 (Low)
**Estimated Time**: TBD

- [ ] Implement custom metric calculations
- [ ] Implement comparative analysis tools
- [ ] Implement anomaly detection
- [ ] Implement ROI calculators

### Enhanced Monitoring
**Priority**: P3 (Low)
**Estimated Time**: TBD

- [ ] Implement real-time dashboards
- [ ] Implement performance alerting
- [ ] Implement budget monitoring
- [ ] Implement anomaly detection

---

## Task Summary

### Phase 1: Foundation
- **Total Tasks**: 39
- **Estimated Time**: 30 hours
- **Priority Breakdown**: 31 P0, 6 P1, 2 P2

### Phase 2: Core Write Operations
- **Total Tasks**: 38
- **Estimated Time**: 32 hours
- **Priority Breakdown**: 24 P0, 12 P1, 2 P2

### Phase 3: Creative & Media
- **Total Tasks**: 28
- **Estimated Time**: 31 hours
- **Priority Breakdown**: 18 P0, 6 P1, 3 P2, 1 P3

### Phase 4: Analytics & Insights
- **Total Tasks**: 26
- **Estimated Time**: 28 hours
- **Priority Breakdown**: 14 P0, 8 P1, 4 P2

### Phase 5: Advanced Features
- **Total Tasks**: 35
- **Estimated Time**: 36 hours
- **Priority Breakdown**: 20 P0, 12 P1, 3 P2

### Phase 6: Production Hardening
- **Total Tasks**: 39
- **Estimated Time**: 49 hours
- **Priority Breakdown**: 14 P0, 18 P1, 7 P2

### Total Implementation
- **Total Tasks**: 205
- **Total Estimated Time**: 206 hours (≈5-6 weeks)
- **P0 (Blocker) Tasks**: 121
- **P1 (High) Tasks**: 62
- **P2 (Medium) Tasks**: 21
- **P3 (Low) Tasks**: 1

---

## Task Dependencies

### Critical Path
1. Project Setup (1.1) → Configuration (1.2) → Service Layer (1.3)
2. Error Handling (1.4) → Retry Logic (1.5)
3. Campaign Service (1.6) → Campaign Tools (1.7) → MCP Server (1.8)
4. Ad Set Service (2.1) → Targeting Schema (2.2) → Ad Set Tools (2.3)
5. Creative Service (3.2) → Asset Upload (3.1) → Creative Tools (3.3)
6. Insights Service (4.1) → Insights Tools (4.2)
7. Audience Service (5.1) → Data Hashing (5.3) → Audience Tools (5.2)
8. All Services → OAuth (6.1) → Documentation (6.10)

### Parallel Work Opportunities
- **Phase 1**: Error handling (1.4) and Retry logic (1.5) can be done in parallel with Campaign Service (1.6)
- **Phase 2**: Ad Service (2.4) and Rate Limiter (2.7) can be done in parallel
- **Phase 3**: Creative Validation (3.4) and Media Library (3.5) can be done in parallel with DCO (3.6)
- **Phase 4**: Metric Formatting (4.4) and Pagination (4.5) can be done in parallel
- **Phase 5**: Budget Tools (5.6), A/B Testing (5.7), and Account Tools (5.9) can be done in parallel
- **Phase 6**: OAuth (6.1), HTTP Transport (6.4), and Enhanced Logging (6.5) can be done in parallel

---

## Success Metrics

### Code Quality
- [ ] 100% TypeScript strict mode compliance
- [ ] >80% test coverage
- [ ] 0 critical security vulnerabilities
- [ ] All ESLint rules passing

### Functionality
- [ ] All 50+ tools implemented and tested
- [ ] Full CRUD support for all entities
- [ ] End-to-end workflows verified
- [ ] MCP Inspector compatibility

### Performance
- [ ] <3s average response time
- [ ] <100MB memory usage
- [ ] 1000+ API calls/hour capability
- [ ] Efficient pagination verified

### Documentation
- [ ] Complete setup guide
- [ ] All tools documented with examples
- [ ] Troubleshooting guide complete
- [ ] Architecture documented

### User Experience
- [ ] Clear error messages
- [ ] Natural language tool descriptions
- [ ] Comprehensive examples
- [ ] Easy configuration

---

**Document Version**: 1.0
**Last Updated**: 2025-10-22
**Status**: Ready for Implementation
