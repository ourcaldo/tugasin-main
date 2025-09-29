/**
 * Cache Warming Service
 * Proactively preloads critical content into memory cache for improved performance
 */

import { Logger } from '@/lib/utils/logger';
import { DEV_CONFIG } from '@/lib/utils/constants';
import { cmsCache, CacheKeys } from './memory-cache';
import type { BlogPost, BlogCategory } from '@/lib/utils/types';

// Define critical content that should be preloaded
export interface CacheWarmingConfig {
  enableAutoWarming: boolean;
  warmingInterval: number; // in milliseconds
  criticalContent: {
    recentPosts: number;
    featuredPost: boolean;
    categories: boolean;
    topPosts: string[]; // specific slugs
  };
  backgroundWarming: boolean;
  maxConcurrentRequests: number;
}

const DEFAULT_WARMING_CONFIG: CacheWarmingConfig = {
  enableAutoWarming: true,
  warmingInterval: 10 * 60 * 1000, // 10 minutes
  criticalContent: {
    recentPosts: 6,
    featuredPost: true,
    categories: true,
    topPosts: [], // Can be populated with popular post slugs
  },
  backgroundWarming: true,
  maxConcurrentRequests: 3,
};

/**
 * Cache Warming Service
 * Manages proactive cache warming for critical content
 */
export class CacheWarmingService {
  private config: CacheWarmingConfig;
  private warmingTimer?: NodeJS.Timeout;
  private isWarming = false;
  private lastWarmingTime = 0;

  constructor(config: Partial<CacheWarmingConfig> = {}) {
    this.config = { ...DEFAULT_WARMING_CONFIG, ...config };
    
    if (this.config.enableAutoWarming) {
      this.startAutoWarming();
    }

    if (DEV_CONFIG.debugMode) {
      Logger.info('Cache warming service initialized', {
        autoWarming: this.config.enableAutoWarming,
        interval: this.config.warmingInterval,
      });
    }
  }

  /**
   * Warm critical content immediately
   */
  async warmCriticalContent(): Promise<{
    warmedCount: number;
    errors: string[];
    duration: number;
  }> {
    if (this.isWarming) {
      if (DEV_CONFIG.debugMode) {
        Logger.info('Cache warming already in progress, skipping');
      }
      return { warmedCount: 0, errors: ['Already warming'], duration: 0 };
    }

    this.isWarming = true;
    const startTime = Date.now();
    let warmedCount = 0;
    const errors: string[] = [];

    try {
      if (DEV_CONFIG.debugMode) {
        Logger.info('Starting cache warming for critical content');
      }

      // Import blog service dynamically to avoid circular imports
      const { blogService } = await import('../cms/blog-service');

      // Prepare warming tasks
      const warmingTasks: Array<{
        key: string;
        fetcher: () => Promise<any>;
        ttl?: number;
        tags?: string[];
      }> = [];

      // Recent posts
      if (this.config.criticalContent.recentPosts > 0) {
        warmingTasks.push({
          key: CacheKeys.recentPosts(this.config.criticalContent.recentPosts),
          fetcher: () => blogService.getRecentPosts(this.config.criticalContent.recentPosts),
          ttl: 3 * 60 * 1000, // 3 minutes
          tags: ['blog', 'recent'],
        });
      }

      // Featured post
      if (this.config.criticalContent.featuredPost) {
        warmingTasks.push({
          key: CacheKeys.featuredPost(),
          fetcher: () => blogService.getFeaturedPost(),
          ttl: 2 * 60 * 1000, // 2 minutes
          tags: ['blog', 'featured'],
        });
      }

      // Categories
      if (this.config.criticalContent.categories) {
        warmingTasks.push({
          key: CacheKeys.blogCategories(),
          fetcher: () => blogService.getCategories(),
          ttl: 15 * 60 * 1000, // 15 minutes
          tags: ['blog', 'categories'],
        });
      }

      // All posts (first page)
      warmingTasks.push({
        key: CacheKeys.blogPosts(50, 0),
        fetcher: () => blogService.getAllPosts(50, 0),
        ttl: 5 * 60 * 1000, // 5 minutes
        tags: ['blog', 'posts'],
      });

      // Top/popular posts by slug
      for (const slug of this.config.criticalContent.topPosts) {
        warmingTasks.push({
          key: CacheKeys.blogPost(slug),
          fetcher: () => blogService.getPostBySlug(slug),
          ttl: 5 * 60 * 1000, // 5 minutes
          tags: ['blog', 'post', slug],
        });
      }

      // Execute warming with concurrency control
      const chunks = this.chunkArray(warmingTasks, this.config.maxConcurrentRequests);
      
      for (const chunk of chunks) {
        const promises = chunk.map(async (task) => {
          try {
            // Skip if already cached and not expired
            if (cmsCache.has(task.key)) {
              return;
            }

            const data = await task.fetcher();
            if (cmsCache.set(task.key, data, task.ttl, task.tags)) {
              warmedCount++;
              if (DEV_CONFIG.debugMode) {
                Logger.info(`Cache warmed: ${task.key}`);
              }
            }
          } catch (error) {
            const errorMsg = `Failed to warm ${task.key}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            errors.push(errorMsg);
            if (DEV_CONFIG.debugMode) {
              Logger.error(errorMsg, error);
            }
          }
        });

        await Promise.all(promises);
      }

      this.lastWarmingTime = Date.now();
      const duration = this.lastWarmingTime - startTime;

      if (DEV_CONFIG.debugMode) {
        Logger.info(`Cache warming completed: ${warmedCount} items warmed in ${duration}ms`, {
          errors: errors.length,
        });
      }

      return { warmedCount, errors, duration };

    } finally {
      this.isWarming = false;
    }
  }

  /**
   * Warm specific content by keys
   */
  async warmSpecificContent(
    contentSpecs: Array<{
      key: string;
      fetcher: () => Promise<any>;
      ttl?: number;
      tags?: string[];
    }>
  ): Promise<number> {
    let warmedCount = 0;

    for (const spec of contentSpecs) {
      try {
        // Skip if already cached
        if (cmsCache.has(spec.key)) {
          continue;
        }

        const data = await spec.fetcher();
        if (cmsCache.set(spec.key, data, spec.ttl, spec.tags)) {
          warmedCount++;
        }
      } catch (error) {
        if (DEV_CONFIG.debugMode) {
          Logger.error(`Failed to warm specific content: ${spec.key}`, error);
        }
      }
    }

    return warmedCount;
  }

  /**
   * Preload content in background
   */
  async preloadInBackground(
    contentSpecs: Array<{
      key: string;
      fetcher: () => Promise<any>;
      ttl?: number;
      tags?: string[];
    }>
  ): Promise<void> {
    if (!this.config.backgroundWarming) {
      return;
    }

    // Schedule background preloading
    setTimeout(async () => {
      await this.warmSpecificContent(contentSpecs);
    }, 0);
  }

  /**
   * Invalidate and re-warm specific cache tags
   */
  async invalidateAndRewarm(tags: string[]): Promise<number> {
    // First invalidate
    const invalidatedCount = cmsCache.deleteByTags(tags);
    
    if (DEV_CONFIG.debugMode) {
      Logger.info(`Invalidated ${invalidatedCount} cache entries for tags: ${tags.join(', ')}`);
    }

    // Then re-warm critical content if affected
    if (tags.some(tag => ['blog', 'posts', 'featured'].includes(tag))) {
      await this.warmCriticalContent();
    }

    return invalidatedCount;
  }

  /**
   * Get warming statistics
   */
  getWarmingStats(): {
    isWarming: boolean;
    lastWarmingTime: number;
    nextScheduledWarming: number;
    cacheStats: ReturnType<typeof cmsCache.getStats>;
  } {
    return {
      isWarming: this.isWarming,
      lastWarmingTime: this.lastWarmingTime,
      nextScheduledWarming: this.lastWarmingTime + this.config.warmingInterval,
      cacheStats: cmsCache.getStats(),
    };
  }

  /**
   * Update popular posts for warming
   */
  updatePopularPosts(slugs: string[]): void {
    this.config.criticalContent.topPosts = slugs;
    
    if (DEV_CONFIG.debugMode) {
      Logger.info(`Updated popular posts for warming: ${slugs.join(', ')}`);
    }
  }

  /**
   * Start automatic cache warming
   */
  private startAutoWarming(): void {
    if (this.warmingTimer) {
      clearInterval(this.warmingTimer);
    }

    // Initial warming
    setTimeout(() => {
      this.warmCriticalContent();
    }, 5000); // 5 seconds after initialization

    // Periodic warming
    this.warmingTimer = setInterval(async () => {
      if (!this.isWarming) {
        await this.warmCriticalContent();
      }
    }, this.config.warmingInterval);

    if (DEV_CONFIG.debugMode) {
      Logger.info(`Auto cache warming started with ${this.config.warmingInterval}ms interval`);
    }
  }

  /**
   * Stop automatic cache warming
   */
  stopAutoWarming(): void {
    if (this.warmingTimer) {
      clearInterval(this.warmingTimer);
      this.warmingTimer = undefined;
    }

    if (DEV_CONFIG.debugMode) {
      Logger.info('Auto cache warming stopped');
    }
  }

  /**
   * Destroy warming service
   */
  destroy(): void {
    this.stopAutoWarming();
    this.isWarming = false;
    
    if (DEV_CONFIG.debugMode) {
      Logger.info('Cache warming service destroyed');
    }
  }

  // Utility methods

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Singleton instance
export const cacheWarmingService = new CacheWarmingService();

// Utility functions for easy integration

/**
 * Warm cache for homepage content
 */
export async function warmHomepageCache(): Promise<void> {
  await cacheWarmingService.warmCriticalContent();
}

/**
 * Warm cache for specific blog post and related content
 */
export async function warmBlogPostCache(slug: string): Promise<void> {
  const { blogService } = await import('../cms/blog-service');
  
  await cacheWarmingService.warmSpecificContent([
    {
      key: CacheKeys.blogPost(slug),
      fetcher: () => blogService.getPostBySlug(slug),
      ttl: 5 * 60 * 1000,
      tags: ['blog', 'post', slug],
    },
  ]);
}

/**
 * Invalidate blog cache when content is updated
 */
export async function invalidateBlogCache(
  type: 'all' | 'posts' | 'categories' | 'featured' = 'all'
): Promise<void> {
  const tagsToInvalidate: string[] = ['blog'];
  
  if (type === 'all') {
    tagsToInvalidate.push('posts', 'categories', 'featured', 'recent');
  } else {
    tagsToInvalidate.push(type);
  }
  
  await cacheWarmingService.invalidateAndRewarm(tagsToInvalidate);
}

export default cacheWarmingService;