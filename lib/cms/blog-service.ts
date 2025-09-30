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
  private cachedPostCount: number = 0;
  private lastFetchTime: number = 0;
  private lastCountFetchTime: number = 0;
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private countCacheExpiry: number = 15 * 60 * 1000; // 15 minutes - longer for count
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

  // Fetch posts with proper GraphQL pagination - NO slicing in memory
  async getPosts(limit: number = 20, after?: string): Promise<BlogPost[]> {
    try {
      if (DEV_CONFIG.debugMode) {
        Logger.info(`Fetching ${limit} posts from CMS with after cursor: ${after || 'none'}`);
      }
      
      const response = await graphqlClient.getAllPosts(limit, after);
      const transformedPosts = response.posts.nodes.map(transformCMSPost);
      
      if (DEV_CONFIG.debugMode) {
        Logger.info(`Successfully fetched ${transformedPosts.length} posts from CMS`);
      }
      
      return transformedPosts;
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('Failed to fetch posts from CMS:', error);
      }
      return [];
    }
  }

  // Fetch posts for a specific page number (for blog archive pagination)
  // Uses cached sitemap data to avoid real-time CMS fetching for pagination
  async getPostsForPage(page: number, postsPerPage: number = 20): Promise<BlogPost[]> {
    try {
      if (DEV_CONFIG.debugMode) {
        Logger.info(`Fetching posts for page ${page} from cached data`);
      }
      
      // Use the cached sitemap data (24 hour TTL) to avoid hitting CMS for every pagination request
      const allPosts = await this.getAllPostsForSitemap();
      
      // Calculate start and end indices
      const startIndex = (page - 1) * postsPerPage;
      const endIndex = startIndex + postsPerPage;
      
      // Slice the posts for this page
      const posts = allPosts.slice(startIndex, endIndex);
      
      if (DEV_CONFIG.debugMode) {
        Logger.info(`Returning ${posts.length} posts for page ${page} from cache (total posts: ${allPosts.length})`);
      }
      
      return posts;
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error(`Failed to fetch posts for page ${page}:`, error);
      }
      return [];
    }
  }
  
  // For sitemap only - fetches ALL posts using cursor pagination with 1000 posts per request
  async getAllPostsForSitemap(): Promise<BlogPost[]> {
    try {
      const cacheKey = `sitemap_posts_all`;
      const now = Date.now();
      const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
      
      // Check if we have cached sitemap data (24 hour TTL)
      const cachedData = cmsCache.get<{ posts: BlogPost[], timestamp: number }>(cacheKey);
      if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
        if (DEV_CONFIG.debugMode) {
          Logger.info(`Returning cached sitemap posts: ${cachedData.posts.length} total posts`);
        }
        return cachedData.posts;
      }
      
      if (DEV_CONFIG.debugMode) {
        Logger.info(`Fetching all posts for sitemap with 1000 posts per batch`);
      }
      
      let allPosts: BlogPost[] = [];
      let hasNextPage = true;
      let after: string | undefined = undefined;
      const BATCH_SIZE = 1000; // Fetch 1000 posts per request as specified
      
      while (hasNextPage) {
        const response = await graphqlClient.getAllPosts(BATCH_SIZE, after);
        const transformedPosts = response.posts.nodes.map(transformCMSPost);
        
        allPosts = allPosts.concat(transformedPosts);
        hasNextPage = response.posts.pageInfo.hasNextPage;
        after = response.posts.pageInfo.endCursor;
        
        if (DEV_CONFIG.debugMode) {
          Logger.info(`Fetched batch: ${transformedPosts.length} posts. Total: ${allPosts.length}. HasNextPage: ${hasNextPage}`);
        }
        
        // Safety break to prevent infinite loops (increased limit)
        if (allPosts.length > 10000) {
          if (DEV_CONFIG.debugMode) {
            Logger.warn('Reached safety limit of 10000 posts');
          }
          break;
        }
      }
      
      // Cache for 24 hours
      cmsCache.set(cacheKey, { posts: allPosts, timestamp: now });
      
      if (DEV_CONFIG.debugMode) {
        Logger.info(`Cached ${allPosts.length} posts for sitemap (24 hour TTL)`);
      }
      
      return allPosts;
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('Failed to fetch posts for sitemap:', error);
      }
      return [];
    }
  }

  async getFeaturedPost(): Promise<BlogPost | null> {
    const posts = await this.getPosts(1);
    return posts.length > 0 ? { ...posts[0], featured: true } : null;
  }

  async getRecentPosts(limit: number = 6): Promise<BlogPost[]> {
    return this.getPosts(limit);
  }
  
  // Get posts by category with limit - no fetching all posts
  async getPostsByCategory(category: string, limit: number = 3): Promise<BlogPost[]> {
    try {
      // Fetch more posts to filter by category, but still limited
      const posts = await this.getPosts(50);
      return posts.filter(post => post.category === category).slice(0, limit);
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('Failed to fetch posts by category:', error);
      }
      return [];
    }
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

  // Optimized method to get total post count with longer cache TTL
  async getTotalPostCount(): Promise<number> {
    const now = Date.now();
    const isCountCacheValid = (now - this.lastCountFetchTime) < this.countCacheExpiry;

    // Return cached count if valid
    if (this.cachedPostCount > 0 && isCountCacheValid) {
      if (DEV_CONFIG.debugMode) {
        Logger.info(`Returning cached post count: ${this.cachedPostCount}`);
      }
      return this.cachedPostCount;
    }

    // If we have cached posts, we can count them
    const isCacheValid = (now - this.lastFetchTime) < this.cacheExpiry;
    if (this.cachedPosts.length > 0 && isCacheValid) {
      this.cachedPostCount = this.cachedPosts.length;
      this.lastCountFetchTime = now;
      if (DEV_CONFIG.debugMode) {
        Logger.info(`Using cached posts for count: ${this.cachedPostCount}`);
      }
      return this.cachedPostCount;
    }

    // Fetch count from CMS using optimized query
    try {
      if (DEV_CONFIG.debugMode) {
        Logger.info('Fetching post count from CMS...');
      }

      const count = await graphqlClient.getTotalPostCount();
      this.cachedPostCount = count;
      this.lastCountFetchTime = now;

      if (DEV_CONFIG.debugMode) {
        Logger.info(`Successfully fetched post count from CMS: ${count}`);
      }

      return count;
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('Failed to fetch post count from CMS:', error);
      }

      // Fallback to cached count if available
      if (this.cachedPostCount > 0) {
        if (DEV_CONFIG.debugMode) {
          Logger.info(`Returning stale cached count: ${this.cachedPostCount}`);
        }
        return this.cachedPostCount;
      }

      // Last resort: count from cached posts even if stale
      if (this.cachedPosts.length > 0) {
        return this.cachedPosts.length;
      }

      return 0;
    }
  }

  async getCategories(): Promise<BlogCategory[]> {
    if (this.cachedCategories.length > 0) {
      return this.cachedCategories;
    }

    const posts = await this.getPosts(50);
    
    if (posts.length === 0) {
      // Return empty categories if no posts - NO fallback data
      this.cachedCategories = [];
      return [];
    }

    const categoryMap = new Map<string, number>();

    // Count posts per category
    posts.forEach((post: BlogPost) => {
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
    this.cachedPostCount = 0;
    this.lastFetchTime = 0;
    this.lastCountFetchTime = 0;
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