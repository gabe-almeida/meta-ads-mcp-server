# Meta Ads MCP Server - Usage Examples

Real-world workflow examples for common Meta Ads management tasks.

## Table of Contents

- [Getting Started](#getting-started)
- [Campaign Management](#campaign-management)
- [Budget Management](#budget-management)
- [Campaign Optimization](#campaign-optimization)
- [Reporting and Analysis](#reporting-and-analysis)
- [Batch Operations](#batch-operations)

## Getting Started

### Discover Your Ad Accounts

First, find your ad account IDs:

**Conversation with Claude:**
```
Can you help me find my Meta ad accounts?
```

Claude will guide you through checking your accounts. You can also do this manually:

```bash
curl -X GET "https://graph.facebook.com/v19.0/me/adaccounts" \
  -d "access_token=YOUR_TOKEN" \
  -d "fields=id,name,account_status,currency"
```

### List Existing Campaigns

Once you have your account ID:

```
List all campaigns from my Meta Ads account act_123456789
```

**Expected Response:**
```json
{
  "success": true,
  "count": 3,
  "campaigns": [
    {
      "id": "12345678901",
      "name": "Summer Sale Campaign",
      "status": "ACTIVE",
      "objective": "OUTCOME_SALES",
      "daily_budget": 5000
    },
    ...
  ]
}
```

## Campaign Management

### Example 1: Launch a New Sales Campaign

**Scenario:** You're launching a new product and want to drive online sales.

**Step 1: Create the campaign**

```
Create a new campaign in account act_123456789:
- Name: New Product Launch - Sales
- Objective: OUTCOME_SALES
- Daily Budget: $100
- Status: PAUSED (we'll activate it after reviewing)
```

**Response:**
```json
{
  "success": true,
  "message": "Campaign created successfully",
  "campaign": {
    "id": "12345678903"
  }
}
```

**Step 2: Review the configuration**

```
Get full details for campaign 12345678903
```

**Step 3: Activate when ready**

```
Update campaign 12345678903 to status ACTIVE
```

### Example 2: Seasonal Campaign with End Date

**Scenario:** Holiday promotion that should automatically stop after the holidays.

```
Create a campaign in account act_123456789:
- Name: Holiday Sale 2025
- Objective: OUTCOME_SALES
- Daily Budget: $200
- Start Time: 2025-12-01T00:00:00+0000
- End Time: 2025-12-26T23:59:59+0000
- Status: ACTIVE
```

**Benefits:**
- Campaign automatically starts on December 1st
- Automatically stops after Christmas
- No manual intervention needed

### Example 3: Brand Awareness Campaign

**Scenario:** Building brand awareness with a lifetime budget.

```
Create a brand awareness campaign in account act_123456789:
- Name: Q1 Brand Awareness 2025
- Objective: OUTCOME_AWARENESS
- Lifetime Budget: $5000
- Status: ACTIVE
```

**Note:** Use lifetime budget when you want to control total spend over the campaign lifetime, not daily.

## Budget Management

### Example 4: Adjust Campaign Budget

**Scenario:** Campaign is performing well, increase budget.

**Check current budget:**
```
Get campaign 12345678901 with fields: name, daily_budget, spend
```

**Response:**
```json
{
  "campaign": {
    "id": "12345678901",
    "name": "Summer Sale Campaign",
    "daily_budget": 5000,
    "spend": "450.00"
  }
}
```

**Increase budget:**
```
Update campaign 12345678901 daily budget to $150
```

### Example 5: Pause Underperforming Campaign

**Scenario:** Campaign isn't meeting targets, pause to prevent wasted spend.

```
Pause campaign 12345678902
```

Later, when you're ready to try again:

```
Reactivate campaign 12345678902
```

### Example 6: Scale Winning Campaigns

**Scenario:** Campaign is profitable, gradually scale budget.

**Day 1:** Start with $50/day
```
Update campaign 12345678901 daily budget to $50
```

**Day 3:** Increase by 20% if profitable
```
Update campaign 12345678901 daily budget to $60
```

**Day 7:** Continue scaling
```
Update campaign 12345678901 daily budget to $75
```

**Best Practice:** Increase budgets gradually (20-30% every 3-4 days) to maintain performance.

## Campaign Optimization

### Example 7: Campaign Naming Convention

**Scenario:** Organize campaigns with consistent naming.

```
Create campaigns with these names:
1. [SALES] Holiday 2025 - US - Desktop
2. [SALES] Holiday 2025 - US - Mobile
3. [AWARENESS] Q1 Brand - US - All Devices
```

**Benefits:**
- Easy to identify campaign type
- Quick filtering and searching
- Better team collaboration

### Example 8: Testing Campaign Objectives

**Scenario:** Test which objective performs better for your goals.

**Campaign A - Traffic Objective:**
```
Create campaign "Test A - Traffic Objective" in act_123456789:
- Objective: OUTCOME_TRAFFIC
- Daily Budget: $50
- Status: ACTIVE
```

**Campaign B - Sales Objective:**
```
Create campaign "Test B - Sales Objective" in act_123456789:
- Objective: OUTCOME_SALES
- Daily Budget: $50
- Status: ACTIVE
```

Run both for 7 days, then compare results.

### Example 9: Campaign Restructure

**Scenario:** Consolidating multiple small campaigns into one larger campaign.

**Step 1: Create new consolidated campaign**
```
Create campaign "Consolidated Sales Campaign Q1" in act_123456789:
- Objective: OUTCOME_SALES
- Daily Budget: $500
- Status: PAUSED
```

**Step 2: Pause old campaigns**
```
Pause campaign 12345678901
Pause campaign 12345678902
Pause campaign 12345678903
```

**Step 3: Activate new campaign**
```
Activate campaign [new_campaign_id]
```

## Reporting and Analysis

### Example 10: Quick Campaign Status Check

**Scenario:** Monday morning - check all active campaigns.

```
List all active campaigns from account act_123456789
```

**Follow-up questions:**
```
Which campaigns are spending the most?
Which campaigns have the highest CTR?
Are any campaigns close to their daily budget limit?
```

### Example 11: Month-End Review

**Scenario:** Review all campaigns at month end.

```
List all campaigns from account act_123456789 created in January 2025
```

**Analysis questions:**
```
What was the total spend across all campaigns this month?
Which campaigns were most cost-effective?
Which campaigns should I pause or adjust?
```

### Example 12: Campaign Performance Comparison

**Scenario:** Compare two similar campaigns.

```
Get details for campaigns 12345678901 and 12345678902 including:
- Daily budget
- Status
- Objective
- Created date
- Last updated date
```

**Follow-up:**
```
Based on these campaigns, which one is performing better?
Should I increase the budget on the better performer?
```

## Batch Operations

### Example 13: Pause All Campaigns for Holiday

**Scenario:** Pause all campaigns during a holiday week.

**Get list first:**
```
List all active campaigns from account act_123456789
```

**Then pause each:**
```
Pause campaigns: 12345678901, 12345678902, 12345678903
```

**Resume after holiday:**
```
Activate campaigns: 12345678901, 12345678902, 12345678903
```

### Example 14: Budget Reallocation

**Scenario:** Shift budget from underperformers to top performers.

**Reduce budget on underperformers:**
```
Update campaign 12345678901 daily budget to $30
Update campaign 12345678902 daily budget to $30
```

**Increase budget on top performer:**
```
Update campaign 12345678903 daily budget to $140
```

### Example 15: Campaign Cleanup

**Scenario:** Archive old completed campaigns.

**Find old campaigns:**
```
List all campaigns from account act_123456789 created before 2024-12-01
```

**Archive campaigns no longer needed:**
```
Delete campaign 12345678901
Delete campaign 12345678902
```

**Note:** Deleted campaigns are archived and can still be viewed for reporting, but cannot be reactivated.

## Advanced Workflows

### Example 16: Product Launch Campaign Series

**Scenario:** Coordinated campaign launch with multiple phases.

**Phase 1: Pre-Launch Awareness (2 weeks before)**
```
Create campaign "Product Launch - Teaser" in act_123456789:
- Objective: OUTCOME_AWARENESS
- Daily Budget: $100
- Start Time: 2025-02-01T00:00:00+0000
- End Time: 2025-02-14T23:59:59+0000
```

**Phase 2: Launch Day (Launch week)**
```
Create campaign "Product Launch - Sales" in act_123456789:
- Objective: OUTCOME_SALES
- Daily Budget: $500
- Start Time: 2025-02-15T00:00:00+0000
- End Time: 2025-02-21T23:59:59+0000
```

**Phase 3: Retargeting (Post-launch)**
```
Create campaign "Product Launch - Retargeting" in act_123456789:
- Objective: OUTCOME_SALES
- Daily Budget: $200
- Start Time: 2025-02-22T00:00:00+0000
```

### Example 17: Geographic Testing

**Scenario:** Test campaign performance in different regions.

**US Campaign:**
```
Create campaign "Sales - United States" in act_123456789:
- Objective: OUTCOME_SALES
- Daily Budget: $100
```

**UK Campaign:**
```
Create campaign "Sales - United Kingdom" in act_123456789:
- Objective: OUTCOME_SALES
- Daily Budget: $100
```

**Compare after 1 week:**
```
Get details for both campaigns including spend and results
Which geographic campaign is more cost-effective?
```

### Example 18: Weekly Campaign Management Routine

**Monday Morning:**
```
List all active campaigns from account act_123456789
```
Review weekend performance, pause any issues.

**Wednesday Check-in:**
```
Get budget status for all active campaigns
```
Adjust budgets mid-week if needed.

**Friday Planning:**
```
List all paused campaigns
```
Review and plan reactivations for next week.

## Tips and Best Practices

### Budget Management
- Start conservative, scale up gradually
- Increase budgets by max 20-30% every 3-4 days
- Keep 20% budget buffer for high-performers
- Review spend daily for new campaigns

### Campaign Organization
- Use consistent naming conventions
- Include objective, geography, and date in names
- Tag campaigns for easy filtering
- Document campaign purposes

### Testing Strategy
- Test one variable at a time
- Run tests for at least 7 days
- Use equal budgets for fair comparison
- Document test results

### Optimization Workflow
1. Review performance daily
2. Pause clear underperformers
3. Scale winners gradually
4. Test new variations weekly
5. Archive completed campaigns monthly

### Common Pitfalls to Avoid
- Don't change too many variables at once
- Don't increase budgets too quickly
- Don't pause campaigns too early (give them 3-7 days)
- Don't forget to set end dates for time-limited campaigns
- Don't neglect campaign naming and organization

## Getting Help

For more information:
- [TOOLS.md](TOOLS.md) - Complete tool reference
- [SETUP.md](SETUP.md) - Setup and configuration
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues
- [Meta Marketing API Docs](https://developers.facebook.com/docs/marketing-apis)

## Contributing Examples

Have a great workflow example? Submit a pull request to add it to this guide!
