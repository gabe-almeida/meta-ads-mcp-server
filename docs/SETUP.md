# Meta Ads MCP Server - Setup Guide

Complete guide to setting up the Meta Ads MCP Server with your Meta (Facebook) developer account.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting a Meta Access Token](#getting-a-meta-access-token)
- [Installation](#installation)
- [Configuration](#configuration)
- [Integration with Claude Desktop](#integration-with-claude-desktop)
- [Testing Your Setup](#testing-your-setup)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 20.0.0
- **npm** or **yarn** package manager
- A **Meta (Facebook) Developer Account**
- A **Meta Business Manager** account (for production use)
- An **Ad Account** with appropriate permissions

## Getting a Meta Access Token

### Option 1: Quick Start with Graph API Explorer (Development)

For testing and development, the quickest way to get an access token:

1. Go to the [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/)

2. Click **"Get Token"** → **"Get User Access Token"**

3. Select the following permissions:
   - `ads_management` - Manage ads and campaigns
   - `ads_read` - Read ads data
   - `business_management` - Access business settings
   - `pages_show_list` - List Facebook Pages
   - `instagram_basic` - Basic Instagram account access

4. Click **"Generate Access Token"**

5. Copy the token (starts with `EAA...`)

**Important Notes:**
- User access tokens expire after 1-2 hours
- For production use, follow Option 2 below to get a long-lived token

### Option 2: Long-Lived Access Token (Production)

For production use, you need a long-lived page access token:

#### Step 1: Create a Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Select **"Business"** as the app type
4. Fill in app details:
   - **App Name**: Your MCP Server name
   - **App Contact Email**: Your email
   - **Business Account**: Select your business (optional)
5. Click **"Create App"**

#### Step 2: Add Products

1. In your app dashboard, click **"Add Products"**
2. Find **"Marketing API"** and click **"Set Up"**
3. Accept the Terms of Service

#### Step 3: Generate Access Token

1. Go to **Tools** → **Graph API Explorer**
2. Select your app from the dropdown
3. Click **"Get Token"** → **"Get User Access Token"**
4. Select permissions (same as Option 1)
5. Click **"Generate Access Token"** and authorize
6. Copy the **short-lived token**

#### Step 4: Exchange for Long-Lived Token

Use the Meta API to exchange your short-lived token for a long-lived one:

```bash
curl -X GET "https://graph.facebook.com/v19.0/oauth/access_token" \
  -d "grant_type=fb_exchange_token" \
  -d "client_id=YOUR_APP_ID" \
  -d "client_secret=YOUR_APP_SECRET" \
  -d "fb_exchange_token=YOUR_SHORT_LIVED_TOKEN"
```

Replace:
- `YOUR_APP_ID` - From App Dashboard → Settings → Basic
- `YOUR_APP_SECRET` - From App Dashboard → Settings → Basic
- `YOUR_SHORT_LIVED_TOKEN` - Token from Step 3

Response:
```json
{
  "access_token": "EAALongLivedToken...",
  "token_type": "bearer",
  "expires_in": 5183999
}
```

The long-lived token is valid for **60 days**.

#### Step 5: Get Page Access Token (Optional)

For page-specific operations:

```bash
curl -X GET "https://graph.facebook.com/v19.0/me/accounts" \
  -d "access_token=YOUR_LONG_LIVED_USER_TOKEN"
```

This returns page access tokens that never expire (as long as the page admin's permissions remain valid).

### Option 3: System User Access Token (Production - Recommended)

For server-to-server applications (most secure):

1. Go to **Business Settings** → **Users** → **System Users**
2. Click **"Add"** to create a new system user
3. Give it a name and role
4. Click **"Add Assets"** and assign your ad accounts
5. Click **"Generate New Token"**
6. Select app and permissions
7. Copy the token (never expires!)

## Installation

1. **Clone or download the repository:**

```bash
git clone https://github.com/yourusername/meta-ads-mcp-server.git
cd meta-ads-mcp-server
```

2. **Install dependencies:**

```bash
npm install
```

3. **Build the project:**

```bash
npm run build
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Required: Your Meta Access Token
META_ACCESS_TOKEN=your_token_here

# Optional: Meta API Version (default: v19.0)
META_API_VERSION=v19.0

# Optional: Logging level (info, debug, warn, error)
LOG_LEVEL=info

# Optional: Enable debug mode for Meta SDK
DEBUG=false
```

### Verify Your Token

Test your access token:

```bash
curl -X GET "https://graph.facebook.com/v19.0/me" \
  -d "access_token=YOUR_ACCESS_TOKEN" \
  -d "fields=id,name"
```

Expected response:
```json
{
  "id": "123456789",
  "name": "Your Name"
}
```

### Find Your Ad Account ID

List your ad accounts:

```bash
curl -X GET "https://graph.facebook.com/v19.0/me/adaccounts" \
  -d "access_token=YOUR_ACCESS_TOKEN" \
  -d "fields=id,name,account_status"
```

Response:
```json
{
  "data": [
    {
      "id": "act_123456789",
      "name": "My Ad Account",
      "account_status": 1
    }
  ]
}
```

The `id` field is your ad account ID (includes `act_` prefix).

## Integration with Claude Desktop

### Step 1: Locate Configuration File

Find your Claude Desktop configuration file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Step 2: Add Server Configuration

Edit `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "meta-ads": {
      "command": "node",
      "args": ["/absolute/path/to/meta-ads-mcp-server/build/index.js"],
      "env": {
        "META_ACCESS_TOKEN": "your_token_here",
        "META_API_VERSION": "v19.0",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Important:**
- Use absolute paths, not relative paths
- Replace `/absolute/path/to/` with your actual path
- Never commit this file with your token!

### Step 3: Restart Claude Desktop

1. Quit Claude Desktop completely
2. Reopen Claude Desktop
3. The Meta Ads MCP Server should now be available

## Testing Your Setup

### Using MCP Inspector

The MCP Inspector is a great tool for testing:

```bash
npx @modelcontextprotocol/inspector build/index.js
```

This opens a web interface where you can:
- See all available tools
- Test tool calls with sample inputs
- View responses and errors
- Debug issues

### Test Campaign Listing

Once connected, try listing your campaigns in Claude:

```
Can you list all campaigns from my Meta Ads account act_123456789?
```

Expected response should show your campaigns with details like name, status, and budget.

### Test Campaign Creation

Try creating a test campaign:

```
Create a new campaign in account act_123456789:
- Name: Test Campaign
- Objective: OUTCOME_TRAFFIC
- Daily Budget: $50
- Status: PAUSED
```

## Troubleshooting

### Token Issues

**Error: "Invalid OAuth 2.0 Access Token"**
- Token has expired (user tokens expire after 1-2 hours)
- Get a new token or use a long-lived token
- Check token permissions

**Error: "Token does not have required permissions"**
- Re-generate token with all required permissions
- Make sure you selected `ads_management` and `ads_read`

### Connection Issues

**Error: "Server failed to start"**
- Check that Node.js >= 20 is installed
- Verify `npm run build` completed successfully
- Check logs for specific error messages

**Claude Desktop doesn't see the server:**
- Verify path in `claude_desktop_config.json` is absolute
- Check that `build/index.js` exists and is executable
- Restart Claude Desktop completely
- Check Claude Desktop logs (Help → View Logs)

### Permission Issues

**Error: "You do not have permission to access ad account"**
- Verify you're using the correct ad account ID
- Check you have admin or advertiser role on the ad account
- Token must be associated with a user who has access

**Error: "Application does not have permission"**
- Your app needs to be approved for Advanced Access
- For development, use Development Mode
- Check app is not restricted

### API Rate Limits

**Error: "Application request limit reached"**
- You've hit Meta's rate limits
- Wait for the cooldown period (usually 1 hour)
- The server has built-in retry logic for transient errors
- Consider reducing request frequency

### Debugging

Enable debug mode to see detailed logs:

```env
DEBUG=true
LOG_LEVEL=debug
```

Check server logs:
- Server logs go to stderr
- Claude Desktop logs: Help → View Logs
- Look for correlation IDs to trace requests

### Getting Help

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
2. Review [Meta Marketing API Documentation](https://developers.facebook.com/docs/marketing-apis)
3. Check Meta's [API Status Page](https://developers.facebook.com/status/)
4. Open an issue on GitHub with:
   - Error messages (remove tokens!)
   - Steps to reproduce
   - System information
   - Relevant log excerpts

## Security Best Practices

1. **Never commit tokens**
   - Add `.env` to `.gitignore`
   - Use environment variables
   - Rotate tokens regularly

2. **Use appropriate token types**
   - Development: Short-lived user tokens
   - Production: System user tokens
   - Limit token permissions to what you need

3. **Secure token storage**
   - Never store tokens in code
   - Use secure environment variable management
   - Consider using a secrets manager

4. **Monitor token usage**
   - Check for unauthorized usage
   - Rotate tokens if compromised
   - Implement token expiry monitoring

## Next Steps

- Read [TOOLS.md](TOOLS.md) for available tools reference
- Check [EXAMPLES.md](EXAMPLES.md) for workflow examples
- Review [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
- Explore the [Meta Marketing API Documentation](https://developers.facebook.com/docs/marketing-apis)

## Additional Resources

- [Meta for Developers](https://developers.facebook.com/)
- [Meta Marketing API](https://developers.facebook.com/docs/marketing-apis)
- [Meta Business Help Center](https://www.facebook.com/business/help)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
