import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { 
  isrRevalidationManager,
  validateRevalidationRequest,
  REVALIDATION_CONFIGS
} from '@/lib/cache/isr-revalidation';
import { cmsMonitor } from '@/lib/cache/cms-monitor';
import { blogService } from '@/lib/cms/blog-service';
import { Logger } from '@/lib/utils/logger';
import { DEV_CONFIG } from '@/lib/utils/constants';

export const dynamic = 'force-dynamic';

interface RevalidationRequest {
  contentType?: string;
  path?: string;
  tag?: string;
  forced?: boolean;
  secret?: string;
}

/**
 * On-demand revalidation API endpoint
 * Supports intelligent revalidation using ISRRevalidationManager
 */
export async function POST(request: NextRequest) {
  try {
    // Validate the revalidation request with optional secret
    const revalidationSecret = process.env.REVALIDATION_SECRET;
    const validation = validateRevalidationRequest(request, revalidationSecret);
    
    if (!validation.valid) {
      if (DEV_CONFIG.debugMode) {
        Logger.error(`Revalidation request validation failed: ${validation.error}`);
      }
      return NextResponse.json(
        { error: validation.error },
        { status: 401 }
      );
    }

    let requestBody: RevalidationRequest = {};
    
    // Try to parse request body if it exists
    try {
      const body = await request.text();
      if (body) {
        requestBody = JSON.parse(body);
      }
    } catch (error) {
      // Fall back to URL search params if JSON parsing fails
      const url = new URL(request.url);
      requestBody = {
        contentType: url.searchParams.get('contentType') || undefined,
        path: url.searchParams.get('path') || undefined,
        tag: url.searchParams.get('tag') || undefined,
        forced: url.searchParams.get('forced') === 'true',
        secret: url.searchParams.get('secret') || undefined,
      };
    }

    const { contentType, path, tag, forced = false } = requestBody;

    if (DEV_CONFIG.debugMode) {
      Logger.info('Revalidation request received:', { contentType, path, tag, forced });
    }

    // Get comprehensive CMS health information
    const cmsStatus = blogService.getCMSStatus();
    const cmsHealthStats = cmsMonitor.getHealthStats();
    const cmsRecommendations = cmsMonitor.getRevalidationRecommendations();
    
    if (DEV_CONFIG.debugMode) {
      Logger.info('CMS Status:', {
        basicStatus: cmsStatus,
        healthStats: cmsHealthStats,
        recommendations: cmsRecommendations
      });
    }

    const results: Array<{ type: string; success: boolean; message: string }> = [];

    // Handle specific content type revalidation
    if (contentType) {
      const config = REVALIDATION_CONFIGS[contentType];
      
      if (!config) {
        return NextResponse.json(
          { error: `Unknown content type: ${contentType}` },
          { status: 400 }
        );
      }

      // Check if revalidation should occur using the smart manager
      const shouldRevalidate = forced || isrRevalidationManager.shouldRevalidate(
        contentType,
        undefined, // lastModified - could be enhanced with actual modification time
        {
          priority: config.priority,
          isBot: request.headers.get('user-agent')?.includes('bot') || false
        }
      );

      if (!shouldRevalidate) {
        if (DEV_CONFIG.debugMode) {
          Logger.info(`Revalidation skipped for ${contentType} - not yet time to revalidate`);
        }
        return NextResponse.json({
          message: `Revalidation not needed for ${contentType}`,
          shouldRevalidate: false,
          nextRevalidationTime: new Date(Date.now() + (config.interval * 1000)).toISOString()
        });
      }

      // Check CMS dependency
      if (config.conditions?.cmsRequired && !cmsStatus.available) {
        const maxStaleMs = (config.conditions.maxStaleTime || config.interval * 3) * 1000;
        const timeSinceLastCheck = Date.now() - cmsStatus.lastChecked;
        
        if (timeSinceLastCheck < maxStaleMs) {
          if (DEV_CONFIG.debugMode) {
            Logger.info(`Revalidation skipped for ${contentType} - CMS unavailable and not max stale time yet`);
          }
          return NextResponse.json({
            message: `CMS unavailable for ${contentType} - waiting for max stale time`,
            cmsAvailable: false,
            waitTime: maxStaleMs - timeSinceLastCheck
          });
        }
      }

      // Perform the revalidation based on content type
      try {
        switch (contentType) {
          case 'homepage':
            await revalidatePath('/');
            results.push({ type: 'path', success: true, message: 'Homepage revalidated' });
            break;

          case 'services':
            await revalidatePath('/layanan');
            results.push({ type: 'path', success: true, message: 'Services page revalidated' });
            break;

          case 'contact':
            await revalidatePath('/contact');
            results.push({ type: 'path', success: true, message: 'Contact page revalidated' });
            break;

          case 'blog-listing':
            await revalidatePath('/blog');
            await revalidateTag('blog-posts');
            results.push({ type: 'path', success: true, message: 'Blog listing revalidated' });
            break;

          case 'blog-post':
            // Revalidate all blog post routes
            await revalidatePath('/blog/[...params]');
            await revalidateTag('blog-post');
            results.push({ type: 'path', success: true, message: 'Blog posts revalidated' });
            break;

          case 'cms-status':
            // Clear CMS cache and force status check
            blogService.clearCache();
            await blogService.checkCMSAvailability();
            results.push({ type: 'cache', success: true, message: 'CMS status refreshed' });
            break;

          case 'sitemap':
            await revalidatePath('/sitemap.xml');
            await revalidatePath('/sitemap-pages.xml');
            await revalidatePath('/sitemap-post.xml');
            await revalidateTag('sitemap');
            results.push({ type: 'path', success: true, message: 'Sitemaps revalidated' });
            break;

          default:
            throw new Error(`Unsupported content type: ${contentType}`);
        }

        // Mark as revalidated in the manager
        isrRevalidationManager.markRevalidated(contentType);
        
        if (DEV_CONFIG.debugMode) {
          Logger.info(`Successfully revalidated ${contentType}`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ 
          type: 'error', 
          success: false, 
          message: `Failed to revalidate ${contentType}: ${errorMessage}` 
        });
        
        if (DEV_CONFIG.debugMode) {
          Logger.error(`Failed to revalidate ${contentType}:`, error);
        }
      }
    }

    // Handle specific path revalidation
    if (path) {
      try {
        await revalidatePath(path);
        results.push({ type: 'path', success: true, message: `Path ${path} revalidated` });
        
        if (DEV_CONFIG.debugMode) {
          Logger.info(`Successfully revalidated path: ${path}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ 
          type: 'error', 
          success: false, 
          message: `Failed to revalidate path ${path}: ${errorMessage}` 
        });
        
        if (DEV_CONFIG.debugMode) {
          Logger.error(`Failed to revalidate path ${path}:`, error);
        }
      }
    }

    // Handle tag revalidation
    if (tag) {
      try {
        await revalidateTag(tag);
        results.push({ type: 'tag', success: true, message: `Tag ${tag} revalidated` });
        
        if (DEV_CONFIG.debugMode) {
          Logger.info(`Successfully revalidated tag: ${tag}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ 
          type: 'error', 
          success: false, 
          message: `Failed to revalidate tag ${tag}: ${errorMessage}` 
        });
        
        if (DEV_CONFIG.debugMode) {
          Logger.error(`Failed to revalidate tag ${tag}:`, error);
        }
      }
    }

    // If no specific action was requested, return available content types
    if (!contentType && !path && !tag) {
      const availableContentTypes = Object.keys(REVALIDATION_CONFIGS);
      const revalidationStats = isrRevalidationManager.getRevalidationStats();
      
      return NextResponse.json({
        message: 'Revalidation API is available',
        availableContentTypes,
        revalidationStats,
        cmsStatus,
        usage: {
          contentType: 'Revalidate specific content type (homepage, blog-listing, etc.)',
          path: 'Revalidate specific path (/blog, /layanan, etc.)',
          tag: 'Revalidate by cache tag (blog-posts, sitemap, etc.)',
          forced: 'Force revalidation even if not needed (true/false)'
        }
      });
    }

    // Return results
    const hasErrors = results.some(r => !r.success);
    const statusCode = hasErrors ? 207 : 200; // 207 Multi-Status for partial success

    return NextResponse.json({
      message: 'Revalidation completed',
      results,
      timestamp: new Date().toISOString(),
      cmsStatus
    }, { status: statusCode });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (DEV_CONFIG.debugMode) {
      Logger.error('Revalidation API error:', error);
    }

    return NextResponse.json(
      { error: `Revalidation failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * GET handler for checking revalidation status and available options
 */
export async function GET(request: NextRequest) {
  try {
    // Validate the request with optional secret
    const revalidationSecret = process.env.REVALIDATION_SECRET;
    const validation = validateRevalidationRequest(request, revalidationSecret);
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 401 }
      );
    }

    const availableContentTypes = Object.keys(REVALIDATION_CONFIGS);
    const revalidationStats = isrRevalidationManager.getRevalidationStats();
    const cmsStatus = blogService.getCMSStatus();

    // Check which content types should be revalidated now
    const revalidationNeeded = Object.fromEntries(
      availableContentTypes.map(contentType => [
        contentType,
        isrRevalidationManager.shouldRevalidate(contentType)
      ])
    );

    return NextResponse.json({
      message: 'Revalidation API status',
      availableContentTypes,
      revalidationStats,
      revalidationNeeded,
      cmsStatus,
      timestamp: new Date().toISOString(),
      documentation: {
        endpoints: {
          'POST /api/revalidate': 'Trigger revalidation',
          'GET /api/revalidate': 'Check revalidation status'
        },
        parameters: {
          contentType: 'Specific content type to revalidate',
          path: 'Specific path to revalidate',
          tag: 'Cache tag to revalidate',
          forced: 'Force revalidation regardless of timing',
          secret: 'Revalidation secret (if configured)'
        },
        examples: {
          'Revalidate blog posts': 'POST /api/revalidate with {"contentType": "blog-post"}',
          'Force homepage revalidation': 'POST /api/revalidate with {"contentType": "homepage", "forced": true}',
          'Revalidate specific path': 'POST /api/revalidate with {"path": "/blog"}',
          'Revalidate by tag': 'POST /api/revalidate with {"tag": "blog-posts"}'
        }
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (DEV_CONFIG.debugMode) {
      Logger.error('Revalidation API status error:', error);
    }

    return NextResponse.json(
      { error: `Failed to get revalidation status: ${errorMessage}` },
      { status: 500 }
    );
  }
}