import { DEV_CONFIG, CMS_CONFIG } from '@/lib/utils/constants';
import { Logger } from '@/lib/utils/logger';

export interface PostRedirectTargetPost {
  postId: string;
  slug: string;
  title: string;
}

export interface PostRedirectTargetURL {
  url: string;
}

export interface PostRedirect {
  type: 'post' | 'url';
  httpStatus: 301 | 302 | 307 | 308 | 410;
  target: PostRedirectTargetPost | PostRedirectTargetURL;
  notes?: string;
}

export interface APIPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  featuredImage: string;
  publishDate: string;
  status: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  seo: {
    title: string;
    metaDescription: string;
    focusKeyword: string;
    slug: string;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
  }>;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  redirect: PostRedirect | null;
}

export interface APIPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface APIPostsResponse {
  success: boolean;
  data: {
    posts: APIPost[];
    pagination: APIPagination;
  };
  cached?: boolean;
}

export interface APISinglePostResponse {
  success: boolean;
  data?: APIPost;
  cached?: boolean;
  error?: string;
  redirect?: PostRedirect;
}

export interface CMSPost {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
    };
  };
  fifuImageUrl?: string;
  seo: {
    title: string;
    description: string;
    focusKeywords: string[];
    seoScore: {
      score: number;
    };
    canonicalUrl: string;
  };
  author: {
    node: {
      id: string;
      name: string;
      slug: string;
    };
  };
  categories: {
    nodes: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
  };
  tags: {
    nodes: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
  };
  content: string;
  redirect: PostRedirect | null;
}

export interface PostsResponse {
  posts: APIPost[];
  pagination: APIPagination;
}

export interface PostResponse {
  post: CMSPost;
}

class APIClient {
  private baseEndpoint: string;
  private token: string | undefined;

  constructor() {
    this.baseEndpoint = CMS_CONFIG.endpoint.replace(/\/graphql\/?$/, '');
    this.token = process.env.CMS_TOKEN;
    
    if (DEV_CONFIG.debugMode) {
      Logger.info('API client initialized with endpoint:', this.baseEndpoint);
      Logger.info('CMS token configured:', this.token ? 'Yes' : 'No');
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private transformAPIPostToCMSPost(apiPost: APIPost): CMSPost {
    return {
      id: apiPost.id,
      databaseId: parseInt(apiPost.id.replace(/[^0-9]/g, '')) || 0,
      title: apiPost.title,
      slug: apiPost.slug,
      excerpt: apiPost.excerpt,
      date: apiPost.publishDate,
      featuredImage: apiPost.featuredImage ? {
        node: {
          sourceUrl: apiPost.featuredImage
        }
      } : undefined,
      fifuImageUrl: apiPost.featuredImage,
      seo: {
        title: apiPost.seo?.title || apiPost.title,
        description: apiPost.seo?.metaDescription || apiPost.excerpt,
        focusKeywords: apiPost.seo?.focusKeyword ? [apiPost.seo.focusKeyword] : [],
        seoScore: { score: 0 },
        canonicalUrl: ''
      },
      author: {
        node: {
          id: apiPost.authorId,
          name: 'Admin',
          slug: 'admin'
        }
      },
      categories: {
        nodes: apiPost.categories || []
      },
      tags: {
        nodes: apiPost.tags || []
      },
      content: apiPost.content,
      redirect: apiPost.redirect || null
    };
  }

  async getPosts(page: number = 1, limit: number = 20, category?: string): Promise<PostsResponse> {
    if (!DEV_CONFIG.enableCMS) {
      throw new Error('CMS is disabled in configuration');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEV_CONFIG.cmsTimeout);

      let url = `${this.baseEndpoint}/api/v1/posts?page=${page}&limit=${limit}`;
      if (category) {
        url += `&category=${encodeURIComponent(category)}`;
      }
      
      if (DEV_CONFIG.debugMode) {
        Logger.info(`Fetching posts from API v1: page=${page}, limit=${limit}${category ? `, category=${category}` : ''}`);
        Logger.info('URL:', url);
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: APIPostsResponse = await response.json();

      if (!apiResponse.success || !apiResponse.data) {
        throw new Error('Failed to fetch posts from API');
      }

      if (DEV_CONFIG.debugMode) {
        Logger.info(`Fetched ${apiResponse.data.posts.length} posts (page ${apiResponse.data.pagination.page} of ${apiResponse.data.pagination.totalPages})`);
        Logger.info('Cached:', apiResponse.cached || false);
      }

      return {
        posts: apiResponse.data.posts,
        pagination: apiResponse.data.pagination
      };
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('API error:', error);
      }
      throw error;
    }
  }

  async getPostBySlug(slug: string): Promise<PostResponse> {
    if (!DEV_CONFIG.enableCMS) {
      throw new Error('CMS is disabled in configuration');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEV_CONFIG.cmsTimeout);

      const url = `${this.baseEndpoint}/api/v1/posts/${slug}`;
      
      if (DEV_CONFIG.debugMode) {
        Logger.info('Fetching post by slug:', slug);
        Logger.info('URL:', url);
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: APISinglePostResponse = await response.json();

      if (!apiResponse.success) {
        if (DEV_CONFIG.debugMode) {
          Logger.warn('Post fetch unsuccessful:', apiResponse.error);
          if (apiResponse.redirect) {
            Logger.info('Tombstone redirect found:', apiResponse.redirect);
          }
        }
        throw new Error(apiResponse.error || 'Failed to fetch post from API');
      }

      if (!apiResponse.data) {
        throw new Error('No post data in response');
      }

      const cmsPost = this.transformAPIPostToCMSPost(apiResponse.data);

      if (DEV_CONFIG.debugMode) {
        Logger.info('Found post:', cmsPost.title);
        Logger.info('Cached:', apiResponse.cached || false);
      }

      return {
        post: cmsPost
      };
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('API error:', error);
      }
      throw error;
    }
  }

  async getRawPostBySlug(slug: string): Promise<APISinglePostResponse> {
    if (!DEV_CONFIG.enableCMS) {
      throw new Error('CMS is disabled in configuration');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEV_CONFIG.cmsTimeout);

      const url = `${this.baseEndpoint}/api/v1/posts/${slug}`;
      
      if (DEV_CONFIG.debugMode) {
        Logger.info('Fetching raw post response by slug:', slug);
        Logger.info('URL:', url);
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // For 404, return a proper error response instead of throwing
        // This allows the page component to handle it gracefully
        if (response.status === 404) {
          if (DEV_CONFIG.debugMode) {
            Logger.warn(`Post not found (404): ${slug}`);
          }
          return {
            success: false,
            error: 'Post not found'
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: APISinglePostResponse = await response.json();

      if (DEV_CONFIG.debugMode) {
        Logger.info('Raw API response:', {
          success: apiResponse.success,
          hasData: !!apiResponse.data,
          hasRedirect: !!apiResponse.redirect,
          error: apiResponse.error
        });
      }

      return apiResponse;
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('API error:', error);
      }
      throw error;
    }
  }

  async getPostById(id: string): Promise<PostResponse> {
    if (!DEV_CONFIG.enableCMS) {
      throw new Error('CMS is disabled in configuration');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEV_CONFIG.cmsTimeout);

      const url = `${this.baseEndpoint}/api/v1/posts/${id}`;
      
      if (DEV_CONFIG.debugMode) {
        Logger.info('Fetching post by ID from:', url);
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: APISinglePostResponse = await response.json();

      if (!apiResponse.success || !apiResponse.data) {
        throw new Error('Failed to fetch post from API');
      }

      const cmsPost = this.transformAPIPostToCMSPost(apiResponse.data);

      if (DEV_CONFIG.debugMode) {
        Logger.info('Fetched post:', cmsPost.title);
      }

      return {
        post: cmsPost
      };
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('API error:', error);
      }
      throw error;
    }
  }

  async getTotalPostCount(): Promise<number> {
    try {
      const url = `${this.baseEndpoint}/api/v1/posts?page=1&limit=1`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: APIPostsResponse = await response.json();

      if (!apiResponse.success || !apiResponse.data) {
        return 0;
      }

      return apiResponse.data.pagination.total;
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('Failed to get post count:', error);
      }
      return 0;
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!DEV_CONFIG.enableCMS) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const url = `${this.baseEndpoint}/api/v1/posts?page=1&limit=1`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const apiClient = new APIClient();
