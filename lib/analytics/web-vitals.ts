/**
 * Core Web Vitals and Performance Monitoring
 * Real-time measurement of LCP, FID, CLS, TTFB, and other performance metrics
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import analytics from './config';

// Performance thresholds based on Core Web Vitals guidelines
export const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },      // Largest Contentful Paint
  INP: { good: 200, poor: 500 },        // Interaction to Next Paint  
  CLS: { good: 0.1, poor: 0.25 },       // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 },      // First Contentful Paint
  TTFB: { good: 800, poor: 1800 },      // Time to First Byte
};


interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id: string;
  attribution?: Record<string, any>;
}

interface PerformanceReport {
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType?: string;
  metrics: PerformanceMetric[];
  resourceTiming: PerformanceResourceTiming[];
  navigationTiming: PerformanceNavigationTiming | null;
}

/**
 * Determine performance rating based on thresholds
 */
function getPerformanceRating(metricName: keyof typeof PERFORMANCE_THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = PERFORMANCE_THRESHOLDS[metricName];
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Send performance metric to analytics
 */
function sendToAnalytics(metric: PerformanceMetric): void {
  // Send to Analytics
  analytics.track('web_vitals', {
    category: 'performance',
    label: metric.name,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    metric_rating: metric.rating,
    metric_id: metric.id,
    metric_value: metric.value,
    metric_delta: metric.delta,
    page_path: window.location.pathname,
    ...metric.attribution,
  });

  // Send to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Web Vital:', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      attribution: metric.attribution,
    });
  }
}

/**
 * Get connection information
 */
function getConnectionInfo(): { effectiveType?: string; downlink?: number; rtt?: number } {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (connection) {
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
    };
  }
  
  return {};
}

/**
 * Get resource timing information
 */
function getResourceTiming(): PerformanceResourceTiming[] {
  return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
}

/**
 * Get navigation timing information
 */
function getNavigationTiming(): PerformanceNavigationTiming | null {
  const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  return navEntries.length > 0 ? navEntries[0] : null;
}

/**
 * Generate comprehensive performance report
 */
async function generatePerformanceReport(): Promise<PerformanceReport> {
  const metrics: PerformanceMetric[] = [];

  // Collect all Web Vitals
  await Promise.all([
    new Promise<void>((resolve) => {
      onCLS((metric) => {
        metrics.push({
          name: 'CLS',
          value: metric.value,
          rating: getPerformanceRating('CLS', metric.value),
          delta: metric.delta,
          id: metric.id,
          attribution: (metric as any).attribution,
        });
        resolve();
      });
    }),
    new Promise<void>((resolve) => {
      onLCP((metric) => {
        metrics.push({
          name: 'LCP',
          value: metric.value,
          rating: getPerformanceRating('LCP', metric.value),
          delta: metric.delta,
          id: metric.id,
          attribution: (metric as any).attribution,
        });
        resolve();
      });
    }),
    new Promise<void>((resolve) => {
      onINP((metric) => {
        metrics.push({
          name: 'INP',
          value: metric.value,
          rating: getPerformanceRating('INP', metric.value),
          delta: metric.delta,
          id: metric.id,
          attribution: (metric as any).attribution,
        });
        resolve();
      });
    }),
    new Promise<void>((resolve) => {
      onFCP((metric) => {
        metrics.push({
          name: 'FCP',
          value: metric.value,
          rating: getPerformanceRating('FCP', metric.value),
          delta: metric.delta,
          id: metric.id,
        });
        resolve();
      });
    }),
    new Promise<void>((resolve) => {
      onTTFB((metric) => {
        metrics.push({
          name: 'TTFB',
          value: metric.value,
          rating: getPerformanceRating('TTFB', metric.value),
          delta: metric.delta,
          id: metric.id,
          attribution: (metric as any).attribution,
        });
        resolve();
      });
    }),
  ]);

  const connectionInfo = getConnectionInfo();
  
  return {
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    connectionType: connectionInfo.effectiveType,
    metrics,
    resourceTiming: getResourceTiming(),
    navigationTiming: getNavigationTiming(),
  };
}

/**
 * Initialize Core Web Vitals monitoring
 */
export function initializeWebVitals(): void {
  if (typeof window === 'undefined') return;

  // Monitor Core Web Vitals with real-time reporting
  onCLS(sendToAnalytics);
  onFCP(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);

  // Monitor additional performance metrics
  if ('PerformanceObserver' in window) {
    // Long Tasks API for monitoring main thread blocking
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            analytics.track('long_task', {
              category: 'performance',
              label: 'main_thread_blocking',
              value: Math.round(entry.duration),
              task_duration: entry.duration,
              task_start: entry.startTime,
            });
          }
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      console.warn('Long Task API not supported');
    }

    // Largest Contentful Paint Observer for detailed attribution
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const lcpEntries = list.getEntries();
        if (lcpEntries.length > 0) {
          const lastEntry = lcpEntries[lcpEntries.length - 1] as any;
          
          analytics.track('lcp_element', {
            category: 'performance',
            label: lastEntry.element?.tagName || 'unknown',
            value: Math.round(lastEntry.startTime),
            element_id: lastEntry.element?.id,
            element_class: lastEntry.element?.className,
            element_url: lastEntry.url,
            element_size: lastEntry.size,
          });
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('LCP Observer not supported');
    }
  }

  // Generate comprehensive report after page load
  window.addEventListener('load', async () => {
    setTimeout(async () => {
      try {
        const report = await generatePerformanceReport();
        
        // Send aggregated performance report
        analytics.track('performance_report', {
          category: 'performance',
          label: 'page_load_complete',
          metrics_count: report.metrics.length,
          good_metrics: report.metrics.filter(m => m.rating === 'good').length,
          poor_metrics: report.metrics.filter(m => m.rating === 'poor').length,
          connection_type: report.connectionType,
          total_resources: report.resourceTiming.length,
        });

        if (process.env.NODE_ENV === 'development') {
          console.log('📊 Performance Report Generated:', report);
        }
      } catch (error) {
        console.error('Failed to generate performance report:', error);
      }
    }, 2000); // Wait 2 seconds after load for metrics to stabilize
  });

  console.log('📊 Web Vitals monitoring initialized');
}

/**
 * Manual performance measurement for specific operations
 */
export function measurePerformance<T>(
  name: string,
  operation: () => T | Promise<T>
): Promise<T> {
  const startTime = performance.now();
  
  return Promise.resolve(operation()).then((result) => {
    const duration = performance.now() - startTime;
    
    analytics.track('custom_timing', {
      category: 'performance',
      label: name,
      value: Math.round(duration),
      operation_name: name,
      duration_ms: duration,
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  });
}

/**
 * Monitor resource loading performance
 */
export function monitorResourceLoading(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  const resourceObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      const resource = entry as PerformanceResourceTiming;
      
      // Only track critical resources
      if (resource.initiatorType === 'script' || 
          resource.initiatorType === 'stylesheet' ||
          resource.initiatorType === 'img') {
        
        const loadTime = resource.responseEnd - resource.startTime;
        
        if (loadTime > 1000) { // Resources taking longer than 1 second
          analytics.track('slow_resource', {
            category: 'performance',
            label: resource.initiatorType,
            value: Math.round(loadTime),
            resource_name: resource.name,
            resource_type: resource.initiatorType,
            load_time: loadTime,
            transfer_size: resource.transferSize,
          });
        }
      }
    });
  });

  resourceObserver.observe({ entryTypes: ['resource'] });
}