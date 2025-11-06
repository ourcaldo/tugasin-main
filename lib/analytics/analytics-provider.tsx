/**
 * Analytics Provider using getanalytics.io
 * Centralized management of all analytics and monitoring services
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import analytics from './config';

interface AnalyticsContextType {
  isInitialized: boolean;
  trackPageView: (url: string, title?: string) => void;
  trackEvent: (eventName: string, parameters?: Record<string, any>) => void;
  trackConversion: (type: string, value?: number) => void;
  trackServiceInquiry: (serviceType: string, method: string) => void;
  trackUserJourney: (stage: string) => void;
  setUserProperties: (properties: Record<string, any>) => void;
  identifyUser: (userId: string, traits?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
}

function SearchParamsHandler({ onParamsChange }: { onParamsChange: (params: string) => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    onParamsChange(searchParams.toString());
  }, [searchParams, onParamsChange]);
  
  return null;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchParamsString, setSearchParamsString] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('📊 Initializing analytics services...');
        
        setIsInitialized(true);
        
        const url = `${pathname}${searchParamsString ? `?${searchParamsString}` : ''}`;
        analytics.page({
          url,
          title: document.title,
          path: pathname,
        });

        console.log('📊 Analytics services initialized successfully');
      } catch (error) {
        console.error('Failed to initialize analytics services:', error);
      }
    };

    initializeServices();
  }, [pathname, searchParamsString]);

  useEffect(() => {
    if (!isInitialized) return;

    const url = `${pathname}${searchParamsString ? `?${searchParamsString}` : ''}`;
    analytics.page({
      url,
      title: document.title,
      path: pathname,
    });
  }, [pathname, searchParamsString, isInitialized]);

  const contextValue: AnalyticsContextType = {
    isInitialized,
    
    trackPageView: (url: string, title?: string) => {
      analytics.page({
        url,
        title: title || document.title,
        path: url,
      });
    },

    trackEvent: (eventName: string, parameters: Record<string, any> = {}) => {
      analytics.track(eventName, parameters);
    },

    trackConversion: (type: string, value: number = 1) => {
      analytics.track('conversion', {
        conversion_type: type,
        conversion_value: value,
        category: 'goal',
      });
    },

    trackServiceInquiry: (serviceType: string, method: string) => {
      analytics.track('generate_lead', {
        service_type: serviceType,
        contact_method: method,
        lead_source: 'website',
        category: 'engagement',
      });
    },

    trackUserJourney: (stage: string) => {
      analytics.track('user_journey', {
        journey_stage: stage,
        session_timestamp: Date.now(),
        category: 'engagement',
      });
    },

    setUserProperties: (properties: Record<string, any>) => {
      const userId = properties.userId || properties.id;
      if (userId) {
        analytics.identify(userId, properties);
      }
    },

    identifyUser: (userId: string, traits: Record<string, any> = {}) => {
      analytics.identify(userId, traits);
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

export function useAnalytics(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}

export function withAnalytics<P extends object>(Component: React.ComponentType<P>) {
  const WrappedComponent = (props: P) => {
    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withAnalytics(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

export function useTrackInteraction() {
  const { trackEvent } = useAnalytics();

  return {
    trackClick: (elementId: string, additionalData?: Record<string, any>) => {
      trackEvent('click', {
        category: 'user_interaction',
        label: elementId,
        element_id: elementId,
        ...additionalData,
      });
    },

    trackFormSubmission: (formName: string, success: boolean) => {
      trackEvent('form_submit', {
        category: 'form',
        label: formName,
        form_name: formName,
        success,
      });
    },

    trackScroll: (depth: number) => {
      if (depth % 25 === 0) {
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
    },

    trackSearch: (query: string, resultCount?: number) => {
      trackEvent('search', {
        category: 'engagement',
        label: query,
        search_term: query,
        result_count: resultCount,
      });
    },
  };
}

export function useBusinessTracking() {
  const { trackServiceInquiry, trackConversion, trackUserJourney, trackEvent } = useAnalytics();

  return {
    trackServiceInterest: (serviceType: string) => {
      trackUserJourney('interest');
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
      trackEvent('price_calculation', {
        category: 'tool',
        label: serviceType,
        value: calculatedPrice,
        service_type: serviceType,
        calculated_price: calculatedPrice,
      });
    },
  };
}

export default AnalyticsProvider;
