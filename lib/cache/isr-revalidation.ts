/**
 * ISR Revalidation Logic
 * Provides intelligent revalidation strategies for different content types
 */

import { NextRequest } from 'next/server';
import { blogService } from '@/lib/cms/blog-service';
import { Logger } from '@/lib/utils/logger';
import { DEV_CONFIG } from '@/lib/utils/constants';
import { cmsMonitor, CMSHealthStats } from './cms-monitor';

// Revalidation intervals for different content types (in seconds)
export const REVALIDATION_INTERVALS = {
  // Static pages - long cache times
  HOMEPAGE: parseInt(process.env.REVALIDATION_HOMEPAGE_INTERVAL || '3600'),        // Default 1 hour
  SERVICES: 3600,        // 1 hour - service pages are fairly static
  CONTACT: 86400,        // 24 hours - contact page rarely changes
  
  // Dynamic content - shorter cache times
  BLOG_LISTING: parseInt(process.env.REVALIDATION_BLOG_LISTING_INTERVAL || '300'), // Default 5 minutes
  BLOG_POST: parseInt(process.env.REVALIDATION_BLOG_POST_INTERVAL || '300'),       // Default 5 minutes
  BLOG_CATEGORIES: 1800, // 30 minutes - categories change less frequently
  
  // CMS-dependent content
  CMS_STATUS: 120,       // 2 minutes - CMS status needs frequent checks
  SITEMAP: 3600,         // 1 hour - sitemaps need periodic updates
} as const;

// Content freshness priorities
export enum ContentPriority {
  CRITICAL = 'critical',     // Must be fresh (CMS status, breaking news)
  HIGH = 'high',            // Should be fresh (blog posts, listings)
  MEDIUM = 'medium',        // Can be slightly stale (categories, services)
  LOW = 'low'               // Can be stale (static pages, contact info)
}

// Map content types to priorities
export const CONTENT_PRIORITIES = {
  'blog-post': ContentPriority.HIGH,
  'blog-listing': ContentPriority.HIGH,
  'blog-categories': ContentPriority.MEDIUM,
  'homepage': ContentPriority.MEDIUM,
  'services': ContentPriority.MEDIUM,
  'contact': ContentPriority.LOW,
  'cms-status': ContentPriority.CRITICAL,
  'sitemap': ContentPriority.LOW,
} as const;

// Enhanced revalidation configuration
export interface RevalidationConfig {
  interval: number;
  priority: ContentPriority;
  enableOnDemand: boolean;
  enableBackgroundRefresh: boolean;
  conditions?: {
    cmsRequired?: boolean;
    timeWindow?: { start: number; end: number }; // Hours of day
    maxStaleTime?: number; // Maximum time before forced refresh
  };
}

// Comprehensive revalidation configurations
export const REVALIDATION_CONFIGS: Record<string, RevalidationConfig> = {
  'homepage': {
    interval: REVALIDATION_INTERVALS.HOMEPAGE,
    priority: ContentPriority.MEDIUM,
    enableOnDemand: true,
    enableBackgroundRefresh: true,
    conditions: {
      cmsRequired: false,
      maxStaleTime: REVALIDATION_INTERVALS.HOMEPAGE * 2
    }
  },
  
  'services': {
    interval: REVALIDATION_INTERVALS.SERVICES,
    priority: ContentPriority.MEDIUM,
    enableOnDemand: true,
    enableBackgroundRefresh: false,
    conditions: {
      cmsRequired: false,
      maxStaleTime: REVALIDATION_INTERVALS.SERVICES * 3
    }
  },
  
  'blog-listing': {
    interval: REVALIDATION_INTERVALS.BLOG_LISTING,
    priority: ContentPriority.HIGH,
    enableOnDemand: true,
    enableBackgroundRefresh: true,
    conditions: {
      cmsRequired: true,
      timeWindow: { start: 6, end: 22 }, // Active hours for faster updates
      maxStaleTime: REVALIDATION_INTERVALS.BLOG_LISTING * 3
    }
  },
  
  'blog-post': {
    interval: REVALIDATION_INTERVALS.BLOG_POST,
    priority: ContentPriority.HIGH,
    enableOnDemand: true,
    enableBackgroundRefresh: true,
    conditions: {
      cmsRequired: true,
      maxStaleTime: REVALIDATION_INTERVALS.BLOG_POST * 4
    }
  },
  
  'cms-status': {
    interval: REVALIDATION_INTERVALS.CMS_STATUS,
    priority: ContentPriority.CRITICAL,
    enableOnDemand: true,
    enableBackgroundRefresh: true,
    conditions: {
      cmsRequired: false,
      maxStaleTime: REVALIDATION_INTERVALS.CMS_STATUS * 2
    }
  }
};

/**
 * Smart revalidation decision maker
 */
export class ISRRevalidationManager {
  private lastRevalidation = new Map<string, number>();
  private revalidationAttempts = new Map<string, number>();
  
  /**
   * Determine if content should be revalidated based on multiple factors
   * Now includes advanced CMS health monitoring
   */
  shouldRevalidate(
    contentType: string, 
    lastModified?: number,
    requestContext?: {
      userAgent?: string;
      isBot?: boolean;
      priority?: ContentPriority;
    }
  ): boolean {
    const config = REVALIDATION_CONFIGS[contentType];
    if (!config) {
      // Default to medium priority content if no config found
      return this.shouldRevalidateDefault(contentType);
    }

    const now = Date.now();
    const lastRevalidated = this.lastRevalidation.get(contentType) || 0;
    const timeSinceLastRevalidation = now - lastRevalidated;
    const intervalMs = config.interval * 1000;

    // Check basic interval
    if (timeSinceLastRevalidation < intervalMs) {
      return false;
    }

    // Enhanced CMS health checking
    if (config.conditions?.cmsRequired) {
      const cmsHealthStats = cmsMonitor.getHealthStats();
      const cmsRecommendations = cmsMonitor.getRevalidationRecommendations();
      
      // Don't revalidate if CMS monitoring recommends against it
      if (!cmsRecommendations.shouldRevalidateCMSContent) {
        const maxStaleMs = (config.conditions?.maxStaleTime || config.interval * 3) * 1000;
        
        // Only force revalidation if content is extremely stale
        if (timeSinceLastRevalidation > maxStaleMs) {
          if (DEV_CONFIG.debugMode) {
            Logger.info(`Forcing revalidation of ${contentType} due to max stale time despite CMS issues`);
          }
          return true;
        }
        
        if (DEV_CONFIG.debugMode) {
          Logger.info(`Skipping revalidation of ${contentType}: ${cmsRecommendations.reason}`);
        }
        return false;
      }
      
      // Adapt interval based on CMS health
      const adaptedIntervalMs = cmsRecommendations.recommendedInterval * 1000;
      if (timeSinceLastRevalidation < adaptedIntervalMs) {
        if (DEV_CONFIG.debugMode) {
          Logger.info(`Adapting revalidation interval for ${contentType} based on CMS health`);
        }
        return false;
      }
      
      // Additional checks for degraded CMS performance
      if (cmsHealthStats.currentStatus === 'degraded') {
        // Be more conservative with degraded CMS
        const conservativeIntervalMs = intervalMs * 1.5;
        if (timeSinceLastRevalidation < conservativeIntervalMs) {
          return false;
        }
      }
    }

    // Check time window conditions
    if (config.conditions?.timeWindow) {
      const currentHour = new Date().getHours();
      const { start, end } = config.conditions.timeWindow;
      const inActiveWindow = currentHour >= start && currentHour <= end;
      
      if (!inActiveWindow && config.priority !== ContentPriority.CRITICAL) {
        // Outside active window - use longer intervals for non-critical content
        return timeSinceLastRevalidation > (intervalMs * 2);
      }
    }

    // Priority-based decisions with CMS awareness
    switch (config.priority) {
      case ContentPriority.CRITICAL:
        // Critical content should always revalidate when interval is reached
        // but consider CMS maintenance windows
        if (config.conditions?.cmsRequired && cmsMonitor.isInMaintenanceWindow()) {
          return timeSinceLastRevalidation > (intervalMs * 2); // Double interval during maintenance
        }
        return true;
        
      case ContentPriority.HIGH:
        // Revalidate high priority content more aggressively
        // but be gentle during CMS issues
        if (config.conditions?.cmsRequired) {
          const cmsHealthStats = cmsMonitor.getHealthStats();
          if (cmsHealthStats.currentStatus === 'degraded') {
            return timeSinceLastRevalidation > intervalMs; // Normal interval during degraded performance
          }
        }
        return timeSinceLastRevalidation > (intervalMs * 0.8);
        
      case ContentPriority.MEDIUM:
        // Standard revalidation for medium priority
        return timeSinceLastRevalidation > intervalMs;
        
      case ContentPriority.LOW:
        // Be more conservative with low priority content
        return timeSinceLastRevalidation > (intervalMs * 1.5);
        
      default:
        return timeSinceLastRevalidation > intervalMs;
    }
  }

  /**
   * Default revalidation logic for unknown content types
   */
  private shouldRevalidateDefault(contentType: string): boolean {
    const now = Date.now();
    const lastRevalidated = this.lastRevalidation.get(contentType) || 0;
    const defaultInterval = 1800 * 1000; // 30 minutes default
    
    return (now - lastRevalidated) > defaultInterval;
  }

  /**
   * Mark content as revalidated with enhanced logging
   */
  markRevalidated(contentType: string): void {
    const now = Date.now();
    const previousTime = this.lastRevalidation.get(contentType);
    this.lastRevalidation.set(contentType, now);
    
    if (DEV_CONFIG.debugMode) {
      const timeSinceLast = previousTime ? now - previousTime : 0;
      const cmsHealthStats = cmsMonitor.getHealthStats();
      
      Logger.info(`Content revalidated: ${contentType}`, {
        timeSinceLastRevalidation: timeSinceLast,
        cmsStatus: cmsHealthStats.currentStatus,
        cmsUptime: cmsHealthStats.uptime
      });
    }
  }

  /**
   * Get comprehensive revalidation statistics for monitoring
   * Now includes CMS health data
   */
  getRevalidationStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    const cmsHealthStats = cmsMonitor.getHealthStats();
    const cmsRecommendations = cmsMonitor.getRevalidationRecommendations();
    
    for (const [contentType, lastTime] of this.lastRevalidation.entries()) {
      const config = REVALIDATION_CONFIGS[contentType];
      const timeSinceLastRevalidation = Date.now() - lastTime;
      
      stats[contentType] = {
        lastRevalidated: new Date(lastTime).toISOString(),
        intervalSeconds: config?.interval || 'unknown',
        priority: config?.priority || 'unknown',
        shouldRevalidateNow: this.shouldRevalidate(contentType),
        timeSinceLastRevalidationMs: timeSinceLastRevalidation,
        cmsRequired: config?.conditions?.cmsRequired || false,
        adaptedInterval: config?.conditions?.cmsRequired ? cmsRecommendations.recommendedInterval : config?.interval
      };
    }
    
    // Add CMS health information
    stats._cmsHealth = {
      status: cmsHealthStats.currentStatus,
      uptime: cmsHealthStats.uptime,
      averageResponseTime: cmsHealthStats.averageResponseTime,
      lastCheck: new Date(cmsHealthStats.lastCheck).toISOString(),
      recommendations: cmsRecommendations,
      isMonitoring: cmsMonitor.isActivelyMonitoring()
    };
    
    return stats;
  }

  /**
   * Force revalidation of specific content type
   */
  forceRevalidate(contentType: string): void {
    this.lastRevalidation.delete(contentType);
    
    if (DEV_CONFIG.debugMode) {
      Logger.info(`Forced revalidation cleared for: ${contentType}`);
    }
  }

  /**
   * Clear all revalidation history
   */
  clearRevalidationHistory(): void {
    this.lastRevalidation.clear();
    this.revalidationAttempts.clear();
    
    if (DEV_CONFIG.debugMode) {
      Logger.info('All revalidation history cleared');
    }
  }
}

// Singleton instance
export const isrRevalidationManager = new ISRRevalidationManager();

/**
 * Enhanced utility function to get appropriate revalidation value for page types
 * Now integrates with ISRRevalidationManager for intelligent decision making
 */
export function getRevalidationForPageType(
  pageType: string, 
  context?: {
    cmsAvailable?: boolean;
    isHighPriority?: boolean;
    requestContext?: {
      userAgent?: string;
      isBot?: boolean;
    };
  }
): number {
  const config = REVALIDATION_CONFIGS[pageType];
  if (!config) {
    return REVALIDATION_INTERVALS.HOMEPAGE;
  }

  let baseInterval = config.interval;

  // Apply CMS-aware adjustments
  if (config.conditions?.cmsRequired && context?.cmsAvailable === false) {
    // If CMS is required but unavailable, use longer intervals to reduce load
    baseInterval = Math.max(baseInterval * 2, config.conditions.maxStaleTime || baseInterval * 3);
    
    if (DEV_CONFIG.debugMode) {
      Logger.info(`CMS unavailable for ${pageType}, extending interval to ${baseInterval}s`);
    }
  }

  // Apply priority-based adjustments
  switch (config.priority) {
    case ContentPriority.CRITICAL:
      // Critical content gets shorter intervals for faster updates
      baseInterval = Math.max(baseInterval * 0.5, 60); // Minimum 1 minute
      break;
      
    case ContentPriority.HIGH:
      // High priority content gets slightly shorter intervals
      if (context?.isHighPriority) {
        baseInterval = Math.max(baseInterval * 0.8, 120); // Minimum 2 minutes
      }
      break;
      
    case ContentPriority.LOW:
      // Low priority content can have longer intervals
      baseInterval = baseInterval * 1.5;
      break;
  }

  // Apply time window considerations
  if (config.conditions?.timeWindow) {
    const currentHour = new Date().getHours();
    const { start, end } = config.conditions.timeWindow;
    const inActiveWindow = currentHour >= start && currentHour <= end;
    
    if (!inActiveWindow && config.priority !== ContentPriority.CRITICAL) {
      // Outside active hours, use longer intervals
      baseInterval = baseInterval * 2;
      
      if (DEV_CONFIG.debugMode) {
        Logger.info(`Outside active window for ${pageType}, extending interval to ${baseInterval}s`);
      }
    }
  }

  // Apply bot-specific logic
  if (context?.requestContext?.isBot && config.priority !== ContentPriority.CRITICAL) {
    // For bots, we can use longer intervals for non-critical content
    baseInterval = baseInterval * 1.2;
  }

  // Ensure reasonable bounds
  const minInterval = config.priority === ContentPriority.CRITICAL ? 60 : 120;
  const maxInterval = 86400; // 24 hours max
  
  baseInterval = Math.max(minInterval, Math.min(maxInterval, baseInterval));

  if (DEV_CONFIG.debugMode) {
    Logger.info(`Smart revalidation for ${pageType}: ${baseInterval}s (priority: ${config.priority})`);
  }

  return Math.floor(baseInterval);
}

/**
 * Get revalidation value with CMS status awareness
 * This is a convenience function that checks CMS status automatically
 */
export async function getSmartRevalidationForPageType(
  pageType: string,
  requestContext?: {
    userAgent?: string;
    isBot?: boolean;
    isHighPriority?: boolean;
  }
): Promise<number> {
  // Check CMS availability
  const cmsStatus = blogService.getCMSStatus();
  const cmsAvailable = cmsStatus.available;
  
  // If CMS status is unknown, do a quick check for critical content
  let finalCmsStatus = cmsAvailable;
  if (cmsAvailable === null) {
    const config = REVALIDATION_CONFIGS[pageType];
    if (config?.conditions?.cmsRequired && config.priority === ContentPriority.CRITICAL) {
      try {
        finalCmsStatus = await blogService.checkCMSAvailability();
      } catch {
        finalCmsStatus = false;
      }
    }
  }

  return getRevalidationForPageType(pageType, {
    cmsAvailable: finalCmsStatus || false,
    isHighPriority: requestContext?.isHighPriority,
    requestContext
  });
}

/**
 * Helper function to validate revalidation request
 */
export function validateRevalidationRequest(
  request: NextRequest,
  expectedSecret?: string
): { valid: boolean; error?: string } {
  // Check for revalidation secret if provided
  if (expectedSecret) {
    const secret = request.nextUrl.searchParams.get('secret');
    if (secret !== expectedSecret) {
      return { valid: false, error: 'Invalid revalidation secret' };
    }
  }

  // Validate request method
  if (request.method !== 'POST' && request.method !== 'GET') {
    return { valid: false, error: 'Invalid request method' };
  }

  return { valid: true };
}

/**
 * Background revalidation scheduler
 * Triggers revalidation for content that should be refreshed in the background
 */
export function scheduleBackgroundRevalidation(contentType: string): void {
  const config = REVALIDATION_CONFIGS[contentType];
  
  if (!config?.enableBackgroundRefresh) {
    return;
  }

  // Check if background revalidation is needed
  const shouldRevalidate = isrRevalidationManager.shouldRevalidate(contentType);
  
  if (shouldRevalidate) {
    // In a production environment, this could trigger a webhook or cron job
    // For now, we'll use the browser's setTimeout for demonstration
    if (typeof window !== 'undefined') {
      setTimeout(async () => {
        try {
          const response = await fetch('/api/revalidate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              contentType,
              forced: false 
            })
          });
          
          if (response.ok && DEV_CONFIG.debugMode) {
            Logger.info(`Background revalidation completed for: ${contentType}`);
          }
        } catch (error) {
          if (DEV_CONFIG.debugMode) {
            Logger.error(`Background revalidation failed for ${contentType}:`, error);
          }
        }
      }, 5000); // 5 second delay to avoid blocking
    }
  }

  if (DEV_CONFIG.debugMode) {
    Logger.info(`Background revalidation ${shouldRevalidate ? 'scheduled' : 'skipped'} for: ${contentType}`);
  }
}

/**
 * Determine if a page should use on-demand revalidation instead of time-based
 * This helps identify when pages should be revalidated immediately vs waiting for interval
 */
export function shouldUseOnDemandRevalidation(
  contentType: string,
  context?: {
    hasRecentChanges?: boolean;
    userTriggered?: boolean;
    cmsEvent?: boolean;
  }
): boolean {
  const config = REVALIDATION_CONFIGS[contentType];
  
  if (!config?.enableOnDemand) {
    return false;
  }

  // Always use on-demand for user-triggered actions
  if (context?.userTriggered) {
    return true;
  }

  // Use on-demand for CMS events on CMS-dependent content
  if (context?.cmsEvent && config.conditions?.cmsRequired) {
    return true;
  }

  // Use on-demand for critical content with recent changes
  if (config.priority === ContentPriority.CRITICAL && context?.hasRecentChanges) {
    return true;
  }

  // For high-priority content, check if the normal interval suggests revalidation
  if (config.priority === ContentPriority.HIGH) {
    return isrRevalidationManager.shouldRevalidate(contentType);
  }

  return false;
}

/**
 * Create a revalidation strategy for a specific page/content type
 * This provides a comprehensive revalidation plan
 */
export function createRevalidationStrategy(contentType: string): {
  baseInterval: number;
  useOnDemand: boolean;
  enableBackground: boolean;
  priority: ContentPriority;
  cmsRequired: boolean;
  conditions: string[];
} {
  const config = REVALIDATION_CONFIGS[contentType] || {
    interval: REVALIDATION_INTERVALS.HOMEPAGE,
    priority: ContentPriority.MEDIUM,
    enableOnDemand: false,
    enableBackgroundRefresh: false
  };

  const conditions: string[] = [];
  
  if (config.conditions?.cmsRequired) {
    conditions.push('CMS availability required');
  }
  
  if (config.conditions?.timeWindow) {
    const { start, end } = config.conditions.timeWindow;
    conditions.push(`Active hours: ${start}:00-${end}:00`);
  }
  
  if (config.conditions?.maxStaleTime) {
    conditions.push(`Max stale time: ${config.conditions.maxStaleTime}s`);
  }

  return {
    baseInterval: config.interval,
    useOnDemand: config.enableOnDemand,
    enableBackground: config.enableBackgroundRefresh,
    priority: config.priority,
    cmsRequired: config.conditions?.cmsRequired || false,
    conditions
  };
}