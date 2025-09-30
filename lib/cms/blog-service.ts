import { graphqlClient, CMSPost } from './graphql';
import type { BlogPost, BlogCategory } from '@/lib/utils/types';
import { DEV_CONFIG } from '@/lib/utils/constants';
import { Logger } from '@/lib/utils/logger';
import { sanitizeContent, sanitizeText, sanitizeUrl, validateSanitizer } from './sanitizer';
import { cmsCache, CacheKeys } from '../cache/memory-cache';
// Remove React imports from service layer

// Helper function to calculate read time based on content length
function calculateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} menit`;
}

// Helper function to extract plain text from HTML content
function extractExcerpt(content: string, maxLength: number = 200): string {
  const plainText = content.replace(/<[^>]*>/g, '').trim();
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

// Helper function to clean content formatting issues and sanitize HTML
function cleanContentForDisplay(content: string): string {
  const cleanedContent = content
    // Remove excessive line breaks that cause choppy text
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\r+/g, ' ')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    // Restore proper paragraph structure  
    .replace(/<\/p>\s*<p>/gi, '</p><p>')
    .replace(/<p>/gi, '<p>')
    .replace(/<\/p>/gi, '</p>')
    // Ensure proper spacing around block elements
    .replace(/<(h[1-6]|div|blockquote|ul|ol|li)>/gi, '<$1>')
    .replace(/<\/(h[1-6]|div|blockquote|ul|ol|li)>/gi, '</$1>')
    .trim();
  
  // Apply security sanitization to prevent XSS attacks
  return sanitizeContent(cleanedContent);
}

// Transform CMS post to BlogPost format with security sanitization
function transformCMSPost(cmsPost: CMSPost): BlogPost {
  const primaryCategory = sanitizeText(cmsPost.categories.nodes[0]?.name || 'Umum');
  const imageUrl = sanitizeUrl(
    cmsPost.featuredImage?.node.sourceUrl || 
    cmsPost.fifuImageUrl || 
    process.env.NEXT_PUBLIC_FALLBACK_IMAGE_URL ||
    'https://images.unsplash.com/photo-1586339393565-32161f258eac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
  );

  // Sanitize content fields to prevent XSS attacks
  const sanitizedTitle = sanitizeText(cmsPost.title || '');
  const sanitizedContent = cmsPost.content || '';
  const sanitizedExcerpt = sanitizeText(cmsPost.excerpt || extractExcerpt(sanitizedContent));
  const sanitizedAuthor = sanitizeText(cmsPost.author.node.name || '');

  return {
    id: cmsPost.databaseId,
    title: sanitizedTitle,
    excerpt: sanitizedExcerpt,
    author: sanitizedAuthor,
    date: new Date(cmsPost.date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    readTime: calculateReadTime(sanitizedContent),
    category: primaryCategory,
    image: imageUrl,
    slug: cmsPost.slug, // Slug is safe as it's controlled by CMS
    content: cleanContentForDisplay(sanitizedContent), // Already sanitized in cleanContentForDisplay
    tags: cmsPost.tags.nodes.map(tag => sanitizeText(tag.name || '')),
    seo: {
      title: sanitizeText(cmsPost.seo?.title || ''),
      description: sanitizeText(cmsPost.seo?.description || ''),
      focusKeywords: (cmsPost.seo?.focusKeywords || []).map(keyword => sanitizeText(keyword))
    }
  };
}

// Blog service class
export class BlogService {
  private cachedPosts: BlogPost[] = [];
  private cachedCategories: BlogCategory[] = [];
  private lastFetchTime: number = 0;
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private cmsAvailable: boolean | null = null;
  private lastCMSCheck: number = 0;
  private cmsCheckInterval: number = 2 * 60 * 1000; // 2 minutes

  constructor() {
    // Validate sanitizer on initialization
    if (!validateSanitizer()) {
      Logger.error('Content sanitizer validation failed. This is a security risk.');
      throw new Error('Failed to initialize secure content sanitization');
    }
    
    if (DEV_CONFIG.debugMode) {
      Logger.info('BlogService initialized with secure content sanitization');
    }
  }

  async checkCMSAvailability(): Promise<boolean> {
    // If CMS is disabled in config, return false immediately
    if (!DEV_CONFIG.enableCMS) {
      if (DEV_CONFIG.debugMode) {
        Logger.info('CMS is disabled in configuration');
      }
      return false;
    }

    const now = Date.now();
    
    // Return cached CMS status if recently checked
    if (this.cmsAvailable !== null && (now - this.lastCMSCheck) < this.cmsCheckInterval) {
      return this.cmsAvailable;
    }

    try {
      this.cmsAvailable = await graphqlClient.isAvailable();
      this.lastCMSCheck = now;
      if (DEV_CONFIG.debugMode) {
        Logger.info(`CMS availability check: ${this.cmsAvailable}`);
      }
      return this.cmsAvailable;
    } catch {
      this.cmsAvailable = false;
      this.lastCMSCheck = now;
      if (DEV_CONFIG.debugMode) {
        Logger.info('CMS availability check failed');
      }
      return false;
    }
  }

  async getAllPosts(limit: number = 50, offset: number = 0, forceRefresh: boolean = false): Promise<BlogPost[]> {
    const now = Date.now();
    
    // For sitemap generation (when requesting all posts), use pagination to fetch everything
    const isSitemapRequest = limit >= 200; // Sitemap requests use 200+ posts per page
    const isRequestingPagination = offset > 0 || limit > 50;
    const isCacheValid = (now - this.lastFetchTime) < this.cacheExpiry;
    
    // Cache-first strategy: Return cached data immediately if available and valid
    if (!forceRefresh && !isRequestingPagination && !isSitemapRequest && this.cachedPosts.length > 0 && isCacheValid) {
      if (DEV_CONFIG.debugMode) {
        Logger.info('Returning cached posts for instant loading');
      }
      return this.cachedPosts.slice(offset, offset + limit);
    }
    
    // If cache is stale but we have data, return it and refresh in background
    if (!forceRefresh && !isRequestingPagination && !isSitemapRequest && this.cachedPosts.length > 0 && !isCacheValid) {
      if (DEV_CONFIG.debugMode) {
        Logger.info('Returning stale cached posts and refreshing in background');
      }
      
      // Refresh in background
      this.refreshAllPostsInBackground();
      return this.cachedPosts.slice(offset, offset + limit);
    }

    // For sitemap generation, fetch ALL posts using pagination
    if (isSitemapRequest) {
      return this.getAllPostsForSitemap(limit, offset);
    }

    // No cache or forced refresh - fetch from CMS with timeout protection
    try {
      if (DEV_CONFIG.debugMode) {
        Logger.info('Fetching posts from CMS...');
      }
      
      // Add timeout protection
      const cmsPromise = graphqlClient.getAllPosts(limit, undefined);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('CMS request timeout')), 8000)
      );
      
      const response = await Promise.race([cmsPromise, timeoutPromise]) as any;
      const transformedPosts = response.posts.nodes.map(transformCMSPost);
      
      if (!isRequestingPagination) {
        this.cachedPosts = transformedPosts;
        this.lastFetchTime = now;
      }
      
      if (DEV_CONFIG.debugMode) {
        Logger.info(`Successfully fetched ${transformedPosts.length} posts from CMS`);
      }
      return transformedPosts;
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('CMS request failed:', error);
      }
      
      // Fallback to any cached data we have
      if (this.cachedPosts.length > 0) {
        if (DEV_CONFIG.debugMode) {
          Logger.info(`CMS failed, serving ${this.cachedPosts.length} cached posts`);
        }
        return this.cachedPosts.slice(offset, offset + limit);
      }
      
      if (DEV_CONFIG.debugMode) {
        Logger.error('CMS failed and no cache available:', error);
      }
      return [];
    }
  }
  
  // Special method for sitemap generation that fetches ALL posts using pagination
  private async getAllPostsForSitemap(requestedLimit: number, offset: number): Promise<BlogPost[]> {
    try {
      if (DEV_CONFIG.debugMode) {
        Logger.info('Fetching ALL posts for sitemap generation using pagination...');
      }
      
      let allPosts: BlogPost[] = [];
      let hasNextPage = true;
      let after: string | undefined = undefined;
      const batchSize = 100; // WordPress/CMS limit per request
      
      while (hasNextPage && allPosts.length < requestedLimit) {
        const response = await graphqlClient.getAllPosts(batchSize, after);
        const transformedPosts = response.posts.nodes.map(transformCMSPost);
        
        allPosts = allPosts.concat(transformedPosts);
        hasNextPage = response.posts.pageInfo.hasNextPage;
        after = response.posts.pageInfo.endCursor;
        
        if (DEV_CONFIG.debugMode) {
          Logger.info(`Fetched batch: ${transformedPosts.length} posts. Total so far: ${allPosts.length}`);
        }
        
        // Safety break to prevent infinite loops
        if (allPosts.length > 2000) {
          if (DEV_CONFIG.debugMode) {
            Logger.warn('Reached safety limit of 2000 posts, stopping pagination');
          }
          break;
        }
      }
      
      if (DEV_CONFIG.debugMode) {
        Logger.info(`Successfully fetched ${allPosts.length} total posts for sitemap`);
      }
      
      // Return the requested slice with offset and limit
      return allPosts.slice(offset, offset + requestedLimit);
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('Failed to fetch posts for sitemap:', error);
      }
      return [];
    }
  }
  
  // Background refresh method for all posts
  private async refreshAllPostsInBackground(): Promise<void> {
    try {
      const response = await graphqlClient.getAllPosts(50, undefined);
      const transformedPosts = response.posts.nodes.map(transformCMSPost);
      
      this.cachedPosts = transformedPosts;
      this.lastFetchTime = Date.now();
      
      if (DEV_CONFIG.debugMode) {
        Logger.info('Background refresh completed for all posts');
      }
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.warn('Background refresh failed for all posts', error);
      }
    }
  }

  async getFeaturedPost(): Promise<BlogPost | null> {
    const posts = await this.getAllPosts();
    // Return the most recent post as featured, or the first one
    return posts.length > 0 ? { ...posts[0], featured: true } : null;
  }

  async getRecentPosts(limit: number = 6): Promise<BlogPost[]> {
    const posts = await this.getAllPosts(50, 0);
    return posts.slice(0, limit);
  }

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    // Cache-first strategy: Check cache first for instant loading
    const cachedPost = this.cachedPosts.find(post => post.slug === slug);
    const now = Date.now();
    const isCacheValid = (now - this.lastFetchTime) < this.cacheExpiry;
    
    // If we have cached data and it's still valid, return it immediately
    if (cachedPost && isCacheValid) {
      if (DEV_CONFIG.debugMode) {
        Logger.info('Returning cached post for instant loading:', slug);
      }
      return cachedPost;
    }
    
    // If we have cached data but it's stale, return it immediately and refresh in background
    if (cachedPost && !isCacheValid) {
      if (DEV_CONFIG.debugMode) {
        Logger.info('Returning stale cached post and refreshing in background:', slug);
      }
      
      // Refresh cache in background (fire and forget)
      this.refreshPostInBackground(slug);
      return cachedPost;
    }

    // No cached data - try to fetch from CMS with timeout protection
    try {
      if (DEV_CONFIG.debugMode) {
        Logger.info('No cache available, fetching post from CMS:', slug);
      }
      
      // Add timeout protection for CMS requests
      const cmsPromise = graphqlClient.getPostBySlug(slug);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('CMS request timeout')), 5000)
      );
      
      const response = await Promise.race([cmsPromise, timeoutPromise]) as any;
      
      if (!response.post) {
        if (DEV_CONFIG.debugMode) {
          Logger.info('Post not found in CMS:', slug);
        }
        return null;
      }
      
      const post = transformCMSPost(response.post);
      
      // Update cache with the fresh data
      const existingIndex = this.cachedPosts.findIndex(p => p.slug === slug);
      if (existingIndex >= 0) {
        this.cachedPosts[existingIndex] = post;
      } else {
        this.cachedPosts.push(post);
      }
      this.lastFetchTime = now;
      
      if (DEV_CONFIG.debugMode) {
        Logger.info('Successfully fetched and cached post from CMS:', post.title);
      }
      
      return post;
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('Failed to fetch post from CMS:', error);
      }
      
      // Return any cached data we have, even if stale
      if (cachedPost) {
        if (DEV_CONFIG.debugMode) {
          Logger.info('Returning stale cached post due to CMS failure:', slug);
        }
        return cachedPost;
      }
      
      return null;
    }
  }
  
  // Background refresh method to update cache without blocking
  private async refreshPostInBackground(slug: string): Promise<void> {
    try {
      const response = await graphqlClient.getPostBySlug(slug);
      if (response.post) {
        const post = transformCMSPost(response.post);
        const existingIndex = this.cachedPosts.findIndex(p => p.slug === slug);
        if (existingIndex >= 0) {
          this.cachedPosts[existingIndex] = post;
        } else {
          this.cachedPosts.push(post);
        }
        this.lastFetchTime = Date.now();
        
        if (DEV_CONFIG.debugMode) {
          Logger.info('Background refresh completed for post:', slug);
        }
      }
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.warn(`Background refresh failed for post: ${slug}`, error);
      }
    }
  }

  async getCategories(): Promise<BlogCategory[]> {
    if (this.cachedCategories.length > 0) {
      return this.cachedCategories;
    }

    const posts = await this.getAllPosts();
    
    if (posts.length === 0) {
      // Return empty categories if no posts - NO fallback data
      this.cachedCategories = [];
      return [];
    }

    const categoryMap = new Map<string, number>();

    // Count posts per category
    posts.forEach(post => {
      const count = categoryMap.get(post.category) || 0;
      categoryMap.set(post.category, count + 1);
    });

    // Map categories to icon names (you can expand this mapping)
    const categoryIcons: Record<string, string> = {
      'Panduan Skripsi': 'BookOpen',
      'Tips Produktivitas': 'Target',
      'Metodologi': 'Lightbulb',
      'Academic Writing': 'TrendingUp',
      'Mental Health': 'User',
      'Presentasi': 'User',
      // Default icon for other categories
    };

    this.cachedCategories = Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      count,
      icon: categoryIcons[name] || 'BookOpen'
    }));

    return this.cachedCategories;
  }

  // Method to clear cache (useful for force refresh)
  clearCache(): void {
    this.cachedPosts = [];
    this.cachedCategories = [];
    this.lastFetchTime = 0;
    this.cmsAvailable = null;
    this.lastCMSCheck = 0;
  }

  // Get CMS status
  getCMSStatus(): { available: boolean | null; lastChecked: number } {
    return {
      available: this.cmsAvailable,
      lastChecked: this.lastCMSCheck
    };
  }
}

export const blogService = new BlogService();