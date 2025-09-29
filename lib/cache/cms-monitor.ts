/**
 * CMS Monitoring Service
 * Tracks CMS health, outages, and recovery patterns for intelligent ISR decisions
 */

import { Logger } from '@/lib/utils/logger';
import { DEV_CONFIG } from '@/lib/utils/constants';
import { blogService } from '@/lib/cms/blog-service';

export interface CMSHealthCheck {
  timestamp: number;
  available: boolean;
  responseTime?: number;
  error?: string;
  recoveryTime?: number; // Time taken to recover from an outage
}

export interface CMSOutage {
  startTime: number;
  endTime?: number;
  duration?: number;
  cause?: string;
  recovered: boolean;
}

export interface CMSHealthStats {
  uptime: number; // Percentage uptime over last 24 hours
  averageResponseTime: number;
  outages: CMSOutage[];
  lastCheck: number;
  currentStatus: 'healthy' | 'degraded' | 'down' | 'recovering';
  predictedNextCheck: number;
}

/**
 * CMS Monitoring Service
 * Provides intelligent monitoring and health tracking for the CMS
 */
export class CMSMonitoringService {
  private healthChecks: CMSHealthCheck[] = [];
  private outages: CMSOutage[] = [];
  private maxHistorySize = 100; // Keep last 100 health checks
  private checkInterval = 2 * 60 * 1000; // 2 minutes default
  private lastCheckTime = 0;
  private currentOutage: CMSOutage | null = null;
  private isMonitoring = false;

  constructor() {
    // Start monitoring if in development mode
    if (DEV_CONFIG.debugMode) {
      this.startMonitoring();
    }
  }

  /**
   * Perform a comprehensive CMS health check
   */
  async performHealthCheck(): Promise<CMSHealthCheck> {
    const startTime = Date.now();
    
    try {
      // Use the existing blog service to check CMS availability
      const isAvailable = await blogService.checkCMSAvailability();
      const responseTime = Date.now() - startTime;

      const healthCheck: CMSHealthCheck = {
        timestamp: startTime,
        available: isAvailable,
        responseTime,
      };

      // Handle outage tracking
      if (!isAvailable && !this.currentOutage) {
        // Start of new outage
        this.currentOutage = {
          startTime,
          recovered: false,
          cause: 'CMS unavailable'
        };
        
        if (DEV_CONFIG.debugMode) {
          Logger.error('CMS outage detected');
        }
      } else if (isAvailable && this.currentOutage) {
        // Recovery from outage
        this.currentOutage.endTime = startTime;
        this.currentOutage.duration = startTime - this.currentOutage.startTime;
        this.currentOutage.recovered = true;
        
        healthCheck.recoveryTime = this.currentOutage.duration;
        
        this.outages.push({ ...this.currentOutage });
        this.currentOutage = null;
        
        if (DEV_CONFIG.debugMode) {
          Logger.info(`CMS recovered after ${healthCheck.recoveryTime}ms`);
        }
      }

      this.addHealthCheck(healthCheck);
      return healthCheck;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const healthCheck: CMSHealthCheck = {
        timestamp: startTime,
        available: false,
        responseTime,
        error: errorMessage
      };

      // Handle outage tracking for errors
      if (!this.currentOutage) {
        this.currentOutage = {
          startTime,
          recovered: false,
          cause: errorMessage
        };
      }

      this.addHealthCheck(healthCheck);
      
      if (DEV_CONFIG.debugMode) {
        Logger.error('CMS health check failed:', error);
      }
      
      return healthCheck;
    }
  }

  /**
   * Add a health check to the history
   */
  private addHealthCheck(healthCheck: CMSHealthCheck): void {
    this.healthChecks.push(healthCheck);
    this.lastCheckTime = healthCheck.timestamp;
    
    // Keep only the most recent checks
    if (this.healthChecks.length > this.maxHistorySize) {
      this.healthChecks = this.healthChecks.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get comprehensive CMS health statistics
   */
  getHealthStats(): CMSHealthStats {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    
    // Filter checks from last 24 hours
    const recentChecks = this.healthChecks.filter(check => check.timestamp > last24Hours);
    
    if (recentChecks.length === 0) {
      return {
        uptime: 0,
        averageResponseTime: 0,
        outages: [],
        lastCheck: this.lastCheckTime,
        currentStatus: 'down',
        predictedNextCheck: now + this.checkInterval
      };
    }

    // Calculate uptime percentage
    const availableChecks = recentChecks.filter(check => check.available);
    const uptime = (availableChecks.length / recentChecks.length) * 100;

    // Calculate average response time
    const responseTimes = recentChecks
      .filter(check => check.responseTime !== undefined)
      .map(check => check.responseTime!);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    // Get recent outages
    const recentOutages = this.outages.filter(outage => outage.startTime > last24Hours);

    // Determine current status
    let currentStatus: CMSHealthStats['currentStatus'] = 'healthy';
    const latestCheck = recentChecks[recentChecks.length - 1];
    
    if (!latestCheck.available) {
      currentStatus = 'down';
    } else if (this.currentOutage && latestCheck.recoveryTime) {
      currentStatus = 'recovering';
    } else if (uptime < 95) {
      currentStatus = 'degraded';
    }

    // Calculate next check time directly without calling getNextCheckTime to avoid circular dependency
    const adaptiveInterval = this.getAdaptiveCheckIntervalDirect(currentStatus);
    const predictedNextCheck = this.lastCheckTime + adaptiveInterval;

    return {
      uptime,
      averageResponseTime,
      outages: recentOutages,
      lastCheck: this.lastCheckTime,
      currentStatus,
      predictedNextCheck
    };
  }

  /**
   * Get adaptive check interval based on CMS health
   */
  getAdaptiveCheckInterval(): number {
    const stats = this.getHealthStats();
    return this.getAdaptiveCheckIntervalDirect(stats.currentStatus);
  }

  /**
   * Get adaptive check interval based on status directly (no circular dependency)
   */
  private getAdaptiveCheckIntervalDirect(currentStatus: CMSHealthStats['currentStatus']): number {
    // More frequent checks during outages or degraded performance
    if (currentStatus === 'down' || currentStatus === 'recovering') {
      return 30 * 1000; // 30 seconds during issues
    }
    
    if (currentStatus === 'degraded') {
      return 60 * 1000; // 1 minute for degraded performance
    }
    
    // Normal interval for healthy CMS
    return this.checkInterval;
  }

  /**
   * Predict when the next check should happen
   */
  private getNextCheckTime(): number {
    return this.lastCheckTime + this.getAdaptiveCheckInterval();
  }

  /**
   * Determine if CMS is in a maintenance window or expected downtime
   */
  isInMaintenanceWindow(): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Assume maintenance typically happens early morning (2-4 AM local time)
    return currentHour >= 2 && currentHour <= 4;
  }

  /**
   * Get revalidation recommendations based on CMS health
   */
  getRevalidationRecommendations(): {
    shouldRevalidateCMSContent: boolean;
    recommendedInterval: number;
    reason: string;
  } {
    const stats = this.getHealthStats();
    
    if (stats.currentStatus === 'down') {
      return {
        shouldRevalidateCMSContent: false,
        recommendedInterval: 300, // 5 minutes - wait for recovery
        reason: 'CMS is down, avoid revalidation to reduce load'
      };
    }
    
    if (stats.currentStatus === 'recovering') {
      return {
        shouldRevalidateCMSContent: false,
        recommendedInterval: 180, // 3 minutes - give time to stabilize
        reason: 'CMS is recovering, allow stabilization time'
      };
    }
    
    if (stats.currentStatus === 'degraded') {
      return {
        shouldRevalidateCMSContent: true,
        recommendedInterval: 600, // 10 minutes - slower revalidation
        reason: 'CMS performance is degraded, use longer intervals'
      };
    }
    
    if (this.isInMaintenanceWindow()) {
      return {
        shouldRevalidateCMSContent: false,
        recommendedInterval: 900, // 15 minutes during maintenance
        reason: 'Likely maintenance window, reduce revalidation frequency'
      };
    }
    
    // Healthy CMS
    return {
      shouldRevalidateCMSContent: true,
      recommendedInterval: 300, // 5 minutes - normal revalidation
      reason: 'CMS is healthy, normal revalidation intervals'
    };
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }
    
    this.isMonitoring = true;
    
    const scheduleNextCheck = () => {
      const interval = this.getAdaptiveCheckInterval();
      setTimeout(async () => {
        if (this.isMonitoring) {
          await this.performHealthCheck();
          scheduleNextCheck();
        }
      }, interval);
    };
    
    // Perform initial check
    this.performHealthCheck().then(() => {
      scheduleNextCheck();
    });
    
    if (DEV_CONFIG.debugMode) {
      Logger.info('CMS monitoring started');
    }
  }

  /**
   * Stop continuous monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    
    if (DEV_CONFIG.debugMode) {
      Logger.info('CMS monitoring stopped');
    }
  }

  /**
   * Get current monitoring status
   */
  isActivelyMonitoring(): boolean {
    return this.isMonitoring;
  }

  /**
   * Force a CMS health check and return immediate status
   */
  async getImmediateCMSStatus(): Promise<{
    available: boolean;
    responseTime: number;
    recommendations: ReturnType<CMSMonitoringService['getRevalidationRecommendations']>;
  }> {
    const healthCheck = await this.performHealthCheck();
    const recommendations = this.getRevalidationRecommendations();
    
    return {
      available: healthCheck.available,
      responseTime: healthCheck.responseTime || 0,
      recommendations
    };
  }
}

// Singleton instance
export const cmsMonitor = new CMSMonitoringService();