import { DEV_CONFIG, CMS_CONFIG } from '@/lib/utils/constants';
import { Logger } from '@/lib/utils/logger';

// REST API Response types
export interface RESTResponse<T = any> {
  success: boolean;
  data: T;
}

export interface RESTPost {
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
    slug: string;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    created_at: string;
    description: string | null;
  }>;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
    created_at: string;
  }>;
}

export interface PostsResponse {
  posts: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string;
    };
    nodes: CMSPost[];
  };
}

export interface PostResponse {
  post: CMSPost;
}

export interface PostCountResponse {
  posts: {
    nodes: Array<{
      id: string;
    }>;
  };
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

class RESTClient {
  private baseEndpoint: string;
  private token: string | undefined;

  constructor() {
    // Extract base URL from CMS endpoint (remove /graphql if present)
    this.baseEndpoint = CMS_CONFIG.endpoint.replace(/\/graphql\/?$/, '');
    // Get CMS token from environment
    this.token = process.env.CMS_TOKEN;
    
    if (DEV_CONFIG.debugMode) {
      Logger.info('REST client initialized with endpoint:', this.baseEndpoint);
      Logger.info('CMS token configured:', this.token ? 'Yes' : 'No');
    }
  }

  // Get headers with authentication
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Transform REST post to CMSPost format for backward compatibility
  private transformRESTPostToCMSPost(restPost: RESTPost): CMSPost {
    return {
      id: restPost.id,
      databaseId: parseInt(restPost.id.replace(/[^0-9]/g, '')) || 0,
      title: restPost.title,
      slug: restPost.slug,
      excerpt: restPost.excerpt,
      date: restPost.publishDate,
      featuredImage: restPost.featuredImage ? {
        node: {
          sourceUrl: restPost.featuredImage
        }
      } : undefined,
      fifuImageUrl: restPost.featuredImage,
      seo: {
        title: restPost.seo?.slug || restPost.title,
        description: restPost.excerpt,
        focusKeywords: [],
        seoScore: { score: 0 },
        canonicalUrl: ''
      },
      author: {
        node: {
          id: restPost.authorId,
          name: 'Admin',
          slug: 'admin'
        }
      },
      categories: {
        nodes: restPost.categories || []
      },
      tags: {
        nodes: restPost.tags || []
      },
      content: restPost.content
    };
  }

  async getAllPosts(first: number = 10, after?: string): Promise<PostsResponse> {
    if (!DEV_CONFIG.enableCMS) {
      throw new Error('CMS is disabled in configuration');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEV_CONFIG.cmsTimeout);

      const url = `${this.baseEndpoint}/api/public/posts`;
      
      if (DEV_CONFIG.debugMode) {
        Logger.info('Fetching all posts from:', url);
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

      const restResponse: RESTResponse<RESTPost[]> = await response.json();

      if (!restResponse.success || !restResponse.data) {
        throw new Error('Failed to fetch posts from REST API');
      }

      // Transform REST posts to CMSPost format
      const cmsNodes = restResponse.data.map(restPost => this.transformRESTPostToCMSPost(restPost));

      // For pagination, we'll simulate it based on the 'first' parameter
      // since the REST API returns all posts
      const startIndex = after ? parseInt(after) : 0;
      const endIndex = startIndex + first;
      const paginatedNodes = cmsNodes.slice(startIndex, endIndex);
      const hasNextPage = endIndex < cmsNodes.length;

      if (DEV_CONFIG.debugMode) {
        Logger.info(`Fetched ${paginatedNodes.length} posts (total: ${cmsNodes.length})`);
      }

      return {
        posts: {
          pageInfo: {
            hasNextPage,
            endCursor: hasNextPage ? endIndex.toString() : ''
          },
          nodes: paginatedNodes
        }
      };
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('REST API error:', error);
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

      // First, get all posts to find the one with matching slug
      const allPostsUrl = `${this.baseEndpoint}/api/public/posts`;
      
      if (DEV_CONFIG.debugMode) {
        Logger.info('Fetching post by slug:', slug);
      }

      const response = await fetch(allPostsUrl, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const restResponse: RESTResponse<RESTPost[]> = await response.json();

      if (!restResponse.success || !restResponse.data) {
        throw new Error('Failed to fetch posts from REST API');
      }

      // Find post by slug
      const restPost = restResponse.data.find(post => post.slug === slug);

      if (!restPost) {
        throw new Error(`Post not found with slug: ${slug}`);
      }

      const cmsPost = this.transformRESTPostToCMSPost(restPost);

      if (DEV_CONFIG.debugMode) {
        Logger.info('Found post:', cmsPost.title);
      }

      return {
        post: cmsPost
      };
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('REST API error:', error);
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

      const url = `${this.baseEndpoint}/api/public/posts/${id}`;
      
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

      const restResponse: RESTResponse<RESTPost> = await response.json();

      if (!restResponse.success || !restResponse.data) {
        throw new Error('Failed to fetch post from REST API');
      }

      const cmsPost = this.transformRESTPostToCMSPost(restResponse.data);

      if (DEV_CONFIG.debugMode) {
        Logger.info('Fetched post:', cmsPost.title);
      }

      return {
        post: cmsPost
      };
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('REST API error:', error);
      }
      throw error;
    }
  }

  // Optimized query to get total post count
  async getTotalPostCount(): Promise<number> {
    try {
      const url = `${this.baseEndpoint}/api/public/posts`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const restResponse: RESTResponse<RESTPost[]> = await response.json();

      if (!restResponse.success || !restResponse.data) {
        return 0;
      }

      return restResponse.data.length;
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('Failed to get post count:', error);
      }
      return 0;
    }
  }

  // Check if CMS is available
  async isAvailable(): Promise<boolean> {
    if (!DEV_CONFIG.enableCMS) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const url = `${this.baseEndpoint}/api/public/posts`;

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

// Export as graphqlClient for backward compatibility
export const graphqlClient = new RESTClient();
