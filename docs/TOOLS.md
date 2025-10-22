# Meta Ads MCP Server - Tools Reference

Complete reference for all available tools in the Meta Ads MCP Server.

## Table of Contents

- [Campaign Management](#campaign-management)
- [Understanding Tool Responses](#understanding-tool-responses)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Campaign Management

### list_campaigns

List all campaigns for a Meta Ads account.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| account_id | string | Yes | Meta Ads account ID (with or without "act_" prefix) |
| limit | number | No | Maximum number of campaigns to return (default: 100) |
| fields | array | No | Specific fields to return |
| status_filter | string | No | Filter by status: ACTIVE, PAUSED, DELETED, ARCHIVED |

**Example Usage:**

```
List all active campaigns from account act_123456789
```

```
Show me the first 10 campaigns with their budgets
```

**Response:**

```json
{
  "success": true,
  "count": 2,
  "campaigns": [
    {
      "id": "12345678901",
      "name": "Summer Sale Campaign 2025",
      "status": "ACTIVE",
      "objective": "OUTCOME_SALES",
      "daily_budget": 5000,
      "lifetime_budget": null,
      "created_time": "2025-01-15T10:00:00+0000",
      "updated_time": "2025-01-20T15:30:00+0000"
    }
  ]
}
```

### get_campaign

Get detailed information about a specific campaign.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| campaign_id | string | Yes | The campaign ID |
| fields | array | No | Specific fields to return |

**Example Usage:**

```
Get details for campaign 12345678901
```

```
Show me the full configuration for my campaign including bid strategy and budget
```

**Response:**

```json
{
  "success": true,
  "campaign": {
    "id": "12345678901",
    "name": "Summer Sale Campaign 2025",
    "status": "ACTIVE",
    "objective": "OUTCOME_SALES",
    "daily_budget": 5000,
    "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
    "buying_type": "AUCTION",
    "special_ad_categories": [],
    "created_time": "2025-01-15T10:00:00+0000",
    "updated_time": "2025-01-20T15:30:00+0000"
  }
}
```

### create_campaign

Create a new Meta Ads campaign.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| account_id | string | Yes | Meta Ads account ID |
| name | string | Yes | Campaign name |
| objective | string | Yes | Campaign objective (see objectives below) |
| status | string | No | ACTIVE or PAUSED (default: PAUSED) |
| daily_budget | number | No | Daily budget in cents (mutually exclusive with lifetime_budget) |
| lifetime_budget | number | No | Total budget in cents (mutually exclusive with daily_budget) |
| bid_strategy | string | No | Bidding strategy (see strategies below) |
| special_ad_categories | array | No | CREDIT, EMPLOYMENT, or HOUSING |
| start_time | string | No | Start time (ISO 8601 format) |
| end_time | string | No | End time (ISO 8601 format) |

**Campaign Objectives:**

- `OUTCOME_TRAFFIC` - Drive traffic to your website or app
- `OUTCOME_SALES` - Drive purchases and conversions
- `OUTCOME_LEADS` - Generate leads and sign-ups
- `OUTCOME_AWARENESS` - Build brand awareness
- `OUTCOME_ENGAGEMENT` - Increase engagement with posts
- `OUTCOME_APP_PROMOTION` - Promote app installs

**Bid Strategies:**

- `LOWEST_COST_WITHOUT_CAP` - Lowest cost (default)
- `LOWEST_COST_WITH_BID_CAP` - Lowest cost with bid cap
- `COST_CAP` - Cost cap
- `LOWEST_COST_WITH_MIN_ROAS` - Target ROAS

**Example Usage:**

```
Create a new sales campaign named "Holiday Sale 2025" in account act_123456789 with a daily budget of $100
```

```
Create a traffic campaign with:
- Name: Website Traffic Campaign
- Account: act_123456789
- Daily budget: $50
- Objective: OUTCOME_TRAFFIC
- Status: PAUSED
```

**Response:**

```json
{
  "success": true,
  "message": "Campaign created successfully",
  "campaign": {
    "id": "12345678903",
    "success": true
  }
}
```

### update_campaign

Update an existing campaign.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| campaign_id | string | Yes | Campaign ID to update |
| name | string | No | New campaign name |
| status | string | No | ACTIVE, PAUSED, or ARCHIVED |
| daily_budget | number | No | New daily budget in cents |
| lifetime_budget | number | No | New lifetime budget in cents |
| bid_strategy | string | No | New bid strategy |
| start_time | string | No | New start time |
| end_time | string | No | New end time |

**Example Usage:**

```
Pause campaign 12345678901
```

```
Update campaign 12345678901 to increase daily budget to $150
```

```
Rename campaign 12345678901 to "Spring Sale 2025"
```

**Response:**

```json
{
  "success": true,
  "message": "Campaign updated successfully",
  "campaign": {
    "success": true
  }
}
```

### delete_campaign

Delete (archive) a campaign. This action cannot be undone.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| campaign_id | string | Yes | Campaign ID to delete |

**Example Usage:**

```
Delete campaign 12345678901
```

**Response:**

```json
{
  "success": true,
  "message": "Campaign deleted successfully",
  "result": {
    "success": true
  }
}
```

## Understanding Tool Responses

### Success Responses

All successful tool calls return a JSON response with:
- `success: true` - Indicates the operation succeeded
- Relevant data fields specific to the operation

### Error Responses

Failed operations return:
```json
{
  "success": false,
  "error": "Error message",
  "code": 100,
  "type": "OAuthException",
  "fbtraceId": "ABC123..."
}
```

Error fields:
- `error` - Human-readable error message
- `code` - Meta API error code
- `type` - Error type (OAuthException, FacebookApiException, etc.)
- `fbtraceId` - Meta trace ID for debugging (provide this to Meta support)

## Error Handling

### Common Error Codes

| Code | Type | Description | Retriable |
|------|------|-------------|-----------|
| 190 | OAuthException | Invalid access token | No |
| 4 | OAuthException | Rate limit reached | Yes |
| 100 | FacebookApiException | Invalid parameter | No |
| 17 | FacebookApiException | User request limit | Yes |
| 429 | TooManyRequests | Too many requests | Yes |
| 500-504 | ServerError | Meta server error | Yes |

### Automatic Retries

The server automatically retries failed requests when:
- Error code is retriable (4, 17, 80004, 613, 429, 500-504)
- Using exponential backoff (1s, 2s, 4s, 8s, 16s, 32s)
- Maximum 6 retry attempts

Non-retriable errors (like authentication failures) fail immediately.

## Best Practices

### Account ID Format

Account IDs can be provided with or without the `act_` prefix:
- `123456789` → Automatically converted to `act_123456789`
- `act_123456789` → Used as-is

### Budget Values

All budget values are in **cents** (1/100 of your currency):
- $50.00 = `5000` cents
- $100.50 = `10050` cents

Minimum daily budget: `$1.00` (100 cents)

### Campaign Status

Valid status values:
- `ACTIVE` - Campaign is running
- `PAUSED` - Campaign is paused
- `ARCHIVED` - Campaign is archived (cannot be reactivated)
- `DELETED` - Alias for ARCHIVED

### Special Ad Categories

If your ads relate to credit, employment, or housing, you **must** declare them:

```json
{
  "special_ad_categories": ["CREDIT"]
}
```

This ensures compliance with special advertising policies.

### Date Formats

All dates use ISO 8601 format:
- `2025-01-15T10:00:00+0000`
- `2025-12-31T23:59:59+0000`

### Field Selection

Request only the fields you need to improve performance:

```
Get campaign 12345678901 with fields: id, name, status, daily_budget
```

Available fields include:
- `id` - Campaign ID
- `name` - Campaign name
- `status` - Current status
- `objective` - Campaign objective
- `daily_budget` - Daily budget in cents
- `lifetime_budget` - Lifetime budget in cents
- `bid_strategy` - Bidding strategy
- `effective_status` - Computed effective status
- `created_time` - Creation timestamp
- `updated_time` - Last update timestamp
- `start_time` - Campaign start time
- `end_time` - Campaign end time
- `account_id` - Parent ad account

### Filtering and Pagination

When listing campaigns:
- Use `limit` to control result size
- Use `status_filter` to filter by status
- Default limit is 100 campaigns

```
List first 25 active campaigns from account act_123456789
```

## Examples by Use Case

### Starting a New Campaign

1. **Create campaign in PAUSED state:**
```
Create a traffic campaign in act_123456789 with daily budget $50, status PAUSED
```

2. **Verify creation:**
```
Get campaign details for [campaign_id]
```

3. **Activate when ready:**
```
Update campaign [campaign_id] to status ACTIVE
```

### Managing Campaign Budgets

**Increase budget:**
```
Update campaign 12345678901 daily budget to $200
```

**Switch from daily to lifetime budget:**
1. Remove daily budget: Set to 0 or null
2. Add lifetime budget in same update

**Check remaining budget:**
```
Get campaign 12345678901 with fields: daily_budget, lifetime_budget, spend
```

### Campaign Performance Monitoring

**Check active campaigns:**
```
List all active campaigns from account act_123456789
```

**Pause underperforming campaigns:**
```
Update campaign 12345678901 to status PAUSED
```

### Campaign Cleanup

**Archive old campaigns:**
```
Delete campaign 12345678901
```

**List archived campaigns:**
```
List campaigns from account act_123456789 with status filter ARCHIVED
```

## Rate Limits and Quotas

Meta enforces rate limits at multiple levels:

### Application Level
- Limited requests per hour
- Monitored by `X-App-Usage` header

### Ad Account Level
- Limited requests per hour per ad account
- Monitored by `X-Business-Use-Case-Usage` header

### Best Practices for Rate Limits

1. **Batch operations** - Update multiple items in single requests when possible
2. **Cache results** - Don't repeatedly fetch the same data
3. **Respect errors** - Back off when you receive rate limit errors
4. **Use webhooks** - For real-time updates instead of polling
5. **Monitor usage** - Check response headers for usage metrics

The server automatically handles rate limiting with:
- Exponential backoff for retriable errors
- Request queuing to prevent overwhelming the API
- Detailed logging of rate limit events

## Additional Resources

- [Meta Marketing API Reference](https://developers.facebook.com/docs/marketing-api/reference)
- [Campaign Best Practices](https://www.facebook.com/business/help/1710077379203657)
- [API Rate Limits](https://developers.facebook.com/docs/graph-api/overview/rate-limiting)
- [SETUP.md](SETUP.md) - Setup and configuration guide
- [EXAMPLES.md](EXAMPLES.md) - Workflow examples
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions
