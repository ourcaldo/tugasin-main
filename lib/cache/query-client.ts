/**
 * React Query Configuration and Client Setup
 * Provides optimized caching for CMS data with smart revalidation strategies
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { Logger } from '@/lib/utils/logger';
import { DEV_CONFIG } from '@/lib/utils/constants';

// Cache keys for consistent query management
export const QUERY_KEYS = {
  // Blog queries
  BLOG_POSTS: ['blog', 'posts'] as const,
  BLOG_POST: (slug: string) => ['blog', 'post', slug] as const,
  BLOG_CATEGORIES: ['blog', 'categories'] as const,
  FEATURED_POST: ['blog', 'featured'] as const,
  RECENT_POSTS: (limit: number) => ['blog', 'recent', limit] as const,
  
  // CMS status
  CMS_STATUS: ['cms', 'status'] as const,
} as const;

// Cache configuration with optimized settings for different data types
const CACHE_CONFIG = {
  // Blog content has medium update frequency
  BLOG_CONTENT: {
    staleTime: 5 * 60 * 1000,      // 5 minutes - data stays fresh
    gcTime: 30 * 60 * 1000,        // 30 minutes - garbage collection time
    refetchOnWindowFocus: false,    // Don't refetch on window focus
    refetchOnMount: true,           // Refetch when component mounts
    retry: 2,                       // Retry failed requests twice
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  
  // Static content like categories changes rarely
  STATIC_CONTENT: {
    staleTime: 15 * 60 * 1000,     // 15 minutes
    gcTime: 60 * 60 * 1000,        // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  },
  
  // CMS status needs frequent updates
  CMS_STATUS: {
    staleTime: 2 * 60 * 1000,      // 2 minutes
    gcTime: 5 * 60 * 1000,         // 5 minutes
    refetchOnWindowFocus: true,     // Check status on focus
    refetchOnMount: true,
    retry: 3,
    retryDelay: 1000,
  },
} as const;

// Error handling for queries
const queryCache = new QueryCache({
  onError: (error, query) => {
    if (DEV_CONFIG.debugMode) {
      Logger.error(`Query failed for key: ${JSON.stringify(query.queryKey)}`, error);
    }
    
    // Track query failures for monitoring
    if (typeof window !== 'undefined' && 'navigator' in window) {
      // Could integrate with analytics here
      console.warn('Query cache error:', { 
        queryKey: query.queryKey, 
        error: error.message 
      });
    }
  },
  onSuccess: (data, query) => {
    if (DEV_CONFIG.debugMode && data) {
      Logger.info(`Query succeeded for key: ${JSON.stringify(query.queryKey)}`);
    }
  }
});

// Mutation handling for future form submissions
const mutationCache = new MutationCache({
  onError: (error, variables, context, mutation) => {
    if (DEV_CONFIG.debugMode) {
      Logger.error(`Mutation failed:`, error);
    }
  },
  onSuccess: (data, variables, context, mutation) => {
    if (DEV_CONFIG.debugMode) {
      Logger.info(`Mutation succeeded`);
    }
  }
});

// Create the main query client with optimized defaults
export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      // Global defaults - can be overridden per query
      staleTime: CACHE_CONFIG.BLOG_CONTENT.staleTime,
      gcTime: CACHE_CONFIG.BLOG_CONTENT.gcTime,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && error.message.includes('4')) {
          return false;
        }
        return failureCount < 2;
      },
      // Use network-first strategy for better UX
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

// Utility functions for cache management
export const cacheUtils = {
  /**
   * Direct access to the query client
   */
  queryClient,

  /**
   * Invalidate all blog-related queries
   */
  invalidateBlogQueries: () => {
    queryClient.invalidateQueries({ queryKey: ['blog'] });
  },

  /**
   * Invalidate specific blog post
   */
  invalidateBlogPost: (slug: string) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BLOG_POST(slug) });
  },

  /**
   * Prefetch blog posts for better UX
   */
  prefetchBlogPosts: async () => {
    await queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.BLOG_POSTS,
      staleTime: CACHE_CONFIG.BLOG_CONTENT.staleTime,
    });
  },

  /**
   * Prefetch specific blog post
   */
  prefetchBlogPost: async (slug: string, prefetchFn: () => Promise<any>) => {
    await queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.BLOG_POST(slug),
      queryFn: prefetchFn,
      staleTime: CACHE_CONFIG.BLOG_CONTENT.staleTime,
    });
  },

  /**
   * Clear all cached data
   */
  clearCache: () => {
    queryClient.clear();
    if (DEV_CONFIG.debugMode) {
      Logger.info('Query cache cleared');
    }
  },

  /**
   * Get cache stats for debugging
   */
  getCacheStats: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      staleQueries: queries.filter(query => query.isStale()).length,
      fetchingQueries: queries.filter(query => query.state.fetchStatus === 'fetching').length,
      errorQueries: queries.filter(query => query.state.status === 'error').length,
    };
  },
};

// Cache configuration exports for use in hooks
export { CACHE_CONFIG };

// Development helpers
if (DEV_CONFIG.debugMode && typeof window !== 'undefined') {
  // Expose cache utilities to window for debugging
  (window as any).__queryClient = queryClient;
  (window as any).__cacheUtils = cacheUtils;
}