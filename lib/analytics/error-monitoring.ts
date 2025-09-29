/**
 * Comprehensive Error Monitoring and Reporting System
 * Client-side and server-side error tracking with aggregation and notifications
 */

import * as Sentry from '@sentry/nextjs';
import { trackEvent } from './gtag';

// Error configuration
export const ERROR_CONFIG = {
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  enableConsoleCapture: process.env.NODE_ENV === 'development',
  enablePerformanceMonitoring: true,
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  maxBreadcrumbs: 50,
};

// Error categories and severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  JAVASCRIPT = 'javascript',
  NETWORK = 'network',
  PROMISE = 'promise',
  RESOURCE = 'resource',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  USER_INTERACTION = 'user_interaction',
  API = 'api',
  RENDER = 'render',
}

interface ErrorReport {
  id: string;
  timestamp: number;
  message: string;
  stack?: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
  breadcrumbs: ErrorBreadcrumb[];
  context: Record<string, any>;
  fingerprint?: string;
}

interface ErrorBreadcrumb {
  timestamp: number;
  message: string;
  category: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

interface NetworkErrorDetails {
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  responseTime?: number;
}

class ErrorMonitor {
  private breadcrumbs: ErrorBreadcrumb[] = [];
  private sessionId: string;
  private errorCount = 0;
  private errorThrottle = new Map<string, number>();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeErrorHandlers();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize all error handlers
   */
  private initializeErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleJavaScriptError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.handlePromiseRejection(event.reason);
    });

    // Resource loading error handler
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        this.handleResourceError(event.target as HTMLElement);
      }
    }, true);

    // Network request monitoring
    this.monitorNetworkRequests();

    // Console error interception
    if (ERROR_CONFIG.enableConsoleCapture) {
      this.interceptConsoleErrors();
    }
  }

  /**
   * Handle JavaScript runtime errors
   */
  private handleJavaScriptError(error: Error, context: Record<string, any> = {}): void {
    if (this.shouldThrottleError(error.message)) return;

    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      category: ErrorCategory.JAVASCRIPT,
      severity: this.classifyErrorSeverity(error),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
      breadcrumbs: [...this.breadcrumbs],
      context: {
        ...context,
        errorCount: ++this.errorCount,
        componentStack: this.getReactComponentStack(),
      },
      fingerprint: this.generateErrorFingerprint(error),
    };

    this.reportError(errorReport);
  }

  /**
   * Handle unhandled promise rejections
   */
  private handlePromiseRejection(reason: any): void {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      message: error.message || 'Unhandled Promise Rejection',
      stack: error.stack,
      category: ErrorCategory.PROMISE,
      severity: ErrorSeverity.HIGH,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
      breadcrumbs: [...this.breadcrumbs],
      context: {
        promiseReason: reason,
        errorCount: ++this.errorCount,
      },
      fingerprint: this.generateErrorFingerprint(error),
    };

    this.reportError(errorReport);
  }

  /**
   * Handle resource loading errors
   */
  private handleResourceError(element: HTMLElement): void {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      message: `Failed to load resource: ${this.getResourceUrl(element)}`,
      category: ErrorCategory.RESOURCE,
      severity: ErrorSeverity.MEDIUM,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
      breadcrumbs: [...this.breadcrumbs],
      context: {
        resourceType: element.tagName.toLowerCase(),
        resourceUrl: this.getResourceUrl(element),
        resourceId: element.id,
        resourceClass: element.className,
      },
    };

    this.reportError(errorReport);
  }

  /**
   * Monitor network requests for errors
   */
  private monitorNetworkRequests(): void {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const startTime = Date.now();
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method || 'GET';

      try {
        const response = await originalFetch(input, init);
        const responseTime = Date.now() - startTime;

        // Log slow requests
        if (responseTime > 5000) {
          this.addBreadcrumb({
            timestamp: Date.now(),
            message: `Slow network request: ${method} ${url}`,
            category: 'network',
            level: 'warning',
            data: { responseTime, status: response.status },
          });
        }

        // Handle HTTP error responses
        if (!response.ok) {
          this.handleNetworkError({
            url,
            method,
            status: response.status,
            statusText: response.statusText,
            responseTime,
          });
        }

        return response;
      } catch (error) {
        this.handleNetworkError({
          url,
          method,
          responseTime: Date.now() - startTime,
        });
        throw error;
      }
    };

    // Intercept XMLHttpRequest
    const originalXHR = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null) {
      const startTime = Date.now();
      
      this.addEventListener('error', () => {
        errorMonitor.handleNetworkError({
          url: url.toString(),
          method,
          responseTime: Date.now() - startTime,
        });
      });

      this.addEventListener('load', () => {
        const responseTime = Date.now() - startTime;
        if (this.status >= 400) {
          errorMonitor.handleNetworkError({
            url: url.toString(),
            method,
            status: this.status,
            statusText: this.statusText,
            responseTime,
          });
        }
      });

      return originalXHR.call(this, method, url, async ?? true, username, password);
    };
  }

  /**
   * Handle network-related errors
   */
  private handleNetworkError(details: NetworkErrorDetails): void {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      message: `Network request failed: ${details.method} ${details.url}`,
      category: ErrorCategory.NETWORK,
      severity: this.classifyNetworkErrorSeverity(details.status),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
      breadcrumbs: [...this.breadcrumbs],
      context: {
        networkDetails: details,
        connectionType: (navigator as any).connection?.effectiveType,
      },
    };

    this.reportError(errorReport);
  }

  /**
   * Intercept console errors
   */
  private interceptConsoleErrors(): void {
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      if (!message.includes('Warning:') && !message.includes('Sentry Logger')) {
        this.addBreadcrumb({
          timestamp: Date.now(),
          message: `Console Error: ${message}`,
          category: 'console',
          level: 'error',
          data: { arguments: args },
        });
      }

      originalConsoleError.apply(console, args);
    };
  }

  /**
   * Add breadcrumb for error context
   */
  addBreadcrumb(breadcrumb: ErrorBreadcrumb): void {
    this.breadcrumbs.push(breadcrumb);
    
    // Keep only last 50 breadcrumbs
    if (this.breadcrumbs.length > ERROR_CONFIG.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Report error to all monitoring services
   */
  private reportError(errorReport: ErrorReport): void {
    // Send to Sentry
    if (ERROR_CONFIG.sentryDsn) {
      Sentry.withScope((scope) => {
        scope.setTag('category', errorReport.category);
        scope.setTag('severity', errorReport.severity);
        scope.setContext('errorReport', errorReport.context);
        scope.setFingerprint([errorReport.fingerprint || errorReport.message]);
        
        errorReport.breadcrumbs.forEach((breadcrumb) => {
          scope.addBreadcrumb({
            message: breadcrumb.message,
            category: breadcrumb.category,
            level: breadcrumb.level as any,
            timestamp: breadcrumb.timestamp / 1000,
            data: breadcrumb.data,
          });
        });

        if (errorReport.stack) {
          const error = new Error(errorReport.message);
          error.stack = errorReport.stack;
          Sentry.captureException(error);
        } else {
          Sentry.captureMessage(errorReport.message, errorReport.severity as any);
        }
      });
    }

    // Send to Google Analytics
    trackEvent({
      event_name: 'exception',
      event_category: 'error',
      event_label: errorReport.category,
      custom_parameters: {
        error_message: errorReport.message,
        error_severity: errorReport.severity,
        error_category: errorReport.category,
        error_id: errorReport.id,
        session_id: errorReport.sessionId,
      },
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Report: ${errorReport.severity.toUpperCase()}`);
      console.error('Message:', errorReport.message);
      console.error('Category:', errorReport.category);
      console.error('Context:', errorReport.context);
      console.error('Breadcrumbs:', errorReport.breadcrumbs);
      if (errorReport.stack) console.error('Stack:', errorReport.stack);
      console.groupEnd();
    }

    // Trigger critical error notifications
    if (errorReport.severity === ErrorSeverity.CRITICAL) {
      this.triggerCriticalErrorAlert(errorReport);
    }
  }

  /**
   * Classify error severity based on type and context
   */
  private classifyErrorSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Critical errors
    if (message.includes('chunk') || message.includes('loading css') || 
        message.includes('loading chunk') || message.includes('network error')) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity errors
    if (message.includes('typeerror') || message.includes('referenceerror') ||
        stack.includes('react') || stack.includes('components')) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity errors
    if (message.includes('warning') || message.includes('deprecated')) {
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.MEDIUM;
  }

  /**
   * Classify network error severity
   */
  private classifyNetworkErrorSeverity(status?: number): ErrorSeverity {
    if (!status) return ErrorSeverity.HIGH;
    
    if (status >= 500) return ErrorSeverity.CRITICAL;
    if (status >= 400) return ErrorSeverity.HIGH;
    return ErrorSeverity.MEDIUM;
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate error fingerprint for grouping
   */
  private generateErrorFingerprint(error: Error): string {
    const key = error.message + (error.stack?.split('\n')[1] || '');
    return btoa(key).substr(0, 16);
  }

  /**
   * Check if error should be throttled
   */
  private shouldThrottleError(message: string): boolean {
    const now = Date.now();
    const lastSeen = this.errorThrottle.get(message) || 0;
    
    // Throttle identical errors within 1 minute
    if (now - lastSeen < 60000) {
      return true;
    }
    
    this.errorThrottle.set(message, now);
    return false;
  }

  /**
   * Get resource URL from element
   */
  private getResourceUrl(element: HTMLElement): string {
    if (element.tagName === 'IMG') return (element as HTMLImageElement).src;
    if (element.tagName === 'SCRIPT') return (element as HTMLScriptElement).src;
    if (element.tagName === 'LINK') return (element as HTMLLinkElement).href;
    return 'unknown';
  }

  /**
   * Get React component stack (if available)
   */
  private getReactComponentStack(): string | undefined {
    try {
      // This would need to be integrated with React DevTools or React error boundaries
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Trigger critical error alert
   */
  private triggerCriticalErrorAlert(errorReport: ErrorReport): void {
    if (process.env.NODE_ENV === 'development') {
      // Show alert in development
      const alertDiv = document.createElement('div');
      alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        background: #ff4757;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(255,71,87,0.3);
        border-left: 4px solid #ff3742;
      `;
      
      alertDiv.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">🚨 CRITICAL ERROR</div>
        <div><strong>Message:</strong> ${errorReport.message}</div>
        <div><strong>Category:</strong> ${errorReport.category}</div>
        <div><strong>Time:</strong> ${new Date(errorReport.timestamp).toLocaleTimeString()}</div>
      `;

      document.body.appendChild(alertDiv);
      
      setTimeout(() => {
        if (alertDiv.parentNode) {
          alertDiv.parentNode.removeChild(alertDiv);
        }
      }, 10000);
    }

    // In production, this would integrate with notification services
    console.error('🚨 CRITICAL ERROR DETECTED:', errorReport);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): { 
    totalErrors: number; 
    sessionId: string; 
    recentErrors: ErrorBreadcrumb[] 
  } {
    return {
      totalErrors: this.errorCount,
      sessionId: this.sessionId,
      recentErrors: this.breadcrumbs.filter(b => b.level === 'error').slice(-5),
    };
  }
}

// Initialize Sentry
export function initializeSentry(): void {
  if (!ERROR_CONFIG.sentryDsn) {
    console.warn('Sentry DSN not provided, error reporting to Sentry disabled');
    return;
  }

  Sentry.init({
    dsn: ERROR_CONFIG.sentryDsn,
    environment: ERROR_CONFIG.environment,
    tracesSampleRate: ERROR_CONFIG.tracesSampleRate,
    beforeSend(event) {
      // Filter out development noise
      if (process.env.NODE_ENV === 'development') {
        if (event.message?.includes('Warning:') || 
            event.exception?.values?.[0]?.value?.includes('Warning:')) {
          return null;
        }
      }
      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      // Filter console logs in production
      if (process.env.NODE_ENV === 'production' && breadcrumb.category === 'console') {
        return breadcrumb.level === 'error' ? breadcrumb : null;
      }
      return breadcrumb;
    },
  });

  console.log('🛡️ Sentry initialized for error monitoring');
}

// Global error monitor instance
const errorMonitor = new ErrorMonitor();

export { errorMonitor };

/**
 * Manual error reporting
 */
export function reportError(
  error: Error, 
  context: Record<string, any> = {}, 
  category: ErrorCategory = ErrorCategory.JAVASCRIPT
): void {
  errorMonitor.addBreadcrumb({
    timestamp: Date.now(),
    message: `Manual error report: ${error.message}`,
    category: 'manual',
    level: 'error',
    data: context,
  });

  if (ERROR_CONFIG.sentryDsn) {
    Sentry.withScope((scope) => {
      scope.setTag('category', category);
      scope.setContext('manual_context', context);
      Sentry.captureException(error);
    });
  }

  trackEvent({
    event_name: 'manual_error',
    event_category: 'error',
    event_label: category,
    custom_parameters: {
      error_message: error.message,
      manual_context: JSON.stringify(context),
    },
  });
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, data?: Record<string, any>): void {
  errorMonitor.addBreadcrumb({
    timestamp: Date.now(),
    message,
    category: 'manual',
    level: 'info',
    data,
  });
}