import { DEV_CONFIG, CMS_CONFIG } from '@/lib/utils/constants';
import { Logger } from '@/lib/utils/logger';

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
  data: APIPost;
  cached?: boolean;
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
      content: apiPost.content
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

      if (!apiResponse.success || !apiResponse.data) {
        throw new Error('Failed to fetch post from API');
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
