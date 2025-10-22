/**
 * Type definitions for Meta Ads API entities
 */

export type CampaignObjective =
  | 'OUTCOME_TRAFFIC'
  | 'OUTCOME_SALES'
  | 'OUTCOME_LEADS'
  | 'OUTCOME_AWARENESS'
  | 'OUTCOME_ENGAGEMENT'
  | 'OUTCOME_APP_PROMOTION';

export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';

export type AdSetStatus = CampaignStatus | 'IN_PROCESS' | 'WITH_ISSUES';

export type AdStatus = AdSetStatus;

export type OptimizationGoal =
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

export type BidStrategy =
  | 'LOWEST_COST_WITHOUT_CAP'
  | 'LOWEST_COST_WITH_BID_CAP'
  | 'COST_CAP'
  | 'LOWEST_COST_WITH_MIN_ROAS';

export type BillingEvent = 'IMPRESSIONS' | 'LINK_CLICKS' | 'POST_ENGAGEMENT';

export type SpecialAdCategory = 'CREDIT' | 'EMPLOYMENT' | 'HOUSING';

export interface GeoLocation {
  countries?: string[];
  cities?: Array<{
    key: string;
    name?: string;
    radius?: number;
    distance_unit?: 'mile' | 'kilometer';
  }>;
  regions?: Array<{ key: string }>;
  zips?: Array<{ key: string }>;
  location_types?: Array<'home' | 'recent'>;
}

export interface TargetingSpec {
  geo_locations?: GeoLocation;
  age_min?: number;
  age_max?: number;
  genders?: number[];
  locales?: string[];
  interests?: Array<{ id: string; name?: string }>;
  behaviors?: Array<{ id: string; name?: string }>;
  life_events?: Array<{ id: string }>;
  custom_audiences?: Array<{ id: string }>;
  excluded_custom_audiences?: Array<{ id: string }>;
  flexible_spec?: any[];
  publisher_platforms?: Array<'facebook' | 'instagram' | 'audience_network' | 'messenger'>;
  facebook_positions?: string[];
  instagram_positions?: string[];
  device_platforms?: Array<'mobile' | 'desktop'>;
  user_device?: string[];
  user_os?: string[];
}

export interface CampaignCreateParams {
  name: string;
  objective: CampaignObjective;
  status?: CampaignStatus;
  daily_budget?: number;
  lifetime_budget?: number;
  bid_strategy?: BidStrategy;
  special_ad_categories?: SpecialAdCategory[];
  start_time?: string;
  end_time?: string;
}

export interface AdSetCreateParams {
  campaign_id: string;
  name: string;
  daily_budget?: number;
  lifetime_budget?: number;
  bid_amount?: number;
  billing_event?: BillingEvent;
  optimization_goal: OptimizationGoal;
  targeting: TargetingSpec;
  start_time?: string;
  end_time?: string;
  status?: AdSetStatus;
}

export interface AdCreateParams {
  adset_id: string;
  name: string;
  creative_id: string;
  status?: AdStatus;
}

export interface InsightsParams {
  date_preset?: string;
  time_range?: { since: string; until: string };
  level?: 'campaign' | 'adset' | 'ad';
  breakdowns?: string[];
  fields?: string[];
  time_increment?: number | 'monthly' | 'all_days';
  action_attribution_windows?: string[];
}

export interface PaginationOptions {
  limit?: number;
  after?: string;
  before?: string;
}

export interface FilterOptions {
  field: string;
  operator: 'IN' | 'NOT_IN' | 'EQUAL' | 'NOT_EQUAL' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAIN' | 'NOT_CONTAIN';
  value: any;
}

export interface GetOptions extends PaginationOptions {
  fields?: string[];
  filtering?: FilterOptions[];
}

// Meta SDK response types
export interface MetaCursor {
  hasNext(): boolean;
  next(): Promise<MetaCursor>;
  [Symbol.iterator](): Iterator<any>;
}

export interface MetaApiResponse {
  id?: string;
  [key: string]: any;
}
