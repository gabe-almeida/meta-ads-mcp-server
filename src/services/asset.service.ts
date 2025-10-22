/**
 * Asset Service
 * Handles uploading and managing media assets (images, videos) for Meta Ads
 */

import * as fs from 'fs';
import * as path from 'path';
import { MetaAdsService } from './meta-ads.service.js';
import { logger } from '../utils/logger.js';
import { handleMetaApiError } from '../utils/error-handler.js';
import { createDefaultBackoff } from '../utils/retry.js';

/**
 * Supported image formats
 */
const SUPPORTED_IMAGE_FORMATS = ['.jpg', '.jpeg', '.png', '.gif'];

/**
 * Supported video formats
 */
const SUPPORTED_VIDEO_FORMATS = ['.mp4', '.mov', '.avi', '.mkv'];

/**
 * Maximum file sizes (in bytes)
 */
const MAX_IMAGE_SIZE = 30 * 1024 * 1024; // 30MB
const MAX_VIDEO_SIZE = 4 * 1024 * 1024 * 1024; // 4GB

export interface UploadImageResult {
  hash: string;
  url?: string;
  name?: string;
}

export interface UploadVideoResult {
  id: string;
  url?: string;
  name?: string;
}

export class AssetService extends MetaAdsService {
  private readonly backoff = createDefaultBackoff();

  /**
   * Validate file exists and is accessible
   */
  private validateFileAccess(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${filePath}`);
    }

    // Check if file is readable
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (error) {
      throw new Error(`File is not readable: ${filePath}`);
    }
  }

  /**
   * Validate image file
   */
  private validateImageFile(filePath: string): void {
    this.validateFileAccess(filePath);

    const ext = path.extname(filePath).toLowerCase();
    if (!SUPPORTED_IMAGE_FORMATS.includes(ext)) {
      throw new Error(
        `Unsupported image format: ${ext}. Supported formats: ${SUPPORTED_IMAGE_FORMATS.join(', ')}`
      );
    }

    const stats = fs.statSync(filePath);
    if (stats.size > MAX_IMAGE_SIZE) {
      throw new Error(
        `Image file too large: ${(stats.size / (1024 * 1024)).toFixed(2)}MB. Maximum size: ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`
      );
    }

    logger.debug('Image file validated', {
      filePath,
      size: stats.size,
      format: ext,
    });
  }

  /**
   * Validate video file
   */
  private validateVideoFile(filePath: string): void {
    this.validateFileAccess(filePath);

    const ext = path.extname(filePath).toLowerCase();
    if (!SUPPORTED_VIDEO_FORMATS.includes(ext)) {
      throw new Error(
        `Unsupported video format: ${ext}. Supported formats: ${SUPPORTED_VIDEO_FORMATS.join(', ')}`
      );
    }

    const stats = fs.statSync(filePath);
    if (stats.size > MAX_VIDEO_SIZE) {
      throw new Error(
        `Video file too large: ${(stats.size / (1024 * 1024 * 1024)).toFixed(2)}GB. Maximum size: ${MAX_VIDEO_SIZE / (1024 * 1024 * 1024)}GB`
      );
    }

    logger.debug('Video file validated', {
      filePath,
      size: stats.size,
      format: ext,
    });
  }

  /**
   * Upload an image to Meta Ads
   * @param accountId Ad account ID (with or without 'act_' prefix)
   * @param filePath Absolute path to image file
   * @returns Image hash for use in ad creatives
   */
  async uploadImage(accountId: string, filePath: string): Promise<UploadImageResult> {
    const normalizedAccountId = this.normalizeAccountId(accountId);
    const fileName = path.basename(filePath);

    logger.info('Uploading image', {
      accountId: normalizedAccountId,
      fileName,
    });

    try {
      // Validate file
      this.validateImageFile(filePath);

      // Upload with retry
      const result = await this.backoff.execute(async () => {
        const account = new this.AdAccount(normalizedAccountId);

        // Read file as buffer
        const fileBuffer = fs.readFileSync(filePath);

        // Upload image
        const response = await account.createAdImage(
          [],
          {
            bytes: fileBuffer,
            name: fileName,
          }
        );

        return response;
      }, { operation: 'uploadImage', accountId: normalizedAccountId, fileName });

      // Extract hash from response
      const imageHash = result.images?.[fileName]?.hash;
      const imageUrl = result.images?.[fileName]?.url;

      if (!imageHash) {
        throw new Error('Image upload succeeded but no hash returned');
      }

      logger.info('Image uploaded successfully', {
        accountId: normalizedAccountId,
        fileName,
        hash: imageHash,
      });

      return {
        hash: imageHash,
        url: imageUrl,
        name: fileName,
      };
    } catch (error) {
      const metaError = handleMetaApiError(error);
      logger.error('Image upload failed', {
        accountId: normalizedAccountId,
        fileName,
        error: metaError.toLogObject(),
      });
      throw metaError;
    }
  }

  /**
   * Upload a video to Meta Ads
   * @param accountId Ad account ID (with or without 'act_' prefix)
   * @param filePath Absolute path to video file
   * @returns Video ID for use in ad creatives
   */
  async uploadVideo(accountId: string, filePath: string): Promise<UploadVideoResult> {
    const normalizedAccountId = this.normalizeAccountId(accountId);
    const fileName = path.basename(filePath);

    logger.info('Uploading video', {
      accountId: normalizedAccountId,
      fileName,
    });

    try {
      // Validate file
      this.validateVideoFile(filePath);

      // Upload with retry
      const result = await this.backoff.execute(async () => {
        const account = new this.AdAccount(normalizedAccountId);

        // Upload video
        const response = await account.createAdVideo(
          [],
          {
            file_url: filePath, // SDK can handle file path directly
            name: fileName,
          }
        );

        return response;
      }, { operation: 'uploadVideo', accountId: normalizedAccountId, fileName });

      const videoId = result.id;

      if (!videoId) {
        throw new Error('Video upload succeeded but no ID returned');
      }

      logger.info('Video uploaded successfully', {
        accountId: normalizedAccountId,
        fileName,
        videoId,
      });

      return {
        id: videoId,
        name: fileName,
      };
    } catch (error) {
      const metaError = handleMetaApiError(error);
      logger.error('Video upload failed', {
        accountId: normalizedAccountId,
        fileName,
        error: metaError.toLogObject(),
      });
      throw metaError;
    }
  }

  /**
   * Get uploaded images for an account
   * @param accountId Ad account ID
   * @param options Query options
   */
  async getImages(
    accountId: string,
    options?: { fields?: string[]; limit?: number }
  ): Promise<any[]> {
    const normalizedAccountId = this.normalizeAccountId(accountId);

    logger.info('Fetching account images', {
      accountId: normalizedAccountId,
      options,
    });

    try {
      const result = await this.backoff.execute(async () => {
        const account = new this.AdAccount(normalizedAccountId);
        const cursor = await account.getAdImages(
          options?.fields || ['id', 'hash', 'url', 'name', 'created_time'],
          {}
        );

        if (options?.limit) {
          return this.paginateWithLimit(cursor, options.limit);
        }
        return this.paginateAll(cursor);
      }, { operation: 'getImages', accountId: normalizedAccountId });

      logger.info('Images fetched successfully', {
        accountId: normalizedAccountId,
        count: result.length,
      });

      return result;
    } catch (error) {
      const metaError = handleMetaApiError(error);
      logger.error('Failed to fetch images', {
        accountId: normalizedAccountId,
        error: metaError.toLogObject(),
      });
      throw metaError;
    }
  }

  /**
   * Get uploaded videos for an account
   * @param accountId Ad account ID
   * @param options Query options
   */
  async getVideos(
    accountId: string,
    options?: { fields?: string[]; limit?: number }
  ): Promise<any[]> {
    const normalizedAccountId = this.normalizeAccountId(accountId);

    logger.info('Fetching account videos', {
      accountId: normalizedAccountId,
      options,
    });

    try {
      const result = await this.backoff.execute(async () => {
        const account = new this.AdAccount(normalizedAccountId);
        const cursor = await account.getAdVideos(
          options?.fields || ['id', 'title', 'length', 'created_time', 'updated_time'],
          {}
        );

        if (options?.limit) {
          return this.paginateWithLimit(cursor, options.limit);
        }
        return this.paginateAll(cursor);
      }, { operation: 'getVideos', accountId: normalizedAccountId });

      logger.info('Videos fetched successfully', {
        accountId: normalizedAccountId,
        count: result.length,
      });

      return result;
    } catch (error) {
      const metaError = handleMetaApiError(error);
      logger.error('Failed to fetch videos', {
        accountId: normalizedAccountId,
        error: metaError.toLogObject(),
      });
      throw metaError;
    }
  }
}
