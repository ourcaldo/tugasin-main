/**
 * Analytics Provider and Context
 * Centralized management of all analytics and monitoring services
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { loadGAScript, trackPageView, trackEvent as gtagTrackEvent, setUserProperties, setConsentMode, trackServiceInquiry, trackUserJourney, GA_MEASUREMENT_ID } from './gtag';
import { initializeWebVitals, measurePerformance, monitorResourceLoading } from './web-vitals';
import { initializeSentry, errorMonitor, addBreadcrumb } from './error-monitoring';
import { initializePostHog, trackPageView as postHogTrackPageView, trackEvent as postHogTrackEvent, trackServiceInquiry as postHogTrackServiceInquiry, trackUserJourney as postHogTrackUserJourney, setUserProperties as postHogSetUserProperties, setTrackingConsent as postHogSetTrackingConsent, POSTHOG_KEY } from './posthog';

interface AnalyticsConfig {
  googleAnalytics: {
    enabled: boolean;
    measurementId?: string;
    debugMode: boolean;
  };
  posthog: {
    enabled: boolean;
    apiKey?: string;
    host?: string;
    debugMode: boolean;
  };
  sentry: {
    enabled: boolean;
    dsn?: string;
  };
  webVitals: {
    enabled: boolean;
    reportThreshold: number;
  };
  consent: {
    analytics: boolean;
    marketing: boolean;
    functional: boolean;
  };
}

interface AnalyticsContextType {
  config: AnalyticsConfig;
  isInitialized: boolean;
  trackPageView: (url: string, title?: string) => void;
  trackEvent: (eventName: string, parameters?: Record<string, any>) => void;
  trackConversion: (type: string, value?: number) => void;
  trackServiceInquiry: (serviceType: string, method: string) => void;
  trackUserJourney: (stage: string) => void;
  measurePerformance: <T>(name: string, operation: () => T | Promise<T>) => Promise<T>;
  setUserProperties: (properties: Record<string, any>) => void;
  updateConsent: (consent: Partial<AnalyticsConfig['consent']>) => void;
  addBreadcrumb: (message: string, data?: Record<string, any>) => void;
  getErrorStats: () => any;
}

const defaultConfig: AnalyticsConfig = {
  googleAnalytics: {
    enabled: !!GA_MEASUREMENT_ID && process.env.NODE_ENV === 'production',
    measurementId: GA_MEASUREMENT_ID,
    debugMode: process.env.NODE_ENV === 'development',
  },
  posthog: {
    enabled: !!POSTHOG_KEY,
    apiKey: POSTHOG_KEY,
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    debugMode: process.env.NODE_ENV === 'development',
  },
  sentry: {
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
  webVitals: {
    enabled: true,
    reportThreshold: 0.1,
  },
  consent: {
    analytics: true, // Default to true, should be managed by consent banner
    marketing: false,
    functional: true,
  },
};

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
  config?: Partial<AnalyticsConfig>;
}

// Component to handle search params safely
function SearchParamsHandler({ onParamsChange }: { onParamsChange: (params: string) => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    onParamsChange(searchParams.toString());
  }, [searchParams, onParamsChange]);
  
  return null;
}

export function AnalyticsProvider({ children, config: userConfig }: AnalyticsProviderProps) {
  const [config] = useState<AnalyticsConfig>(() => ({
    ...defaultConfig,
    ...userConfig,
  }));
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchParamsString, setSearchParamsString] = useState('');
  const pathname = usePathname();

  // Initialize analytics services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize consent mode first
        if (config.googleAnalytics.enabled) {
          setConsentMode(config.consent.analytics, config.consent.marketing);
        }

        // Initialize Sentry for error monitoring
        if (config.sentry.enabled) {
          initializeSentry();
          addBreadcrumb('Analytics services initialization started');
        }

        // Initialize Google Analytics
        if (config.googleAnalytics.enabled && config.consent.analytics) {
          await loadGAScript();
          addBreadcrumb('Google Analytics initialized', { measurementId: config.googleAnalytics.measurementId });
        }

        // Initialize PostHog
        if (config.posthog.enabled && config.consent.analytics) {
          initializePostHog();
          addBreadcrumb('PostHog initialized', { apiKey: config.posthog.apiKey });
        }

        // Initialize Web Vitals monitoring
        if (config.webVitals.enabled) {
          initializeWebVitals();
          monitorResourceLoading();
          addBreadcrumb('Web Vitals monitoring initialized');
        }

        setIsInitialized(true);
        
        // Track initial page view
        const url = `${pathname}${searchParamsString ? `?${searchParamsString}` : ''}`;
        if (config.googleAnalytics.enabled && config.consent.analytics) {
          trackPageView(url, document.title);
        }
        if (config.posthog.enabled && config.consent.analytics) {
          postHogTrackPageView(url, document.title);
        }

        addBreadcrumb('Analytics initialization completed successfully');
        
        console.log('📊 Analytics services initialized:', {
          googleAnalytics: config.googleAnalytics.enabled,
          posthog: config.posthog.enabled,
          sentry: config.sentry.enabled,
          webVitals: config.webVitals.enabled,
        });

      } catch (error) {
        console.error('Failed to initialize analytics services:', error);
        addBreadcrumb('Analytics initialization failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    };

    initializeServices();
  }, [config, pathname, searchParamsString]);

  // Track route changes
  useEffect(() => {
    if (!isInitialized || !config.consent.analytics) return;

    const url = `${pathname}${searchParamsString ? `?${searchParamsString}` : ''}`;
    
    if (config.googleAnalytics.enabled) {
      trackPageView(url, document.title);
    }
    
    if (config.posthog.enabled) {
      postHogTrackPageView(url, document.title);
    }
    
    addBreadcrumb('Page view tracked', { pathname, searchParams: searchParamsString });
  }, [pathname, searchParamsString, isInitialized, config.googleAnalytics.enabled, config.posthog.enabled, config.consent.analytics]);

  // Context value
  const contextValue: AnalyticsContextType = {
    config,
    isInitialized,
    
    trackPageView: (url: string, title?: string) => {
      if (!config.consent.analytics) return;
      
      if (config.googleAnalytics.enabled) {
        trackPageView(url, title);
      }
      
      if (config.posthog.enabled) {
        postHogTrackPageView(url, title);
      }
      
      addBreadcrumb('Manual page view tracked', { url, title });
    },

    trackEvent: (eventName: string, parameters: Record<string, any> = {}) => {
      if (!config.consent.analytics) return;
      
      if (config.googleAnalytics.enabled) {
        gtagTrackEvent({
          event_name: eventName,
          event_category: parameters.category || 'engagement',
          event_label: parameters.label,
          value: parameters.value,
          custom_parameters: parameters,
        });
      }
      
      if (config.posthog.enabled) {
        postHogTrackEvent({
          event_name: eventName,
          properties: {
            category: parameters.category || 'engagement',
            label: parameters.label,
            value: parameters.value,
            ...parameters,
          },
        });
      }
      
      addBreadcrumb(`Event tracked: ${eventName}`, parameters);
    },

    trackConversion: (type: string, value: number = 1) => {
      if (!config.consent.analytics) return;
      
      gtagTrackEvent({
        event_name: 'conversion',
        event_category: 'goal',
        event_label: type,
        value,
        custom_parameters: {
          conversion_type: type,
          conversion_value: value,
        },
      });
      
      addBreadcrumb(`Conversion tracked: ${type}`, { value });
    },

    trackServiceInquiry: (serviceType: string, method: string) => {
      if (!config.consent.analytics) return;
      
      if (config.googleAnalytics.enabled) {
        trackServiceInquiry(serviceType, method as 'form' | 'whatsapp' | 'phone');
      }
      
      if (config.posthog.enabled) {
        postHogTrackServiceInquiry(serviceType, method as 'form' | 'whatsapp' | 'phone');
      }
      
      addBreadcrumb('Service inquiry tracked', { serviceType, method });
    },

    trackUserJourney: (stage: string) => {
      if (!config.consent.analytics) return;
      
      if (config.googleAnalytics.enabled) {
        trackUserJourney(stage as 'awareness' | 'interest' | 'consideration' | 'intent' | 'evaluation' | 'purchase');
      }
      
      if (config.posthog.enabled) {
        postHogTrackUserJourney(stage as 'awareness' | 'interest' | 'consideration' | 'intent' | 'evaluation' | 'purchase');
      }
      
      addBreadcrumb(`User journey: ${stage}`);
    },

    measurePerformance: async function<T>(name: string, operation: () => T | Promise<T>): Promise<T> {
      addBreadcrumb(`Performance measurement started: ${name}`);
      return measurePerformance(name, operation);
    },

    setUserProperties: (properties: Record<string, any>) => {
      if (!config.consent.analytics) return;
      
      if (config.googleAnalytics.enabled) {
        setUserProperties(properties);
      }
      
      if (config.posthog.enabled) {
        postHogSetUserProperties(properties);
      }
      
      addBreadcrumb('User properties set', properties);
    },

    updateConsent: (consent: Partial<AnalyticsConfig['consent']>) => {
      const newConsent = { ...config.consent, ...consent };
      
      if (config.googleAnalytics.enabled) {
        setConsentMode(newConsent.analytics, newConsent.marketing);
      }
      
      if (config.posthog.enabled) {
        postHogSetTrackingConsent(newConsent.analytics);
      }
      
      // Update config (in a real app, this would update state)
      Object.assign(config.consent, consent);
      
      addBreadcrumb('Consent updated', consent);
    },

    addBreadcrumb: (message: string, data?: Record<string, any>) => {
      addBreadcrumb(message, data);
    },

    getErrorStats: () => {
      return errorMonitor.getErrorStats();
    },
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      <Suspense fallback={null}>
        <SearchParamsHandler onParamsChange={setSearchParamsString} />
      </Suspense>
      {children}
    </AnalyticsContext.Provider>
  );
}

/**
 * Hook to use analytics context
 */
export function useAnalytics(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}

/**
 * HOC for automatic page view tracking
 */
export function withAnalytics<P extends object>(Component: React.ComponentType<P>) {
  const WrappedComponent = (props: P) => {
    const { trackPageView, addBreadcrumb } = useAnalytics();
    
    useEffect(() => {
      const componentName = Component.displayName || Component.name || 'UnknownComponent';
      addBreadcrumb(`Component mounted: ${componentName}`);
      
      return () => {
        addBreadcrumb(`Component unmounted: ${componentName}`);
      };
    }, [addBreadcrumb]);

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withAnalytics(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

/**
 * Hook for tracking user interactions
 */
export function useTrackInteraction() {
  const { trackEvent, addBreadcrumb } = useAnalytics();

  return {
    trackClick: (elementId: string, additionalData?: Record<string, any>) => {
      trackEvent('click', {
        category: 'user_interaction',
        label: elementId,
        element_id: elementId,
        ...additionalData,
      });
      addBreadcrumb(`Click tracked: ${elementId}`, additionalData);
    },

    trackFormSubmission: (formName: string, success: boolean) => {
      trackEvent('form_submit', {
        category: 'form',
        label: formName,
        form_name: formName,
        success,
      });
      addBreadcrumb(`Form submission: ${formName}`, { success });
    },

    trackScroll: (depth: number) => {
      if (depth % 25 === 0) { // Only track at quarter intervals
        trackEvent('scroll', {
          category: 'engagement',
          label: `${depth}%`,
          value: depth,
        });
      }
    },

    trackDownload: (fileName: string, fileType: string) => {
      trackEvent('file_download', {
        category: 'engagement',
        label: fileName,
        file_name: fileName,
        file_type: fileType,
      });
      addBreadcrumb(`File download: ${fileName}`, { fileType });
    },

    trackSearch: (query: string, resultCount?: number) => {
      trackEvent('search', {
        category: 'engagement',
        label: query,
        search_term: query,
        result_count: resultCount,
      });
      addBreadcrumb(`Search performed: ${query}`, { resultCount });
    },
  };
}

/**
 * Hook for business-specific tracking
 */
export function useBusinessTracking() {
  const { trackServiceInquiry, trackConversion, trackUserJourney, addBreadcrumb } = useAnalytics();

  return {
    trackServiceInterest: (serviceType: string) => {
      trackUserJourney('interest');
      addBreadcrumb(`Service interest: ${serviceType}`);
    },

    trackContactAttempt: (method: 'form' | 'whatsapp' | 'phone', serviceType?: string) => {
      if (serviceType) {
        trackServiceInquiry(serviceType, method);
      }
      trackConversion(`contact_${method}`, 1);
      trackUserJourney('intent');
    },

    trackServiceInquirySubmission: (serviceType: string, estimatedValue?: number) => {
      trackServiceInquiry(serviceType, 'form');
      trackConversion('service_request', estimatedValue);
      trackUserJourney('evaluation');
    },

    trackPriceCalculation: (serviceType: string, calculatedPrice: number) => {
      const { trackEvent } = useAnalytics();
      trackEvent('price_calculation', {
        category: 'tool',
        label: serviceType,
        value: calculatedPrice,
        service_type: serviceType,
        calculated_price: calculatedPrice,
      });
      addBreadcrumb(`Price calculated: ${serviceType}`, { calculatedPrice });
    },
  };
}

export default AnalyticsProvider;