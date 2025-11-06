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
    console.log('[REDIRECT-HANDLER] handlePostRedirect called', {
      hasRedirect: !!redirect,
      currentCategory,
      redirectType: redirect?.type
    });

    if (!redirect) {
      console.log('[REDIRECT-HANDLER] No redirect data, returning shouldRedirect=false');
      return { shouldRedirect: false };
    }

    console.log('[REDIRECT-HANDLER] Processing redirect:', {
      type: redirect.type,
      httpStatus: redirect.httpStatus,
      notes: redirect.notes,
      target: redirect.target
    });

    if (DEV_CONFIG.debugMode) {
      Logger.info('Processing redirect:', {
        type: redirect.type,
        httpStatus: redirect.httpStatus,
        notes: redirect.notes
      });
    }

    if (redirect.type === 'url') {
      const urlTarget = redirect.target as PostRedirectTargetURL;
      console.log('[REDIRECT-HANDLER] URL redirect:', urlTarget.url);
      return {
        shouldRedirect: true,
        redirectUrl: urlTarget.url,
        httpStatus: redirect.httpStatus
      };
    }

    if (redirect.type === 'post') {
      const postTarget = redirect.target as PostRedirectTargetPost;
      console.log('[REDIRECT-HANDLER] Post redirect, fetching target post:', postTarget.postId);
      
      try {
        const targetPost = await apiClient.getPostById(postTarget.postId);
        console.log('[REDIRECT-HANDLER] Target post fetched:', {
          hasPost: !!targetPost,
          hasPostData: !!targetPost?.post,
          postTitle: targetPost?.post?.title
        });
        
        if (!targetPost || !targetPost.post) {
          console.log('[REDIRECT-HANDLER] Target post not found, using fallback category');
          if (DEV_CONFIG.debugMode) {
            Logger.warn('Target post not found for redirect, using fallback category:', postTarget.postId);
          }
          const redirectUrl = `/blog/${currentCategory}/${postTarget.slug}`;
          console.log('[REDIRECT-HANDLER] Fallback redirect URL:', redirectUrl);
          
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
        
        console.log('[REDIRECT-HANDLER] Building redirect URL:', {
          targetSlug: postTarget.slug,
          targetCategory,
          redirectUrl,
          httpStatus: redirect.httpStatus
        });

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
        console.log('[REDIRECT-HANDLER] Error fetching target post, using fallback:', error);
        if (DEV_CONFIG.debugMode) {
          Logger.warn('Error fetching target post for redirect, using fallback:', error);
        }
        const redirectUrl = `/blog/${currentCategory}/${postTarget.slug}`;
        console.log('[REDIRECT-HANDLER] Error fallback redirect URL:', redirectUrl);
        
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
