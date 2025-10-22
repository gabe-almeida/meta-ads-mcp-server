/**
 * Pagination Utility
 * Provides streaming pagination for large datasets from Meta API
 */

import type { MetaCursor } from '../types/meta-ads.types.js';
import { logger } from './logger.js';

/**
 * Options for pagination
 */
export interface PaginationOptions {
  pageSize?: number; // Number of items per page (Meta API default is 25)
  maxResults?: number; // Maximum total results to fetch
  onPage?: (items: any[], pageNumber: number) => void | Promise<void>; // Callback for each page
  onProgress?: (progress: PaginationProgress) => void; // Progress callback
}

/**
 * Progress information
 */
export interface PaginationProgress {
  currentPage: number;
  totalFetched: number;
  hasMore: boolean;
  elapsedTime: number;
}

/**
 * Pagination result
 */
export interface PaginationResult<T = any> {
  items: T[];
  totalFetched: number;
  pages: number;
  hasMore: boolean;
  elapsedTime: number;
}

/**
 * Stream pagination helper
 * Processes results page by page with optional callbacks
 */
export class PaginationStream<T = any> {
  private cursor: MetaCursor;
  private options: PaginationOptions;
  private items: T[] = [];
  private pageNumber = 0;
  private startTime = Date.now();

  constructor(cursor: MetaCursor, options: PaginationOptions = {}) {
    this.cursor = cursor;
    this.options = {
      pageSize: options.pageSize,
      maxResults: options.maxResults,
      onPage: options.onPage,
      onProgress: options.onProgress,
    };
  }

  /**
   * Execute pagination
   */
  async execute(): Promise<PaginationResult<T>> {
    try {
      // Process first page
      await this.processCurrentPage();

      // Process subsequent pages
      while (this.shouldContinue()) {
        this.cursor = await this.cursor.next();
        await this.processCurrentPage();
      }

      const elapsedTime = Date.now() - this.startTime;

      logger.debug('Pagination completed', {
        totalFetched: this.items.length,
        pages: this.pageNumber,
        elapsedTime,
      });

      return {
        items: this.items,
        totalFetched: this.items.length,
        pages: this.pageNumber,
        hasMore: this.cursor.hasNext(),
        elapsedTime,
      };
    } catch (error) {
      logger.error('Pagination failed', {
        error: error instanceof Error ? error.message : String(error),
        pageNumber: this.pageNumber,
        totalFetched: this.items.length,
      });
      throw error;
    }
  }

  /**
   * Process current page
   */
  private async processCurrentPage(): Promise<void> {
    this.pageNumber++;

    // Collect items from current page
    const pageItems: T[] = [];
    for (const item of this.cursor) {
      pageItems.push(item);

      // Check if we've reached max results
      if (
        this.options.maxResults &&
        this.items.length + pageItems.length >= this.options.maxResults
      ) {
        break;
      }
    }

    // Add to total items
    this.items.push(...pageItems);

    // Call page callback
    if (this.options.onPage) {
      await this.options.onPage(pageItems, this.pageNumber);
    }

    // Call progress callback
    if (this.options.onProgress) {
      this.options.onProgress({
        currentPage: this.pageNumber,
        totalFetched: this.items.length,
        hasMore: this.cursor.hasNext(),
        elapsedTime: Date.now() - this.startTime,
      });
    }

    logger.debug('Page processed', {
      pageNumber: this.pageNumber,
      pageSize: pageItems.length,
      totalFetched: this.items.length,
    });
  }

  /**
   * Check if pagination should continue
   */
  private shouldContinue(): boolean {
    // No more pages
    if (!this.cursor.hasNext()) {
      return false;
    }

    // Reached max results
    if (this.options.maxResults && this.items.length >= this.options.maxResults) {
      return false;
    }

    return true;
  }
}

/**
 * Create a pagination stream
 * @param cursor Meta API cursor
 * @param options Pagination options
 */
export function createPaginationStream<T = any>(
  cursor: MetaCursor,
  options?: PaginationOptions
): PaginationStream<T> {
  return new PaginationStream<T>(cursor, options);
}

/**
 * Simple paginate all helper
 * Fetches all results from cursor
 */
export async function paginateAll<T = any>(cursor: MetaCursor): Promise<T[]> {
  const stream = new PaginationStream<T>(cursor);
  const result = await stream.execute();
  return result.items;
}

/**
 * Paginate with limit helper
 * Fetches up to maxResults items
 */
export async function paginateWithLimit<T = any>(
  cursor: MetaCursor,
  maxResults: number
): Promise<T[]> {
  const stream = new PaginationStream<T>(cursor, { maxResults });
  const result = await stream.execute();
  return result.items;
}

/**
 * Paginate with callback helper
 * Processes each page with a callback
 */
export async function paginateWithCallback<T = any>(
  cursor: MetaCursor,
  onPage: (items: T[], pageNumber: number) => void | Promise<void>,
  options?: Omit<PaginationOptions, 'onPage'>
): Promise<PaginationResult<T>> {
  const stream = new PaginationStream<T>(cursor, {
    ...options,
    onPage,
  });
  return stream.execute();
}

/**
 * Batched pagination helper
 * Processes results in batches for parallel processing
 */
export async function paginateInBatches<T = any, R = any>(
  cursor: MetaCursor,
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>,
  options?: PaginationOptions
): Promise<R[]> {
  const results: R[] = [];
  let batch: T[] = [];

  const stream = new PaginationStream<T>(cursor, {
    ...options,
    onPage: async (items) => {
      batch.push(...items);

      // Process batch when it reaches the desired size
      if (batch.length >= batchSize) {
        const processed = await processor(batch);
        results.push(...processed);
        batch = [];
      }
    },
  });

  await stream.execute();

  // Process remaining items in batch
  if (batch.length > 0) {
    const processed = await processor(batch);
    results.push(...processed);
  }

  return results;
}

/**
 * Async iterator for pagination
 * Allows for-await-of syntax
 */
export async function* paginateAsync<T = any>(
  cursor: MetaCursor,
  options?: PaginationOptions
): AsyncGenerator<T[], void, unknown> {
  let currentCursor = cursor;
  let shouldContinue = true;
  let totalFetched = 0;
  let pageNumber = 0;

  while (shouldContinue) {
    pageNumber++;
    const pageItems: T[] = [];

    // Collect items from current page
    for (const item of currentCursor) {
      pageItems.push(item);

      if (options?.maxResults && totalFetched + pageItems.length >= options.maxResults) {
        break;
      }
    }

    totalFetched += pageItems.length;

    // Yield page
    yield pageItems;

    // Check if should continue
    if (!currentCursor.hasNext()) {
      shouldContinue = false;
    } else if (options?.maxResults && totalFetched >= options.maxResults) {
      shouldContinue = false;
    } else {
      currentCursor = await currentCursor.next();
    }

    // Call progress callback
    if (options?.onProgress) {
      options.onProgress({
        currentPage: pageNumber,
        totalFetched,
        hasMore: currentCursor.hasNext(),
        elapsedTime: 0, // Not tracking in async iterator
      });
    }
  }
}

/**
 * Memory-efficient pagination
 * Processes items one at a time without storing all in memory
 */
export async function paginateStream<T = any>(
  cursor: MetaCursor,
  processor: (item: T) => void | Promise<void>,
  options?: PaginationOptions
): Promise<{ processed: number; elapsedTime: number }> {
  const startTime = Date.now();
  let processed = 0;
  let currentCursor = cursor;
  let shouldContinue = true;

  while (shouldContinue) {
    // Process items from current page
    for (const item of currentCursor) {
      await processor(item);
      processed++;

      if (options?.maxResults && processed >= options.maxResults) {
        shouldContinue = false;
        break;
      }
    }

    // Move to next page
    if (shouldContinue && currentCursor.hasNext()) {
      currentCursor = await currentCursor.next();
    } else {
      shouldContinue = false;
    }
  }

  const elapsedTime = Date.now() - startTime;

  logger.debug('Stream pagination completed', {
    processed,
    elapsedTime,
  });

  return { processed, elapsedTime };
}
