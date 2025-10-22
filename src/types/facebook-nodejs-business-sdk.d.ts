/**
 * Type declarations for facebook-nodejs-business-sdk
 * The SDK doesn't provide official TypeScript types
 */

declare module 'facebook-nodejs-business-sdk' {
  export class FacebookAdsApi {
    static init(accessToken: string): typeof FacebookAdsApi;
    static setVersion(version: string): void;
    static getVersion(): string;
    static setDebug(debug: boolean): void;
    static isDebug(): boolean;
    static call(method: string, path: string, params?: any): Promise<any>;
  }

  export class AdAccount {
    constructor(id: string);
    id: string;
    getCampaigns(fields: string[], params?: any): Promise<any>;
    getAdSets(fields: string[], params?: any): Promise<any>;
    getAds(fields: string[], params?: any): Promise<any>;
    getInsights(fields: string[], params?: any): Promise<any>;
    getAdCreatives(fields: string[], params?: any): Promise<any>;
    getAdImages(fields: string[], params?: any): Promise<any>;
    getAdVideos(fields: string[], params?: any): Promise<any>;
    getAdsPixels(fields: string[], params?: any): Promise<any>;
    getCustomAudiences(fields: string[], params?: any): Promise<any>;
    createCampaign(fields: string[], params: any): Promise<any>;
    createAdSet(fields: string[], params: any): Promise<any>;
    createAd(fields: string[], params: any): Promise<any>;
    createAdCreative(fields: string[], params: any): Promise<any>;
    createAdImage(fields: string[], params: any): Promise<any>;
    createAdVideo(fields: string[], params: any): Promise<any>;
    createAdsPixel(fields: string[], params: any): Promise<any>;
    createCustomAudience(fields: string[], params: any): Promise<any>;
    createSavedAudience(fields: string[], params: any): Promise<any>;
    createCustomConversion(fields: string[], params: any): Promise<any>;
    get(fields: string[]): Promise<any>;
    static Fields: Record<string, string>;
  }

  export class Campaign {
    constructor(id: string);
    id: string;
    name?: string;
    status?: string;
    objective?: string;
    daily_budget?: string;
    lifetime_budget?: string;
    getAdSets(fields: string[], params?: any): Promise<any>;
    getAds(fields: string[], params?: any): Promise<any>;
    getInsights(fields: string[], params?: any): Promise<any>;
    update(params?: any): Promise<any>;
    delete(): Promise<any>;
    get(fields: string[]): Promise<any>;
    set(field: string, value: any): void;
    static Fields: Record<string, string>;
  }

  export class AdSet {
    constructor(id: string);
    id: string;
    name?: string;
    status?: string;
    campaign_id?: string;
    daily_budget?: string;
    lifetime_budget?: string;
    targeting?: any;
    optimization_goal?: string;
    getAds(fields: string[], params?: any): Promise<any>;
    getInsights(fields: string[], params?: any): Promise<any>;
    update(params?: any): Promise<any>;
    delete(): Promise<any>;
    get(fields: string[]): Promise<any>;
    set(field: string, value: any): void;
    static Fields: Record<string, string>;
  }

  export class Ad {
    constructor(id: string);
    id: string;
    name?: string;
    status?: string;
    adset_id?: string;
    creative?: any;
    getInsights(fields: string[], params?: any): Promise<any>;
    getAdCreatives(fields: string[], params?: any): Promise<any>;
    update(params?: any): Promise<any>;
    delete(): Promise<any>;
    get(fields: string[]): Promise<any>;
    set(field: string, value: any): void;
    static Fields: Record<string, string>;
  }

  export class AdCreative {
    constructor(id: string);
    id: string;
    name?: string;
    object_story_spec?: any;
    asset_feed_spec?: any;
    get(fields: string[]): Promise<any>;
    delete(): Promise<any>;
    getAds(fields: string[], params?: any): Promise<any>;
    static Fields: Record<string, string>;
  }

  export class CustomAudience {
    constructor(id: string);
    id: string;
    name?: string;
    subtype?: string;
    addUsers(schema: string[], data: any[], params?: any): Promise<any>;
    removeUsers(schema: string[], data: any[]): Promise<any>;
    get(fields: string[]): Promise<any>;
    read(fields: string[]): Promise<any>;
    delete(): Promise<any>;
    createUser(fields: string[], params: any): Promise<any>;
    deleteUsers(fields: string[], params: any): Promise<any>;
    static Fields: Record<string, string>;
  }

  export class AdImage {
    constructor(id: string | null, parentId?: string);
    id: string;
    hash?: string;
    url?: string;
    static Fields: Record<string, string>;
  }

  export class AdVideo {
    constructor(id: string);
    id: string;
    static Fields: Record<string, string>;
  }

  export class AdsPixel {
    constructor(id: string);
    id: string;
    name?: string;
    code?: string;
    get(fields: string[]): Promise<any>;
    update(params: any): Promise<any>;
    getStats(fields: string[], params?: any): Promise<any>;
    static Fields: Record<string, string>;
  }
}
