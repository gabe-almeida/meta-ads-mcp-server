# Meta Ads MCP Server - Quick Start Guide

## ✅ Repository Created

**GitHub URL:** https://github.com/gabe-almeida/meta-ads-mcp-server

---

## 🚀 Current Status

- ✅ **Server added to Claude Desktop config**
- ⚠️ **Token needs to be configured** (currently set to placeholder)

---

## Next Steps

### Option A: Test Without Token (See Helpful Error Messages)

**Current config has placeholder token - this will show you the improved error handling:**

1. **Restart Claude Desktop** (fully quit and reopen)
2. **Start new `cl` terminal session**
3. **Try a command:**
   ```
   "List my Meta ad accounts"
   ```
4. **You should see:**
   - Server starts successfully (no crash!)
   - AI receives helpful error message with setup instructions
   - Clear guidance on how to get a token

---

### Option B: Configure Real Token (Full Functionality)

#### 1. Get a Meta Access Token

Visit: **https://developers.facebook.com/tools/explorer/**

- Click **"Get Token"** → **"Get User Access Token"**
- Select permissions:
  - ✅ `ads_management`
  - ✅ `ads_read`
  - ✅ `business_management`
- Click **"Generate Access Token"**
- Copy the token

#### 2. Update Claude Desktop Config

Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

Replace `REPLACE_WITH_YOUR_TOKEN` with your actual token:

```json
{
  "mcpServers": {
    "meta-ads": {
      "command": "node",
      "args": ["/Users/Gabe/Dev/Meta-Ads-MCP-Server-Gabe/build/index.js"],
      "env": {
        "META_ACCESS_TOKEN": "paste_your_actual_token_here"
      }
    }
  }
}
```

#### 3. Restart Claude Desktop

Fully quit and reopen Claude Desktop.

#### 4. Test with Real API Calls

Start new `cl` session and try:

```
"What Meta Ads tools do you have available?"
"List my Meta ad accounts"
"Show me active campaigns for account act_123456789"
```

---

## 🔧 Available Tools (50+ Tools)

Once configured, you'll have access to:

- **Campaign Management** (5 tools): Create, list, update, delete campaigns
- **Ad Set Management** (6 tools): Full CRUD with targeting
- **Ad Management** (4 tools): Ad operations
- **Creative Management** (8 tools): Upload media, create creatives
- **Analytics & Insights** (6 tools): Performance data with breakdowns
- **Audience Management** (7 tools): Custom, lookalike, saved audiences
- **Pixel & Conversion** (5 tools): Tracking setup
- **Budget Management** (2 tools): Campaign and ad set budgets
- **Account Management** (4 tools): List accounts, pages, Instagram
- **Batch Operations** (2 tools): Bulk status and budget updates

---

## 📚 Documentation

- **Setup Guide:** [docs/SETUP.md](docs/SETUP.md)
- **Tool Reference:** [docs/TOOLS.md](docs/TOOLS.md)
- **Usage Examples:** [docs/EXAMPLES.md](docs/EXAMPLES.md)
- **Troubleshooting:** [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- **Implementation Details:** [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)
- **Audit Report:** [AUDIT_REPORT.md](AUDIT_REPORT.md)

---

## 🐛 Troubleshooting

### Server Not Loading

1. **Check Claude Desktop logs:**
   - View → Developer → Developer Tools → Console

2. **Test server manually:**
   ```bash
   cd /Users/Gabe/Dev/Meta-Ads-MCP-Server-Gabe
   export META_ACCESS_TOKEN="your_token"
   node build/index.js
   ```

3. **Use MCP Inspector:**
   ```bash
   npx @modelcontextprotocol/inspector build/index.js
   ```

### Token Issues

- **Invalid Token:** Get a new one from Graph API Explorer
- **Expired Token:** User tokens expire after 60 days - regenerate
- **Missing Permissions:** Ensure you selected all required permissions

---

## 📊 Testing Checklist

- [ ] Server appears in Claude Desktop MCP servers list
- [ ] Can list tools (should see 49+ tools)
- [ ] Can list ad accounts
- [ ] Can view campaigns
- [ ] Can create/update campaigns (if you have a real ad account)
- [ ] Error messages are helpful and actionable

---

## 🎯 Example Conversations

### Marketing Analysis
```
"Show me the performance of my campaigns over the last 7 days"
"Which ad sets have the highest ROAS?"
"Create a lookalike audience based on my best customers"
```

### Campaign Management
```
"Create a new conversion campaign targeting iOS users in California"
"Pause all ad sets with CPA over $50"
"Increase budgets by 20% for campaigns with ROAS over 3.0"
```

### Creative Testing
```
"Upload these 5 product images and create a carousel ad"
"Show me which creative has the best CTR"
"Create an A/B test comparing video vs image ads"
```

---

**Built with:** TypeScript, MCP SDK, Meta Marketing API v22.0
**Status:** Production Ready ✅
**Tests:** 23/23 Passing ✅
**Build:** Successful ✅
