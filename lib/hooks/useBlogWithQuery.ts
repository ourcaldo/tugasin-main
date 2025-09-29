/**
 * Enhanced Blog Hooks with React Query Caching
 * Provides optimized data fetching with intelligent caching and background updates
 */

"use client";

import { useQuery, useQueries, UseQueryResult } from '@tanstack/react-query';
import { blogService } from '@/lib/cms/blog-service';
import { QUERY_KEYS, CACHE_CONFIG, cacheUtils } from '@/lib/cache/query-client';
import type { BlogPost, BlogCategory } from '@/lib/utils/types';
import { DEV_CONFIG } from '@/lib/utils/constants';
import { Logger } from '@/lib/utils/logger';

// Enhanced blog hook with React Query
export interface UseBlogWithQueryReturn {
  featuredPost: BlogPost | null;
  blogPosts: BlogPost[];
  categories: BlogCategory[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isStale: boolean;
  refresh: () => Promise<void>;
  prefetchPost: (slug: string) => Promise<void>;
}

export function useBlogWithQuery(): UseBlogWithQueryReturn {
  // Use parallel queries for optimal performance
  const queries = useQueries({
    queries: [
      {
        queryKey: QUERY_KEYS.FEATURED_POST,
        queryFn: () => blogService.getFeaturedPost(),
        ...CACHE_CONFIG.BLOG_CONTENT,
        meta: { description: 'Featured blog post' }
      },
      {
        queryKey: QUERY_KEYS.RECENT_POSTS(10),
        queryFn: () => blogService.getRecentPosts(10),
        ...CACHE_CONFIG.BLOG_CONTENT,
        meta: { description: 'Recent blog posts' }
      },
      {
        queryKey: QUERY_KEYS.BLOG_CATEGORIES,
        queryFn: () => blogService.getCategories(),
        ...CACHE_CONFIG.STATIC_CONTENT,
        meta: { description: 'Blog categories' }
      }
    ]
  });

  const [featuredQuery, postsQuery, categoriesQuery] = queries;

  // Debug logging in development
  if (DEV_CONFIG.debugMode) {
    const queryStates = queries.map(q => ({
      status: q.status,
      isFetching: q.isFetching,
      isStale: q.isStale
    }));
    Logger.info('Blog queries state:', queryStates);
  }

  // Compute derived states
  const isLoading = queries.some(query => query.isLoading);
  const isError = queries.some(query => query.isError);
  const isStale = queries.some(query => query.isStale);
  const firstError = queries.find(query => query.error)?.error || null;

  // Refresh function to invalidate and refetch all blog data
  const refresh = async (): Promise<void> => {
    try {
      cacheUtils.invalidateBlogQueries();
      await Promise.all([
        featuredQuery.refetch(),
        postsQuery.refetch(),
        categoriesQuery.refetch()
      ]);
      
      if (DEV_CONFIG.debugMode) {
        Logger.info('Blog data refreshed successfully');
      }
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('Failed to refresh blog data:', error);
      }
      throw error;
    }
  };

  // Prefetch individual post for better UX
  const prefetchPost = async (slug: string): Promise<void> => {
    await cacheUtils.prefetchBlogPost(slug, () => blogService.getPostBySlug(slug));
  };

  return {
    featuredPost: featuredQuery.data || null,
    blogPosts: postsQuery.data || [],
    categories: categoriesQuery.data || [],
    isLoading,
    isError,
    error: firstError,
    isStale,
    refresh,
    prefetchPost
  };
}

// Hook for fetching a specific blog post with caching
export function useBlogPost(slug: string): {
  post: BlogPost | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isStale: boolean;
} {
  const query = useQuery({
    queryKey: QUERY_KEYS.BLOG_POST(slug),
    queryFn: () => blogService.getPostBySlug(slug),
    ...CACHE_CONFIG.BLOG_CONTENT,
    enabled: !!slug, // Only run query if slug is provided
    meta: { description: `Blog post: ${slug}` }
  });

  if (DEV_CONFIG.debugMode && query.error) {
    Logger.error(`Failed to fetch blog post: ${slug}`, query.error);
  }

  return {
    post: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isStale: query.isStale
  };
}

// Hook for fetching recent posts with configurable limit
export function useRecentPostsWithQuery(limit: number = 3): {
  posts: BlogPost[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isStale: boolean;
} {
  const query = useQuery({
    queryKey: QUERY_KEYS.RECENT_POSTS(limit),
    queryFn: () => blogService.getRecentPosts(limit),
    ...CACHE_CONFIG.BLOG_CONTENT,
    meta: { description: `Recent posts (${limit})` }
  });

  return {
    posts: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isStale: query.isStale
  };
}

// Hook for CMS status monitoring
export function useCMSStatus(): {
  isAvailable: boolean | null;
  isLoading: boolean;
  lastChecked: number;
  error: Error | null;
} {
  const query = useQuery({
    queryKey: QUERY_KEYS.CMS_STATUS,
    queryFn: () => blogService.checkCMSAvailability(),
    ...CACHE_CONFIG.CMS_STATUS,
    meta: { description: 'CMS availability status' }
  });

  const { available, lastChecked } = blogService.getCMSStatus();

  return {
    isAvailable: query.data !== undefined ? query.data : available,
    isLoading: query.isLoading,
    lastChecked,
    error: query.error
  };
}

// Hook for prefetching blog data (useful for route preloading)
export function useBlogPrefetch() {
  return {
    prefetchBlogPosts: cacheUtils.prefetchBlogPosts,
    prefetchBlogPost: cacheUtils.prefetchBlogPost,
    prefetchCategories: () => {
      return cacheUtils.queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.BLOG_CATEGORIES,
        queryFn: () => blogService.getCategories(),
        staleTime: CACHE_CONFIG.STATIC_CONTENT.staleTime,
      });
    }
  };
}

// Advanced hook for blog analytics and cache monitoring
export function useBlogCacheStats() {
  if (!DEV_CONFIG.debugMode) {
    return null;
  }

  const stats = cacheUtils.getCacheStats();
  
  return {
    ...stats,
    clearCache: cacheUtils.clearCache,
    invalidateBlogs: cacheUtils.invalidateBlogQueries,
  };
}

// Backward compatibility - enhanced version of original hook
export function useBlog(): UseBlogWithQueryReturn {
  return useBlogWithQuery();
}

// Export enhanced version of useRecentPosts for backward compatibility
export function useRecentPosts(limit: number = 3): {
  posts: BlogPost[];
  isLoading: boolean;
  error: string | null;
} {
  const { posts, isLoading, error } = useRecentPostsWithQuery(limit);
  
  return {
    posts,
    isLoading,
    error: error?.message || null
  };
}