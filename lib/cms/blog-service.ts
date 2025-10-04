import { apiClient, CMSPost, APIPagination } from './api-client';
import type { BlogPost, BlogCategory } from '@/lib/utils/types';
import { DEV_CONFIG, CMS_CONFIG } from '@/lib/utils/constants';
import { Logger } from '@/lib/utils/logger';
import { sanitizeContent, cleanText, sanitizeUrl, validateSanitizer } from './sanitizer';
import { cmsCache, CacheKeys } from '../cache/memory-cache';

function calculateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} menit`;
}

function extractExcerpt(content: string, maxLength: number = 200): string {
  const plainText = content.replace(/<[^>]*>/g, '').trim();
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

function cleanContentForDisplay(content: string): string {
  const cleanedContent = content
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\r+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/<\/p>\s*<p>/gi, '</p><p>')
    .replace(/<p>/gi, '<p>')
    .replace(/<\/p>/gi, '</p>')
    .replace(/<(h[1-6]|div|blockquote|ul|ol|li)>/gi, '<$1>')
    .replace(/<\/(h[1-6]|div|blockquote|ul|ol|li)>/gi, '</$1>')
    .trim();
  
  return sanitizeContent(cleanedContent);
}

function transformCMSPost(cmsPost: CMSPost): BlogPost {
  const primaryCategory = cleanText(cmsPost.categories.nodes[0]?.name || 'Umum');
  const imageUrl = sanitizeUrl(
    cmsPost.featuredImage?.node.sourceUrl || 
    cmsPost.fifuImageUrl || 
    process.env.NEXT_PUBLIC_FALLBACK_IMAGE_URL ||
    'https://images.unsplash.com/photo-1586339393565-32161f258eac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
  );

  const cleanedTitle = cleanText(cmsPost.title || '');
  const sanitizedContent = cmsPost.content || '';
  const cleanedExcerpt = cleanText(cmsPost.excerpt || extractExcerpt(sanitizedContent));
  const cleanedAuthor = cleanText(cmsPost.author.node.name || '');

  return {
    id: cmsPost.databaseId,
    title: cleanedTitle,
    excerpt: cleanedExcerpt,
    author: cleanedAuthor,
    date: new Date(cmsPost.date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    readTime: calculateReadTime(sanitizedContent),
    category: primaryCategory,
    image: imageUrl,
    slug: cmsPost.slug,
    content: cleanContentForDisplay(sanitizedContent),
    tags: cmsPost.tags.nodes.map(tag => cleanText(tag.name || '')),
    seo: {
      title: cleanText(cmsPost.seo?.title || ''),
      description: cleanText(cmsPost.seo?.description || ''),
      focusKeywords: (cmsPost.seo?.focusKeywords || []).map(keyword => cleanText(keyword))
    }
  };
}

export class BlogService {
  private cachedPosts: BlogPost[] = [];
  private cachedCategories: BlogCategory[] = [];
  private cachedPostCount: number = 0;
  private lastFetchTime: number = 0;
  private lastCountFetchTime: number = 0;
  private cacheExpiry: number = 5 * 60 * 1000;
  private countCacheExpiry: number = 15 * 60 * 1000;
  private cmsAvailable: boolean | null = null;
  private lastCMSCheck: number = 0;
  private cmsCheckInterval: number = 2 * 60 * 1000;

  constructor() {
    if (!validateSanitizer()) {
      Logger.error('Content sanitizer validation failed. This is a security risk.');
      throw new Error('Failed to initialize secure content sanitization');
    }
    
    if (DEV_CONFIG.debugMode) {
      Logger.info('BlogService initialized with secure content sanitization');
    }
  }

  async checkCMSAvailability(): Promise<boolean> {
    if (!DEV_CONFIG.enableCMS) {
      if (DEV_CONFIG.debugMode) {
        Logger.info('CMS is disabled in configuration');
      }
      return false;
    }

    const now = Date.now();
    
    if (this.cmsAvailable !== null && (now - this.lastCMSCheck) < this.cmsCheckInterval) {
      return this.cmsAvailable;
    }

    try {
      this.cmsAvailable = await apiClient.isAvailable();
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

  async getPosts(limit: number = 20, page: number = 1, category?: string): Promise<BlogPost[]> {
    try {
      if (DEV_CONFIG.debugMode) {
        Logger.info(`Fetching ${limit} posts from API (page ${page}${category ? `, category=${category}` : ''})`);
      }
      
      const response = await apiClient.getPosts(page, limit, category);
      const transformedPosts = response.posts.map(post => {
        const cmsPost: CMSPost = {
          id: post.id,
          databaseId: parseInt(post.id.replace(/[^0-9]/g, '')) || 0,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          date: post.publishDate,
          featuredImage: post.featuredImage ? {
            node: { sourceUrl: post.featuredImage }
          } : undefined,
          fifuImageUrl: post.featuredImage,
          seo: {
            title: post.seo?.title || post.title,
            description: post.seo?.metaDescription || post.excerpt,
            focusKeywords: post.seo?.focusKeyword ? [post.seo.focusKeyword] : [],
            seoScore: { score: 0 },
            canonicalUrl: ''
          },
          author: {
            node: {
              id: post.authorId,
              name: 'Tugasin',
              slug: 'tugasin'
            }
          },
          categories: {
            nodes: post.categories || []
          },
          tags: {
            nodes: post.tags || []
          },
          content: post.content
        };
        return transformCMSPost(cmsPost);
      });
      
      if (DEV_CONFIG.debugMode) {
        Logger.info(`Successfully fetched ${transformedPosts.length} posts from API`);
      }
      
      return transformedPosts;
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('Failed to fetch posts from API:', error);
      }
      return [];
    }
  }

  async getPostsWithPagination(page: number = 1, postsPerPage: number = 20, category?: string): Promise<{
    posts: BlogPost[];
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      totalCount: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    try {
      if (DEV_CONFIG.debugMode) {
        Logger.info(`Fetching posts for page ${page} using API pagination${category ? ` with category=${category}` : ''}`);
      }
      
      const response = await apiClient.getPosts(page, postsPerPage, category);
      const transformedPosts = response.posts.map(post => {
        const cmsPost: CMSPost = {
          id: post.id,
          databaseId: parseInt(post.id.replace(/[^0-9]/g, '')) || 0,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          date: post.publishDate,
          featuredImage: post.featuredImage ? {
            node: { sourceUrl: post.featuredImage }
          } : undefined,
          fifuImageUrl: post.featuredImage,
          seo: {
            title: post.seo?.title || post.title,
            description: post.seo?.metaDescription || post.excerpt,
            focusKeywords: post.seo?.focusKeyword ? [post.seo.focusKeyword] : [],
            seoScore: { score: 0 },
            canonicalUrl: ''
          },
          author: {
            node: {
              id: post.authorId,
              name: 'Tugasin',
              slug: 'tugasin'
            }
          },
          categories: {
            nodes: post.categories || []
          },
          tags: {
            nodes: post.tags || []
          },
          content: post.content
        };
        return transformCMSPost(cmsPost);
      });
      
      if (DEV_CONFIG.debugMode) {
        Logger.info(`Fetched page ${page}: ${transformedPosts.length} posts`);
        Logger.info(`Pagination: page ${response.pagination.page} of ${response.pagination.totalPages}, total: ${response.pagination.total}`);
      }
      
      return {
        posts: transformedPosts,
        pageInfo: {
          hasNextPage: response.pagination.hasNextPage,
          hasPreviousPage: response.pagination.hasPrevPage,
          totalCount: response.pagination.total,
          totalPages: response.pagination.totalPages,
          currentPage: response.pagination.page
        }
      };
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error(`Failed to fetch posts for page ${page}:`, error);
      }
      return {
        posts: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          totalCount: 0,
          totalPages: 0,
          currentPage: page
        }
      };
    }
  }

  async getPostsForPage(page: number, postsPerPage: number = 20): Promise<BlogPost[]> {
    try {
      if (DEV_CONFIG.debugMode) {
        Logger.info(`Fetching posts for page ${page} using API pagination`);
      }
      
      const response = await apiClient.getPosts(page, postsPerPage);
      const transformedPosts = response.posts.map(post => {
        const cmsPost: CMSPost = {
          id: post.id,
          databaseId: parseInt(post.id.replace(/[^0-9]/g, '')) || 0,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          date: post.publishDate,
          featuredImage: post.featuredImage ? {
            node: { sourceUrl: post.featuredImage }
          } : undefined,
          fifuImageUrl: post.featuredImage,
          seo: {
            title: post.seo?.title || post.title,
            description: post.seo?.metaDescription || post.excerpt,
            focusKeywords: post.seo?.focusKeyword ? [post.seo.focusKeyword] : [],
            seoScore: { score: 0 },
            canonicalUrl: ''
          },
          author: {
            node: {
              id: post.authorId,
              name: 'Tugasin',
              slug: 'tugasin'
            }
          },
          categories: {
            nodes: post.categories || []
          },
          tags: {
            nodes: post.tags || []
          },
          content: post.content
        };
        return transformCMSPost(cmsPost);
      });
      
      if (DEV_CONFIG.debugMode) {
        Logger.info(`Returning ${transformedPosts.length} posts for page ${page}`);
      }
      
      return transformedPosts;
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error(`Failed to fetch posts for page ${page}:`, error);
      }
      return [];
    }
  }
  
  async getAllPostsForSitemap(): Promise<BlogPost[]> {
    try {
      const cacheKey = CacheKeys.SITEMAP_POSTS;
      const TTL_24_HOURS = 24 * 60 * 60 * 1000;
      
      const cachedData = cmsCache.get<BlogPost[]>(cacheKey);
      if (cachedData) {
        if (DEV_CONFIG.debugMode) {
          Logger.info(`Returning ${cachedData.length} cached posts for sitemap (instant)`);
        }
        return cachedData;
      }
      
      if (DEV_CONFIG.debugMode) {
        Logger.info(`Cache miss - Fetching ALL posts for sitemap in single request (no pagination)`);
      }
      
      const baseEndpoint = CMS_CONFIG.endpoint.replace(/\/graphql\/?$/, '');
      const url = `${baseEndpoint}/api/v1/posts`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CMS_TOKEN}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const apiResponse = await response.json();
      
      if (!apiResponse.success || !apiResponse.data) {
        throw new Error('Failed to fetch posts from API');
      }
      
      const posts = apiResponse.data.posts || apiResponse.data;
      
      const minimalPosts = posts.map((post: any) => {
        const category = cleanText(post.categories?.[0]?.name || 'Umum');
        
        return {
          id: parseInt(post.id.replace(/[^0-9]/g, '')) || 0,
          title: cleanText(post.title || ''),
          slug: post.slug,
          date: new Date(post.publishDate).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          category: category,
          excerpt: '',
          author: 'Admin',
          readTime: '1 menit',
          image: '',
          content: '',
          tags: [],
          seo: {
            title: '',
            description: '',
            focusKeywords: []
          }
        } as BlogPost;
      });
      
      if (DEV_CONFIG.debugMode) {
        Logger.info(`Fetched ${minimalPosts.length} posts for sitemap in SINGLE request - caching for 24 hours`);
      }
      
      cmsCache.set(cacheKey, minimalPosts, TTL_24_HOURS, ['sitemap']);
      
      return minimalPosts;
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('Failed to fetch posts for sitemap:', error);
      }
      return [];
    }
  }

  async getFeaturedPost(): Promise<BlogPost | null> {
    const posts = await this.getPosts(1, 1);
    return posts.length > 0 ? { ...posts[0], featured: true } : null;
  }

  async getRecentPosts(limit: number = 6): Promise<BlogPost[]> {
    return this.getPosts(limit, 1);
  }
  
  async getPostsByCategory(category: string, limit: number = 3): Promise<BlogPost[]> {
    try {
      const posts = await this.getPosts(50, 1);
      return posts.filter(post => post.category === category).slice(0, limit);
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('Failed to fetch posts by category:', error);
      }
      return [];
    }
  }

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const cachedPost = this.cachedPosts.find(post => post.slug === slug);
    const now = Date.now();
    const isCacheValid = (now - this.lastFetchTime) < this.cacheExpiry;
    
    if (cachedPost && isCacheValid) {
      if (DEV_CONFIG.debugMode) {
        Logger.info('Returning cached post for instant loading:', slug);
      }
      return cachedPost;
    }
    
    if (cachedPost && !isCacheValid) {
      if (DEV_CONFIG.debugMode) {
        Logger.info('Returning stale cached post and refreshing in background:', slug);
      }
      
      this.refreshPostInBackground(slug);
      return cachedPost;
    }

    try {
      if (DEV_CONFIG.debugMode) {
        Logger.info('No cache available, fetching post from API:', slug);
      }
      
      const cmsPromise = apiClient.getPostBySlug(slug);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API request timeout')), 5000)
      );
      
      const response = await Promise.race([cmsPromise, timeoutPromise]) as any;
      
      if (!response.post) {
        if (DEV_CONFIG.debugMode) {
          Logger.info('Post not found in API:', slug);
        }
        return null;
      }
      
      const post = transformCMSPost(response.post);
      
      const existingIndex = this.cachedPosts.findIndex(p => p.slug === slug);
      if (existingIndex >= 0) {
        this.cachedPosts[existingIndex] = post;
      } else {
        this.cachedPosts.push(post);
      }
      this.lastFetchTime = now;
      
      if (DEV_CONFIG.debugMode) {
        Logger.info('Successfully fetched and cached post from API:', post.title);
      }
      
      return post;
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('Failed to fetch post from API:', error);
      }
      
      if (cachedPost) {
        if (DEV_CONFIG.debugMode) {
          Logger.info('Returning stale cached post due to API failure:', slug);
        }
        return cachedPost;
      }
      
      return null;
    }
  }
  
  private async refreshPostInBackground(slug: string): Promise<void> {
    try {
      const response = await apiClient.getPostBySlug(slug);
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

  async getTotalPostCount(): Promise<number> {
    const now = Date.now();
    const isCountCacheValid = (now - this.lastCountFetchTime) < this.countCacheExpiry;

    if (this.cachedPostCount > 0 && isCountCacheValid) {
      if (DEV_CONFIG.debugMode) {
        Logger.info(`Returning cached post count: ${this.cachedPostCount}`);
      }
      return this.cachedPostCount;
    }

    const isCacheValid = (now - this.lastFetchTime) < this.cacheExpiry;
    if (this.cachedPosts.length > 0 && isCacheValid) {
      this.cachedPostCount = this.cachedPosts.length;
      this.lastCountFetchTime = now;
      if (DEV_CONFIG.debugMode) {
        Logger.info(`Using cached posts for count: ${this.cachedPostCount}`);
      }
      return this.cachedPostCount;
    }

    try {
      if (DEV_CONFIG.debugMode) {
        Logger.info('Fetching post count from API...');
      }

      const count = await apiClient.getTotalPostCount();
      this.cachedPostCount = count;
      this.lastCountFetchTime = now;

      if (DEV_CONFIG.debugMode) {
        Logger.info(`Successfully fetched post count from API: ${count}`);
      }

      return count;
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('Failed to fetch post count from API:', error);
      }

      if (this.cachedPostCount > 0) {
        if (DEV_CONFIG.debugMode) {
          Logger.info(`Returning stale cached count: ${this.cachedPostCount}`);
        }
        return this.cachedPostCount;
      }

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

    const posts = await this.getPosts(50, 1);
    
    if (posts.length === 0) {
      this.cachedCategories = [];
      return [];
    }

    const categoryMap = new Map<string, number>();

    posts.forEach((post: BlogPost) => {
      const count = categoryMap.get(post.category) || 0;
      categoryMap.set(post.category, count + 1);
    });

    const categoryIcons: Record<string, string> = {
      'Panduan Skripsi': 'BookOpen',
      'Tips Produktivitas': 'Target',
      'Metodologi': 'Lightbulb',
      'Academic Writing': 'TrendingUp',
      'Mental Health': 'User',
      'Presentasi': 'User',
    };

    this.cachedCategories = Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      count,
      icon: categoryIcons[name] || 'BookOpen'
    }));

    return this.cachedCategories;
  }

  clearCache(): void {
    this.cachedPosts = [];
    this.cachedCategories = [];
    this.cachedPostCount = 0;
    this.lastFetchTime = 0;
    this.lastCountFetchTime = 0;
    this.cmsAvailable = null;
    this.lastCMSCheck = 0;
  }

  getCMSStatus(): { available: boolean | null; lastChecked: number } {
    return {
      available: this.cmsAvailable,
      lastChecked: this.lastCMSCheck
    };
  }
}

export const blogService = new BlogService();
