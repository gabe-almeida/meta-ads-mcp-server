/**
 * Mock API Responses for Testing
 * Fixtures representing real Meta Ads API responses
 */

export const mockCampaigns = [
  {
    id: '12345678901',
    name: 'Summer Sale Campaign 2025',
    status: 'ACTIVE',
    objective: 'OUTCOME_SALES',
    daily_budget: 5000,
    lifetime_budget: null,
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    created_time: '2025-01-15T10:00:00+0000',
    updated_time: '2025-01-20T15:30:00+0000',
    effective_status: 'ACTIVE',
    account_id: 'act_123456789',
  },
  {
    id: '12345678902',
    name: 'Brand Awareness Q1',
    status: 'PAUSED',
    objective: 'OUTCOME_AWARENESS',
    daily_budget: null,
    lifetime_budget: 50000,
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    created_time: '2025-01-10T08:00:00+0000',
    updated_time: '2025-01-18T12:00:00+0000',
    effective_status: 'PAUSED',
    account_id: 'act_123456789',
  },
];

export const mockCampaign = {
  id: '12345678901',
  name: 'Summer Sale Campaign 2025',
  status: 'ACTIVE',
  objective: 'OUTCOME_SALES',
  daily_budget: 5000,
  lifetime_budget: null,
  bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
  buying_type: 'AUCTION',
  special_ad_categories: [],
  start_time: '2025-01-15T10:00:00+0000',
  end_time: null,
  created_time: '2025-01-15T10:00:00+0000',
  updated_time: '2025-01-20T15:30:00+0000',
  effective_status: 'ACTIVE',
  account_id: 'act_123456789',
  spend_cap: null,
  budget_remaining: null,
  configured_status: 'ACTIVE',
  can_use_spend_cap: true,
};

export const mockCampaignCreateResponse = {
  id: '12345678903',
  success: true,
};

export const mockCampaignUpdateResponse = {
  success: true,
};

export const mockCampaignDeleteResponse = {
  success: true,
};

export const mockAdSets = [
  {
    id: '98765432101',
    name: 'US West Coast - 25-45',
    campaign_id: '12345678901',
    status: 'ACTIVE',
    daily_budget: 2000,
    lifetime_budget: null,
    billing_event: 'IMPRESSIONS',
    optimization_goal: 'LINK_CLICKS',
    bid_amount: 100,
    targeting: {
      geo_locations: {
        countries: ['US'],
        location_types: ['home', 'recent'],
      },
      age_min: 25,
      age_max: 45,
      genders: [1, 2],
      publisher_platforms: ['facebook', 'instagram'],
    },
    created_time: '2025-01-15T11:00:00+0000',
    updated_time: '2025-01-20T14:00:00+0000',
    effective_status: 'ACTIVE',
  },
];

export const mockAds = [
  {
    id: '45678901201',
    name: 'Summer Sale - Image Ad 1',
    adset_id: '98765432101',
    campaign_id: '12345678901',
    status: 'ACTIVE',
    creative: {
      id: '67890123401',
      name: 'Summer Sale Creative',
    },
    created_time: '2025-01-15T12:00:00+0000',
    updated_time: '2025-01-20T13:00:00+0000',
    effective_status: 'ACTIVE',
  },
];

export const mockCreatives = [
  {
    id: '67890123401',
    name: 'Summer Sale Creative',
    object_story_spec: {
      page_id: '123456789',
      link_data: {
        link: 'https://example.com/summer-sale',
        message: 'Shop our amazing summer sale!',
        name: 'Summer Sale 2025',
        description: 'Up to 50% off on selected items',
        picture: 'https://example.com/images/summer-sale.jpg',
        call_to_action: {
          type: 'SHOP_NOW',
          value: {
            link: 'https://example.com/summer-sale',
          },
        },
      },
    },
    status: 'ACTIVE',
    created_time: '2025-01-15T11:30:00+0000',
    updated_time: '2025-01-20T12:30:00+0000',
  },
];

export const mockInsights = {
  data: [
    {
      date_start: '2025-01-15',
      date_stop: '2025-01-21',
      impressions: '125000',
      reach: '75000',
      clicks: '2500',
      spend: '350.00',
      cpc: '0.14',
      cpm: '2.80',
      ctr: '2.00',
      frequency: '1.67',
      actions: [
        {
          action_type: 'link_click',
          value: '2500',
        },
        {
          action_type: 'purchase',
          value: '45',
        },
      ],
      action_values: [
        {
          action_type: 'purchase',
          value: '4500.00',
        },
      ],
    },
  ],
  paging: {
    cursors: {
      before: 'MAZDZD',
      after: 'MjQZD',
    },
  },
};

export const mockAudiences = [
  {
    id: '11223344550',
    name: 'Website Visitors - Last 30 Days',
    description: 'Custom audience of people who visited our website',
    subtype: 'WEBSITE',
    approximate_count: 15000,
    time_created: '2025-01-10T10:00:00+0000',
    time_updated: '2025-01-21T08:00:00+0000',
    operation_status: {
      code: 200,
      description: 'Normal',
    },
  },
  {
    id: '11223344551',
    name: 'Lookalike - High Value Customers',
    description: 'Lookalike audience based on top 1% purchasers',
    subtype: 'LOOKALIKE',
    lookalike_spec: {
      ratio: 0.01,
      country: 'US',
      starting_ratio: 0.0,
    },
    approximate_count: 2000000,
    time_created: '2025-01-12T14:00:00+0000',
    time_updated: '2025-01-21T09:00:00+0000',
    operation_status: {
      code: 200,
      description: 'Normal',
    },
  },
];

export const mockPixels = [
  {
    id: '123456789012345',
    name: 'Website Pixel',
    code: `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '123456789012345');
fbq('track', 'PageView');
</script>
<!-- End Meta Pixel Code -->`,
    creation_time: '2025-01-05T10:00:00+0000',
    last_fired_time: '2025-01-21T23:45:00+0000',
  },
];

export const mockAdAccounts = [
  {
    id: 'act_123456789',
    account_id: '123456789',
    name: 'My Business Ad Account',
    currency: 'USD',
    timezone_name: 'America/Los_Angeles',
    timezone_offset_hours_utc: -8,
    account_status: 1,
    disable_reason: null,
    age: 0,
    amount_spent: '12500',
    balance: '5000',
    business: {
      id: '987654321',
      name: 'My Business',
    },
    capabilities: [
      'CUSTOM_AUDIENCES_FOLDERS',
      'CUSTOM_AUDIENCES_OPT_OUT',
      'DIRECT_SALES',
      'CAN_USE_REACH_AND_FREQUENCY',
    ],
    created_time: '2024-01-01T00:00:00+0000',
    min_campaign_group_spend_cap: '100',
    min_daily_budget: '100',
  },
];

export const mockMetaApiError = {
  error: {
    message: 'Invalid OAuth 2.0 Access Token',
    type: 'OAuthException',
    code: 190,
    error_subcode: 463,
    fbtrace_id: 'AaBbCcDdEeFfGgHhIiJjKkLl',
  },
};

export const mockRateLimitError = {
  error: {
    message: 'Application request limit reached',
    type: 'OAuthException',
    code: 4,
    error_subcode: 2446079,
    fbtrace_id: 'AaBbCcDdEeFfGgHhIiJjKkLl',
  },
};

export const mockValidationError = {
  error: {
    message: 'Invalid parameter',
    type: 'FacebookApiException',
    code: 100,
    error_subcode: 1487536,
    is_transient: false,
    error_user_title: 'Invalid Campaign Objective',
    error_user_msg: 'The objective you specified is not valid for this campaign type.',
    fbtrace_id: 'AaBbCcDdEeFfGgHhIiJjKkLl',
  },
};

/**
 * Mock cursor for pagination testing
 */
export class MockCursor {
  private data: any[];
  private currentIndex = 0;
  private pageSize: number;

  constructor(data: any[], pageSize = 25) {
    this.data = data;
    this.pageSize = pageSize;
  }

  [Symbol.iterator]() {
    const end = Math.min(this.currentIndex + this.pageSize, this.data.length);
    return this.data.slice(this.currentIndex, end)[Symbol.iterator]();
  }

  hasNext(): boolean {
    return this.currentIndex + this.pageSize < this.data.length;
  }

  async next(): Promise<MockCursor> {
    this.currentIndex += this.pageSize;
    return this;
  }
}

/**
 * Mock Meta API response headers
 */
export const mockResponseHeaders = {
  'x-business-use-case-usage': JSON.stringify({
    'act_123456789': [
      {
        type: 'ads_insights',
        call_count: 25,
        total_cputime: 45,
        total_time: 120,
        estimated_time_to_regain_access: 0,
      },
    ],
  }),
  'x-app-usage': JSON.stringify({
    call_count: 15,
    total_cputime: 25,
    total_time: 75,
  }),
  'x-fb-trace-id': 'AaBbCcDdEeFfGgHhIiJjKkLl',
  'x-fb-rev': 'rev123456',
};
