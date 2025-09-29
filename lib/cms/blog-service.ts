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
    
    // For sitemap generation (when offset > 0), don't use cache - get fresh data with pagination
    const isRequestingPagination = offset > 0 || limit > 50;
    
    // Return cached data if available and not expired (only for first page requests)
    if (!forceRefresh && !isRequestingPagination && this.cachedPosts.length > 0 && (now - this.lastFetchTime) < this.cacheExpiry) {
      return this.cachedPosts.slice(offset, offset + limit);
    }

    // Try to fetch from CMS, fallback to cache if offline
    try {
      if (DEV_CONFIG.debugMode) {
        Logger.info('Fetching posts from CMS...');
      }
      const response = await graphqlClient.getAllPosts(limit, undefined);
      
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
      // If CMS fails, use cached data
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
    // Check if CMS is available first
    const cmsIsAvailable = await this.checkCMSAvailability();
    if (!cmsIsAvailable) {
      if (DEV_CONFIG.debugMode) {
        Logger.info('CMS is not available, trying cached posts for slug:', slug);
      }
      // Try to find in cached posts if CMS is unavailable
      return this.cachedPosts.find(post => post.slug === slug) || null;
    }

    try {
      if (DEV_CONFIG.debugMode) {
        Logger.info('Fetching post by slug from CMS:', slug);
      }
      
      const response = await graphqlClient.getPostBySlug(slug);
      
      if (!response.post) {
        if (DEV_CONFIG.debugMode) {
          Logger.info('Post not found in CMS:', slug);
        }
        return null;
      }
      
      const post = transformCMSPost(response.post);
      
      if (DEV_CONFIG.debugMode) {
        Logger.info('Successfully fetched post from CMS:', post.title);
      }
      
      return post;
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('Failed to fetch post by slug from CMS:', error);
      }
      
      // Try to find in cached posts as last resort
      const cachedPost = this.cachedPosts.find(post => post.slug === slug);
      if (cachedPost && DEV_CONFIG.debugMode) {
        Logger.info('Returning cached post for slug:', slug);
      }
      return cachedPost || null;
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