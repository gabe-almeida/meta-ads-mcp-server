/**
 * Formatter Utility
 * Provides formatting functions for currency, percentages, and large numbers
 */

/**
 * Format currency value
 * @param value Numeric value to format
 * @param currency Currency code (default: USD)
 * @param decimals Number of decimal places (default: 2)
 */
export function formatCurrency(
  value: number | string | undefined,
  currency: string = 'USD',
  decimals: number = 2
): string {
  const numValue = parseFloat(String(value || 0));

  if (isNaN(numValue)) {
    return `${currency} 0.00`;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numValue);
  } catch (error) {
    // Fallback if currency code is invalid
    return `${currency} ${numValue.toFixed(decimals)}`;
  }
}

/**
 * Format percentage value
 * @param value Numeric value (as decimal, e.g., 0.1234 for 12.34%)
 * @param decimals Number of decimal places (default: 2)
 * @param includeSymbol Include % symbol (default: true)
 */
export function formatPercentage(
  value: number | string | undefined,
  decimals: number = 2,
  includeSymbol: boolean = true
): string {
  const numValue = parseFloat(String(value || 0));

  if (isNaN(numValue)) {
    return includeSymbol ? '0.00%' : '0.00';
  }

  const formatted = numValue.toFixed(decimals);
  return includeSymbol ? `${formatted}%` : formatted;
}

/**
 * Format large numbers with abbreviations (K, M, B)
 * @param value Numeric value to format
 * @param decimals Number of decimal places (default: 1)
 */
export function formatLargeNumber(
  value: number | string | undefined,
  decimals: number = 1
): string {
  const numValue = parseFloat(String(value || 0));

  if (isNaN(numValue)) {
    return '0';
  }

  const abs = Math.abs(numValue);
  const sign = numValue < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(decimals)}B`;
  }

  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(decimals)}M`;
  }

  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(decimals)}K`;
  }

  return `${sign}${abs.toFixed(decimals)}`;
}

/**
 * Format number with thousands separators
 * @param value Numeric value to format
 * @param decimals Number of decimal places (default: 0)
 */
export function formatNumber(
  value: number | string | undefined,
  decimals: number = 0
): string {
  const numValue = parseFloat(String(value || 0));

  if (isNaN(numValue)) {
    return '0';
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
}

/**
 * Format CTR (Click-Through Rate)
 * @param clicks Number of clicks
 * @param impressions Number of impressions
 * @param decimals Number of decimal places (default: 2)
 */
export function formatCTR(
  clicks: number | string | undefined,
  impressions: number | string | undefined,
  decimals: number = 2
): string {
  const numClicks = parseFloat(String(clicks || 0));
  const numImpressions = parseFloat(String(impressions || 0));

  if (isNaN(numClicks) || isNaN(numImpressions) || numImpressions === 0) {
    return '0.00%';
  }

  const ctr = (numClicks / numImpressions) * 100;
  return formatPercentage(ctr, decimals);
}

/**
 * Format CPC (Cost Per Click)
 * @param spend Total spend
 * @param clicks Number of clicks
 * @param currency Currency code (default: USD)
 * @param decimals Number of decimal places (default: 2)
 */
export function formatCPC(
  spend: number | string | undefined,
  clicks: number | string | undefined,
  currency: string = 'USD',
  decimals: number = 2
): string {
  const numSpend = parseFloat(String(spend || 0));
  const numClicks = parseFloat(String(clicks || 0));

  if (isNaN(numSpend) || isNaN(numClicks) || numClicks === 0) {
    return formatCurrency(0, currency, decimals);
  }

  const cpc = numSpend / numClicks;
  return formatCurrency(cpc, currency, decimals);
}

/**
 * Format CPM (Cost Per Mille/Thousand Impressions)
 * @param spend Total spend
 * @param impressions Number of impressions
 * @param currency Currency code (default: USD)
 * @param decimals Number of decimal places (default: 2)
 */
export function formatCPM(
  spend: number | string | undefined,
  impressions: number | string | undefined,
  currency: string = 'USD',
  decimals: number = 2
): string {
  const numSpend = parseFloat(String(spend || 0));
  const numImpressions = parseFloat(String(impressions || 0));

  if (isNaN(numSpend) || isNaN(numImpressions) || numImpressions === 0) {
    return formatCurrency(0, currency, decimals);
  }

  const cpm = (numSpend / numImpressions) * 1000;
  return formatCurrency(cpm, currency, decimals);
}

/**
 * Format ROAS (Return On Ad Spend)
 * @param revenue Revenue/conversion value
 * @param spend Ad spend
 * @param decimals Number of decimal places (default: 2)
 */
export function formatROAS(
  revenue: number | string | undefined,
  spend: number | string | undefined,
  decimals: number = 2
): string {
  const numRevenue = parseFloat(String(revenue || 0));
  const numSpend = parseFloat(String(spend || 0));

  if (isNaN(numRevenue) || isNaN(numSpend) || numSpend === 0) {
    return '0.00x';
  }

  const roas = numRevenue / numSpend;
  return `${roas.toFixed(decimals)}x`;
}

/**
 * Format conversion rate
 * @param conversions Number of conversions
 * @param clicks Number of clicks
 * @param decimals Number of decimal places (default: 2)
 */
export function formatConversionRate(
  conversions: number | string | undefined,
  clicks: number | string | undefined,
  decimals: number = 2
): string {
  const numConversions = parseFloat(String(conversions || 0));
  const numClicks = parseFloat(String(clicks || 0));

  if (isNaN(numConversions) || isNaN(numClicks) || numClicks === 0) {
    return '0.00%';
  }

  const rate = (numConversions / numClicks) * 100;
  return formatPercentage(rate, decimals);
}

/**
 * Format frequency (average impressions per user)
 * @param impressions Number of impressions
 * @param reach Number of unique users reached
 * @param decimals Number of decimal places (default: 2)
 */
export function formatFrequency(
  impressions: number | string | undefined,
  reach: number | string | undefined,
  decimals: number = 2
): string {
  const numImpressions = parseFloat(String(impressions || 0));
  const numReach = parseFloat(String(reach || 0));

  if (isNaN(numImpressions) || isNaN(numReach) || numReach === 0) {
    return '0.00';
  }

  const frequency = numImpressions / numReach;
  return frequency.toFixed(decimals);
}

/**
 * Format duration in milliseconds to human-readable format
 * @param ms Duration in milliseconds
 */
export function formatDuration(ms: number | undefined): string {
  if (!ms || isNaN(ms)) {
    return '0ms';
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  if (seconds > 0) {
    return `${seconds}s`;
  }
  return `${ms}ms`;
}

/**
 * Format date range
 * @param startDate Start date (ISO string or Date)
 * @param endDate End date (ISO string or Date)
 */
export function formatDateRange(
  startDate: string | Date | undefined,
  endDate: string | Date | undefined
): string {
  if (!startDate || !endDate) {
    return 'Unknown date range';
  }

  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

/**
 * Format insights summary for display
 * @param insights Insights data object
 * @param currency Currency code (default: USD)
 */
export function formatInsightsSummary(insights: any, currency: string = 'USD'): string {
  const lines: string[] = [];

  if (insights.impressions) {
    lines.push(`Impressions: ${formatNumber(insights.impressions)}`);
  }

  if (insights.clicks) {
    lines.push(`Clicks: ${formatNumber(insights.clicks)}`);
  }

  if (insights.spend) {
    lines.push(`Spend: ${formatCurrency(insights.spend, currency)}`);
  }

  if (insights.reach) {
    lines.push(`Reach: ${formatNumber(insights.reach)}`);
  }

  if (insights.ctr || (insights.clicks && insights.impressions)) {
    const ctr = insights.ctr || (insights.clicks / insights.impressions) * 100;
    lines.push(`CTR: ${formatPercentage(ctr)}`);
  }

  if (insights.cpc || (insights.spend && insights.clicks)) {
    const cpc = insights.cpc || insights.spend / insights.clicks;
    lines.push(`CPC: ${formatCurrency(cpc, currency)}`);
  }

  if (insights.cpm || (insights.spend && insights.impressions)) {
    const cpm = insights.cpm || (insights.spend / insights.impressions) * 1000;
    lines.push(`CPM: ${formatCurrency(cpm, currency)}`);
  }

  if (insights.conversions) {
    lines.push(`Conversions: ${formatNumber(insights.conversions)}`);
  }

  if (insights.cost_per_conversion || (insights.spend && insights.conversions)) {
    const costPerConv = insights.cost_per_conversion || insights.spend / insights.conversions;
    lines.push(`Cost per Conversion: ${formatCurrency(costPerConv, currency)}`);
  }

  if (insights.roas) {
    lines.push(`ROAS: ${formatROAS(insights.roas, 1)}`);
  }

  return lines.join('\n');
}

/**
 * Format file size in bytes to human-readable format
 * @param bytes File size in bytes
 * @param decimals Number of decimal places (default: 2)
 */
export function formatFileSize(bytes: number | undefined, decimals: number = 2): string {
  if (!bytes || isNaN(bytes) || bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}
