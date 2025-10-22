/**
 * Configuration type definitions for the Meta Ads MCP Server
 */

export interface MetaAdsConfig {
  accessToken: string;
  apiVersion?: string;
  appId?: string;
  appSecret?: string;
}

export interface AuthConfig {
  META_ACCESS_TOKEN: string;
  META_APP_ID?: string;
  META_APP_SECRET?: string;
  META_API_VERSION: string;
  AUTH_MODE: 'token' | 'oauth';
}

export interface ServerConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  DEBUG: boolean;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
}

export interface RateLimitConfig {
  RATE_LIMIT_THRESHOLD: number;
}

export interface HttpConfig {
  HTTP_PORT: number;
  ENABLE_CORS: boolean;
  SESSION_SECRET?: string;
  REDIS_URL?: string;
}

export interface AppConfig extends AuthConfig, ServerConfig, RateLimitConfig {
  http?: HttpConfig;
}
