import { DEV_CONFIG, CMS_CONFIG } from '@/lib/utils/constants';
import { Logger } from '@/lib/utils/logger';

// GraphQL client for CMS integration
export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: string[];
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

class GraphQLClient {
  private endpoint = CMS_CONFIG.endpoint;

  constructor() {
    if (DEV_CONFIG.debugMode) {
      Logger.info('GraphQL client initialized without authentication');
    }
  }

  async query<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
    if (!DEV_CONFIG.enableCMS) {
      throw new Error('CMS is disabled in configuration');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEV_CONFIG.cmsTimeout);

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GraphQLResponse<T> = await response.json();

      if (data.errors && data.errors.length > 0) {
        if (DEV_CONFIG.debugMode) {
          Logger.error('GraphQL query errors:', data.errors);
        }
        // Decode HTML entities in error message
        const errorMessage = data.errors[0].message
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/<[^>]*>/g, ''); // Remove HTML tags
        throw new Error(`GraphQL query failed: ${errorMessage}`);
      }

      if (!data.data) {
        throw new Error('No data returned from GraphQL query');
      }

      return data.data;
    } catch (error) {
      if (DEV_CONFIG.debugMode) {
        Logger.error('GraphQL query error:', error);
      }
      throw error;
    }
  }

  async getAllPosts(first: number = 10, after?: string): Promise<PostsResponse> {
    const query = `
      query GetAllPostsWithSEO($first: Int!, $after: String) {
        posts(first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            databaseId
            title
            slug
            excerpt
            date
            featuredImage {
              node {
                sourceUrl
              }
            }
            fifuImageUrl
            seo {
              title
              description
              focusKeywords
              seoScore {
                score
              }
              canonicalUrl
            }
            author {
              node {
                id
                name
                slug
              }
            }
            categories {
              nodes {
                id
                name
                slug
              }
            }
            tags {
              nodes {
                id
                name
                slug
              }
            }
            content
          }
        }
      }
    `;

    return this.query<PostsResponse>(query, { first, after });
  }

  async getPostBySlug(slug: string): Promise<PostResponse> {
    const query = `
      query GetPostBySlug($slug: ID!) {
        post(id: $slug, idType: SLUG) {
          id
          databaseId
          title
          slug
          excerpt
          date
          featuredImage {
            node {
              sourceUrl
            }
          }
          fifuImageUrl
          seo {
            title
            description
            focusKeywords
            seoScore {
              score
            }
            canonicalUrl
          }
          author {
            node {
              id
              name
              slug
            }
          }
          categories {
            nodes {
              id
              name
              slug
            }
          }
          tags {
            nodes {
              id
              name
              slug
            }
          }
          content
        }
      }
    `;

    return this.query<PostResponse>(query, { slug });
  }

  // Optimized query to get total post count without fetching full content
  async getTotalPostCount(): Promise<number> {
    const query = `
      query GetPostCount {
        posts(first: 1000) {
          nodes {
            id
          }
        }
      }
    `;

    try {
      const response = await this.query<PostCountResponse>(query);
      return response.posts.nodes.length;
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
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for availability check

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: '{ __typename }' // Simple introspection query
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const graphqlClient = new GraphQLClient();