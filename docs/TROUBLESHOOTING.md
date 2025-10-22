# Meta Ads MCP Server - Troubleshooting Guide

Solutions for common issues when using the Meta Ads MCP Server.

## Table of Contents

- [Authentication Issues](#authentication-issues)
- [Connection Problems](#connection-problems)
- [Permission Errors](#permission-errors)
- [API Rate Limits](#api-rate-limits)
- [Campaign Creation Issues](#campaign-creation-issues)
- [Data and Validation Errors](#data-and-validation-errors)
- [Performance Issues](#performance-issues)
- [Debugging Tips](#debugging-tips)

## Authentication Issues

### Error: "Invalid OAuth 2.0 Access Token"

**Symptoms:**
```json
{
  "error": "Invalid OAuth 2.0 Access Token",
  "code": 190,
  "type": "OAuthException"
}
```

**Causes:**
1. Token has expired (short-lived tokens expire after 1-2 hours)
2. Token was revoked or invalidated
3. User changed password
4. App lost access permissions

**Solutions:**

1. **Get a fresh token:**
   - Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
   - Click "Get Token" → "Get User Access Token"
   - Select required permissions
   - Copy new token to your configuration

2. **Use long-lived tokens for production:**
   ```bash
   curl -X GET "https://graph.facebook.com/v19.0/oauth/access_token" \
     -d "grant_type=fb_exchange_token" \
     -d "client_id=YOUR_APP_ID" \
     -d "client_secret=YOUR_APP_SECRET" \
     -d "fb_exchange_token=SHORT_LIVED_TOKEN"
   ```

3. **Use system user tokens (recommended for servers):**
   - Never expire
   - More secure for server-to-server communication
   - Created in Business Settings → System Users

**Prevention:**
- Use system user tokens for production
- Implement token refresh logic
- Monitor token expiration dates

### Error: "Error validating access token"

**Symptoms:**
```json
{
  "error": "Error validating access token: The session has been invalidated",
  "code": 190,
  "error_subcode": 463
}
```

**Causes:**
- User logged out
- User changed password
- App was deauthorized
- Token was manually invalidated

**Solutions:**
1. Re-authenticate and get new token
2. Check if user still has access to the app
3. Verify app is not restricted or disabled
4. Use system user tokens to avoid user-session dependencies

## Connection Problems

### Error: "Meta Ads MCP Server failed to start"

**Symptoms:**
- Server doesn't start
- No tools appear in Claude Desktop
- Error in logs: "Failed to start Meta Ads MCP Server"

**Check these issues:**

1. **Node.js version:**
   ```bash
   node --version  # Should be >= 20.0.0
   ```

   **Fix:** Upgrade Node.js
   ```bash
   # Using nvm
   nvm install 20
   nvm use 20
   ```

2. **Build artifacts missing:**
   ```bash
   ls build/index.js  # Should exist
   ```

   **Fix:** Rebuild the project
   ```bash
   npm run build
   ```

3. **Dependencies not installed:**
   ```bash
   npm list @modelcontextprotocol/sdk
   ```

   **Fix:** Reinstall dependencies
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

4. **Environment variables missing:**
   ```bash
   # Check .env file exists
   ls .env

   # Verify it has META_ACCESS_TOKEN
   grep META_ACCESS_TOKEN .env
   ```

   **Fix:** Create or update .env file
   ```bash
   cp .env.example .env
   # Edit .env and add your token
   ```

### Claude Desktop doesn't see the server

**Symptoms:**
- Server builds successfully
- No MCP tools appear in Claude Desktop
- No errors in terminal

**Solutions:**

1. **Check configuration path:**
   - Open: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
   - Verify path is absolute, not relative
   - Example: `/Users/yourname/meta-ads-mcp-server/build/index.js`

2. **Verify configuration format:**
   ```json
   {
     "mcpServers": {
       "meta-ads": {
         "command": "node",
         "args": ["/absolute/path/to/build/index.js"],
         "env": {
           "META_ACCESS_TOKEN": "your_token"
         }
       }
     }
   }
   ```

3. **Completely restart Claude Desktop:**
   - Cmd+Q to quit (not just close window)
   - Reopen Claude Desktop
   - Wait 10-15 seconds for server to initialize

4. **Check Claude Desktop logs:**
   - Help → View Logs
   - Look for MCP server errors
   - Search for "meta-ads"

5. **Test server manually:**
   ```bash
   node build/index.js
   # Should start without errors
   # Press Ctrl+C to stop
   ```

## Permission Errors

### Error: "You do not have permission to access this ad account"

**Symptoms:**
```json
{
  "error": "You do not have permission to access this ad account",
  "code": 100
}
```

**Causes:**
1. Token doesn't have access to the ad account
2. Wrong ad account ID
3. Token user is not admin/advertiser on the account
4. Account is disabled or restricted

**Solutions:**

1. **Verify ad account access:**
   ```bash
   curl -X GET "https://graph.facebook.com/v19.0/me/adaccounts" \
     -d "access_token=YOUR_TOKEN"
   ```
   This lists all ad accounts you can access.

2. **Check your role on the account:**
   ```bash
   curl -X GET "https://graph.facebook.com/v19.0/act_123456789" \
     -d "access_token=YOUR_TOKEN" \
     -d "fields=users"
   ```

3. **Request access:**
   - Ask ad account admin to add you
   - Need "Admin" or "Advertiser" role
   - "Analyst" role is read-only

4. **Check account status:**
   ```bash
   curl -X GET "https://graph.facebook.com/v19.0/act_123456789" \
     -d "access_token=YOUR_TOKEN" \
     -d "fields=account_status,disable_reason"
   ```

   Account status codes:
   - `1` - Active
   - `2` - Disabled
   - `3` - Unsettled
   - `7` - Pending risk review
   - `100` - Pending closure

### Error: "Application does not have permission for this action"

**Symptoms:**
```json
{
  "error": "This endpoint requires the 'ads_management' permission",
  "code": 200
}
```

**Solutions:**

1. **Regenerate token with correct permissions:**
   Required permissions:
   - `ads_management` - Create and manage ads
   - `ads_read` - Read ads data
   - `business_management` - Access business settings

2. **Check token permissions:**
   ```bash
   curl -X GET "https://graph.facebook.com/v19.0/me/permissions" \
     -d "access_token=YOUR_TOKEN"
   ```

3. **For production apps:**
   - App needs "Advanced Access" approval from Meta
   - Submit for App Review
   - Development mode has limited features

## API Rate Limits

### Error: "Application request limit reached"

**Symptoms:**
```json
{
  "error": "Application request limit reached",
  "code": 4,
  "error_subcode": 2446079
}
```

**Causes:**
- Too many API requests in short time
- Hit application-level rate limit
- Hit ad account-level rate limit

**What the server does automatically:**
- Retries failed requests with exponential backoff
- Waits progressively longer between retries (1s, 2s, 4s, 8s, 16s, 32s)
- Monitors rate limit headers
- Throttles requests when approaching limits

**What you can do:**

1. **Wait for cooldown:**
   - Most rate limits reset within 1 hour
   - Check `estimated_time_to_regain_access` in error response

2. **Reduce request frequency:**
   - Batch similar operations
   - Cache results when possible
   - Avoid polling; use webhooks instead

3. **Check current usage:**
   ```bash
   # Server logs show usage automatically
   # Look for "X-Business-Use-Case-Usage" in debug logs
   ```

4. **Optimize your requests:**
   - Request only fields you need
   - Use field filtering
   - Paginate large result sets
   - Space out requests

### Error: "User request limit reached"

**Symptoms:**
```json
{
  "error": "User request limit reached",
  "code": 17
}
```

**Solutions:**
1. Use system user tokens instead of personal tokens
2. System users have higher rate limits
3. Distribute requests across multiple system users if needed

## Campaign Creation Issues

### Error: "Invalid parameter" when creating campaign

**Symptoms:**
```json
{
  "error": "Invalid parameter",
  "code": 100,
  "error_user_msg": "You must specify either daily_budget or lifetime_budget"
}
```

**Common validation issues:**

1. **Budget requirements:**
   - Must specify either `daily_budget` OR `lifetime_budget` (not both)
   - Budget must be in cents (e.g., $50 = 5000)
   - Minimum: $1.00 (100 cents)

2. **Invalid objective:**
   - Use new objective names: `OUTCOME_SALES`, `OUTCOME_TRAFFIC`, etc.
   - Old objectives deprecated: `CONVERSIONS`, `LINK_CLICKS`, etc.

3. **Missing required fields:**
   - `name` - Required
   - `objective` - Required
   - Budget (`daily_budget` or `lifetime_budget`) - Required

4. **Special ad categories:**
   - Required for credit, employment, housing ads
   - Must declare: `special_ad_categories: ["CREDIT"]`

**Example valid campaign:**
```json
{
  "account_id": "act_123456789",
  "name": "Test Campaign",
  "objective": "OUTCOME_SALES",
  "daily_budget": 5000,
  "status": "PAUSED"
}
```

### Campaign creates but doesn't deliver

**Symptoms:**
- Campaign status is ACTIVE
- No impressions or spend
- Effective status shows issues

**Common causes:**

1. **No ad sets:**
   - Campaign needs at least one active ad set
   - Ad set must have valid targeting
   - Ad set must have budget if using ad set budgets

2. **No ads:**
   - Ad set needs at least one active ad
   - Ad must have approved creative

3. **Budget too low:**
   - Minimum $1/day usually not enough
   - Try $10-20/day minimum for testing

4. **Targeting too narrow:**
   - Check estimated audience size
   - Should be at least 1,000 people

5. **Payment method:**
   - Valid payment method required
   - Account must have available balance or credit

## Data and Validation Errors

### Error: "Invalid date format"

**Symptoms:**
```json
{
  "error": "Invalid date format for start_time"
}
```

**Solution:**
Use ISO 8601 format with timezone:
```
Correct: 2025-01-15T10:00:00+0000
Incorrect: 2025-01-15
Incorrect: 01/15/2025
```

### Error: "Budget value is too low"

**Symptoms:**
```json
{
  "error": "Daily budget must be at least 100 cents"
}
```

**Solution:**
- All budgets in cents (not dollars)
- $1.00 = 100 cents
- $50.00 = 5000 cents
- $100.50 = 10050 cents

### Decimal/currency conversion issues

**Common mistakes:**
```javascript
// Wrong - will set budget to $0.50
daily_budget: 50

// Correct - sets budget to $50.00
daily_budget: 5000

// Wrong - will set budget to $0.10
daily_budget: 10.50

// Correct - sets budget to $10.50
daily_budget: 1050
```

## Performance Issues

### Slow response times

**Symptoms:**
- Tools take long time to respond
- Timeouts on large requests

**Solutions:**

1. **Use field filtering:**
   ```
   Get campaign 123456 with fields: id, name, status
   # Much faster than requesting all fields
   ```

2. **Limit result sets:**
   ```
   List first 25 campaigns from account act_123456789
   # Instead of fetching all campaigns
   ```

3. **Check network connectivity:**
   ```bash
   ping graph.facebook.com
   ```

4. **Enable debug logging:**
   ```env
   DEBUG=true
   LOG_LEVEL=debug
   ```
   Look for slow API calls in logs.

### Memory issues with large datasets

**Symptoms:**
- Server crashes on large requests
- Out of memory errors

**Solutions:**
1. Use pagination with smaller page sizes
2. Request fewer fields
3. Filter results at the API level
4. Process data in batches

## Debugging Tips

### Enable debug logging

```env
# In .env file
DEBUG=true
LOG_LEVEL=debug
```

This shows:
- All API requests and responses
- Retry attempts and backoff delays
- Rate limit usage
- Performance timings

### Find correlation IDs

Every request has a unique correlation ID in logs:
```
[INFO] list_campaigns tool called { accountId: 'act_123456789', correlationId: 'abc-123' }
```

Use this to trace requests through the system.

### Check Meta's trace ID

When you get an error, note the `fbtraceId`:
```json
{
  "error": "...",
  "fbtrace_id": "AaBbCcDdEeFfGg"
}
```

Provide this to Meta support for faster help.

### Test with MCP Inspector

```bash
npx @modelcontextprotocol/inspector build/index.js
```

Benefits:
- See all available tools
- Test tools with sample data
- View raw responses
- No need for Claude Desktop

### Check Meta API status

Sometimes Meta's API has issues:
- [Meta Status Dashboard](https://developers.facebook.com/status/)
- [Meta Platform Status](https://status.fb.com/)

### Verify SDK version compatibility

```bash
npm list facebook-nodejs-business-sdk
```

Current version: 22.0.2
- Update if using older version
- Check changelog for breaking changes

## Common Error Codes Reference

| Code | Type | Description | Action |
|------|------|-------------|--------|
| 4 | Rate Limit | Too many requests | Wait and retry (automatic) |
| 17 | Rate Limit | User request limit | Wait and retry (automatic) |
| 100 | Invalid Param | Bad parameter value | Fix parameter and retry |
| 190 | Auth | Invalid token | Get new token |
| 200 | Permission | Missing permission | Add permission to token |
| 429 | Rate Limit | Too many requests | Wait and retry (automatic) |
| 500 | Server Error | Meta server issue | Retry (automatic) |
| 613 | Rate Limit | API call rate limit | Wait and retry (automatic) |

## Getting Help

### Before asking for help, gather:

1. **Error details:**
   - Full error message
   - Error code
   - fbtraceId

2. **Request details:**
   - What tool you called
   - What parameters you used
   - Expected vs actual behavior

3. **Environment:**
   - Node.js version: `node --version`
   - Server version: Check package.json
   - Operating system

4. **Logs:**
   - Enable debug logging
   - Copy relevant log excerpts
   - Remove tokens/sensitive data!

### Where to get help:

1. **Check documentation:**
   - [SETUP.md](SETUP.md)
   - [TOOLS.md](TOOLS.md)
   - [EXAMPLES.md](EXAMPLES.md)

2. **Meta resources:**
   - [Marketing API Docs](https://developers.facebook.com/docs/marketing-apis)
   - [Meta Business Help](https://www.facebook.com/business/help)
   - [Developer Community](https://developers.facebook.com/community/)

3. **File an issue:**
   - GitHub Issues
   - Include all info from above
   - Be specific and detailed

## Still stuck?

If you've tried everything:

1. Start fresh with MCP Inspector to isolate the issue
2. Test with Graph API Explorer to verify your token works
3. Check if issue exists with other tools (helps identify if it's tool-specific)
4. Review Meta's developer documentation for the specific API endpoint
5. Ask in Meta's developer community forums

Remember: Most issues are authentication or permission related. Double-check your token and account access first!
