import { PostRedirect, PostRedirectTargetPost, PostRedirectTargetURL } from './api-client';
import { apiClient } from './api-client';
import { DEV_CONFIG } from '@/lib/utils/constants';
import { Logger } from '@/lib/utils/logger';

export interface RedirectResult {
  shouldRedirect: boolean;
  redirectUrl?: string;
  httpStatus?: number;
  targetSlug?: string;
}

export class RedirectHandler {
  static async handlePostRedirect(
    redirect: PostRedirect | null,
    currentCategory: string
  ): Promise<RedirectResult> {
    if (!redirect) {
      return { shouldRedirect: false };
    }

    if (DEV_CONFIG.debugMode) {
      Logger.info('Processing redirect:', {
        type: redirect.type,
        httpStatus: redirect.httpStatus,
        notes: redirect.notes
      });
    }

    if (redirect.type === 'url') {
      const urlTarget = redirect.target as PostRedirectTargetURL;
      return {
        shouldRedirect: true,
        redirectUrl: urlTarget.url,
        httpStatus: redirect.httpStatus
      };
    }

    if (redirect.type === 'post') {
      const postTarget = redirect.target as PostRedirectTargetPost;
      
      try {
        const targetPost = await apiClient.getPostById(postTarget.postId);
        
        if (!targetPost || !targetPost.post) {
          if (DEV_CONFIG.debugMode) {
            Logger.warn('Target post not found for redirect, using fallback category:', postTarget.postId);
          }
          const redirectUrl = `/blog/${currentCategory}/${postTarget.slug}`;
          
          if (DEV_CONFIG.debugMode) {
            Logger.info('Redirect to post (fallback):', {
              targetSlug: postTarget.slug,
              fallbackCategory: currentCategory,
              redirectUrl
            });
          }

          return {
            shouldRedirect: true,
            redirectUrl,
            httpStatus: redirect.httpStatus,
            targetSlug: postTarget.slug
          };
        }

        const targetCategory = targetPost.post.categories.nodes[0]?.slug || currentCategory;
        const redirectUrl = `/blog/${targetCategory}/${postTarget.slug}`;

        if (DEV_CONFIG.debugMode) {
          Logger.info('Redirect to post:', {
            targetSlug: postTarget.slug,
            targetCategory,
            redirectUrl
          });
        }

        return {
          shouldRedirect: true,
          redirectUrl,
          httpStatus: redirect.httpStatus,
          targetSlug: postTarget.slug
        };
      } catch (error) {
        if (DEV_CONFIG.debugMode) {
          Logger.warn('Error fetching target post for redirect, using fallback:', error);
        }
        const redirectUrl = `/blog/${currentCategory}/${postTarget.slug}`;
        
        return {
          shouldRedirect: true,
          redirectUrl,
          httpStatus: redirect.httpStatus,
          targetSlug: postTarget.slug
        };
      }
    }

    return { shouldRedirect: false };
  }

  static isPermanentRedirect(httpStatus: number): boolean {
    return httpStatus === 301 || httpStatus === 308;
  }

  static isTemporaryRedirect(httpStatus: number): boolean {
    return httpStatus === 302 || httpStatus === 307;
  }

  static getRedirectStatusText(httpStatus: number): string {
    switch (httpStatus) {
      case 301:
        return 'Moved Permanently';
      case 302:
        return 'Found (Temporary)';
      case 307:
        return 'Temporary Redirect';
      case 308:
        return 'Permanent Redirect';
      case 410:
        return 'Gone';
      default:
        return 'Redirect';
    }
  }
}

export const redirectHandler = RedirectHandler;
