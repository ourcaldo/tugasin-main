/**
 * Memory-based Caching Layer
 * Production-ready memory cache with LRU eviction, TTL, and cache warming
 * Serves as fallback for Redis and improves CMS response performance
 */

import { Logger } from '@/lib/utils/logger';
import { DEV_CONFIG } from '@/lib/utils/constants';

// Cache entry interface
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
  size: number;
  tags?: string[];
}

// Cache statistics interface
export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  totalHits: number;
  totalMisses: number;
  oldestEntry: number;
  newestEntry: number;
  memoryUsage: number;
}

// Cache configuration
export interface MemoryCacheConfig {
  maxSize: number;        // Maximum cache size in bytes
  maxEntries: number;     // Maximum number of entries
  defaultTTL: number;     // Default TTL in milliseconds
  checkInterval: number;  // Cleanup interval in milliseconds
  enableCompression: boolean;
  enableStats: boolean;
}

// Default configuration optimized for CMS responses
const DEFAULT_CONFIG: MemoryCacheConfig = {
  maxSize: (parseInt(process.env.MEMORY_CACHE_MAX_SIZE_MB || '50') * 1024 * 1024),  // Default 50MB
  maxEntries: parseInt(process.env.MEMORY_CACHE_MAX_ENTRIES || '1000'),             // Default 1000 entries
  defaultTTL: (parseInt(process.env.MEMORY_CACHE_DEFAULT_TTL_MINUTES || '5') * 60 * 1000), // Default 5 minutes
  checkInterval: 60 * 1000,    // 1 minute cleanup
  enableCompression: true,
  enableStats: true,
};

/**
 * Production-ready Memory Cache with LRU eviction and TTL
 */
export class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
  };
  private config: MemoryCacheConfig;
  private cleanupTimer?: NodeJS.Timeout;
  private accessOrder: string[] = []; // For LRU tracking

  constructor(config: Partial<MemoryCacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Start cleanup timer
    if (this.config.checkInterval > 0) {
      this.startCleanupTimer();
    }

    if (DEV_CONFIG.debugMode) {
      Logger.info('Memory cache initialized', {
        maxSize: this.config.maxSize,
        maxEntries: this.config.maxEntries,
        defaultTTL: this.config.defaultTTL,
      });
    }
  }

  /**
   * Get value from cache with LRU tracking
   */
  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check TTL
    if (this.isExpired(entry)) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access tracking for LRU
    this.updateAccess(key, entry);
    this.stats.hits++;
    
    return entry.data as T;
  }

  /**
   * Set value in cache with TTL and size management
   */
  set<T = any>(
    key: string, 
    value: T, 
    ttl?: number,
    tags?: string[]
  ): boolean {
    try {
      const size = this.calculateSize(value);
      const entryTTL = ttl || this.config.defaultTTL;
      const now = Date.now();

      // Check if this would exceed size limits
      if (size > this.config.maxSize) {
        if (DEV_CONFIG.debugMode) {
          Logger.warn(`Cache entry too large: ${key} (${size} bytes)`);
        }
        return false;
      }

      // Create cache entry
      const entry: CacheEntry<T> = {
        data: value,
        timestamp: now,
        ttl: entryTTL,
        accessCount: 1,
        lastAccess: now,
        size,
        tags,
      };

      // Remove existing entry if it exists
      if (this.cache.has(key)) {
        this.delete(key);
      }

      // Ensure we have space
      this.ensureSpace(size);

      // Add new entry
      this.cache.set(key, entry);
      this.accessOrder.push(key);
      this.stats.totalSize += size;

      if (DEV_CONFIG.debugMode) {
        Logger.info(`Cache set: ${key} (${size} bytes, TTL: ${entryTTL}ms)`);
      }

      return true;
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error(`Failed to set cache entry: ${key}`, error);
      }
      return false;
    }
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.stats.totalSize -= entry.size;
    
    // Remove from access order
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }

    if (DEV_CONFIG.debugMode) {
      Logger.info(`Cache deleted: ${key}`);
    }

    return true;
  }

  /**
   * Delete cache entries by tags
   */
  deleteByTags(tags: string[]): number {
    let deletedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
        this.delete(key);
        deletedCount++;
      }
    }

    if (DEV_CONFIG.debugMode && deletedCount > 0) {
      Logger.info(`Cache invalidated by tags: ${tags.join(', ')} (${deletedCount} entries)`);
    }

    return deletedCount;
  }

  /**
   * Check if cache has key and it's not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.stats.totalSize = 0;
    
    if (DEV_CONFIG.debugMode) {
      Logger.info('Cache cleared');
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    return {
      totalEntries: this.cache.size,
      totalSize: this.stats.totalSize,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      missRate: this.stats.misses / (this.stats.hits + this.stats.misses) || 0,
      evictionCount: this.stats.evictions,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      oldestEntry: entries.reduce((oldest, entry) => 
        Math.min(oldest, entry.timestamp), now),
      newestEntry: entries.reduce((newest, entry) => 
        Math.max(newest, entry.timestamp), 0),
      memoryUsage: process.memoryUsage().heapUsed,
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    let cleanedCount = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.delete(key);
        cleanedCount++;
      }
    }

    if (DEV_CONFIG.debugMode && cleanedCount > 0) {
      Logger.info(`Cache cleanup: removed ${cleanedCount} expired entries`);
    }

    return cleanedCount;
  }

  /**
   * Warm cache with predefined data
   */
  async warmCache(
    warmupData: Array<{
      key: string;
      fetcher: () => Promise<any>;
      ttl?: number;
      tags?: string[];
    }>
  ): Promise<number> {
    let warmedCount = 0;
    
    for (const { key, fetcher, ttl, tags } of warmupData) {
      try {
        // Skip if already cached and not expired
        if (this.has(key)) {
          continue;
        }
        
        const data = await fetcher();
        if (this.set(key, data, ttl, tags)) {
          warmedCount++;
        }
      } catch (error) {
        if (DEV_CONFIG.debugMode) {
          Logger.error(`Cache warming failed for key: ${key}`, error);
        }
      }
    }

    if (DEV_CONFIG.debugMode) {
      Logger.info(`Cache warmed: ${warmedCount} entries`);
    }

    return warmedCount;
  }

  /**
   * Get or set pattern for cache-aside strategy
   */
  async getOrSet<T = any>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
    tags?: string[]
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch data and cache it
    try {
      const data = await fetcher();
      this.set(key, data, ttl, tags);
      return data;
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error(`Failed to fetch and cache data for key: ${key}`, error);
      }
      throw error;
    }
  }

  /**
   * Preload cache entries in background
   */
  async preload(keys: Array<{
    key: string;
    fetcher: () => Promise<any>;
    ttl?: number;
    tags?: string[];
  }>): Promise<void> {
    // Process in background without blocking
    setTimeout(async () => {
      for (const { key, fetcher, ttl, tags } of keys) {
        try {
          if (!this.has(key)) {
            const data = await fetcher();
            this.set(key, data, ttl, tags);
          }
        } catch (error) {
          if (DEV_CONFIG.debugMode) {
            Logger.error(`Cache preload failed for key: ${key}`, error);
          }
        }
      }
    }, 0);
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    
    this.clear();
    
    if (DEV_CONFIG.debugMode) {
      Logger.info('Memory cache destroyed');
    }
  }

  // Private helper methods

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private updateAccess(key: string, entry: CacheEntry): void {
    entry.accessCount++;
    entry.lastAccess = Date.now();
    
    // Move to end of access order (most recently used)
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  private calculateSize(value: any): number {
    try {
      // Rough estimation of object size in bytes
      const jsonString = JSON.stringify(value);
      return new Blob([jsonString]).size;
    } catch {
      // Fallback estimation
      return 1024; // 1KB default
    }
  }

  private ensureSpace(requiredSize: number): void {
    // Check entry count limit
    while (this.cache.size >= this.config.maxEntries) {
      this.evictLRU();
    }

    // Check size limit
    while (this.stats.totalSize + requiredSize > this.config.maxSize) {
      this.evictLRU();
    }
  }

  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;
    
    // Remove least recently used entry
    const lruKey = this.accessOrder[0];
    this.delete(lruKey);
    this.stats.evictions++;
    
    if (DEV_CONFIG.debugMode) {
      Logger.info(`LRU eviction: ${lruKey}`);
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.checkInterval);
  }
}

// Singleton instances for different cache types
export const cmsCache = new MemoryCache({
  maxSize: 30 * 1024 * 1024,  // 30MB for CMS content
  maxEntries: 500,
  defaultTTL: 5 * 60 * 1000,  // 5 minutes
  checkInterval: 2 * 60 * 1000, // 2 minutes cleanup
});

export const staticCache = new MemoryCache({
  maxSize: 20 * 1024 * 1024,  // 20MB for static content
  maxEntries: 300,
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  checkInterval: 5 * 60 * 1000, // 5 minutes cleanup
});

// Cache key builders for consistency
export const CacheKeys = {
  blogPosts: (limit?: number, offset?: number) => 
    `blog:posts:${limit || 'all'}:${offset || 0}`,
  blogPost: (slug: string) => `blog:post:${slug}`,
  blogCategories: () => 'blog:categories',
  featuredPost: () => 'blog:featured',
  recentPosts: (limit: number) => `blog:recent:${limit}`,
  cmsStatus: () => 'cms:status',
  cmsHealth: () => 'cms:health',
  SITEMAP_POSTS: 'sitemap:all-posts',
};

// Export default instance
export default cmsCache;