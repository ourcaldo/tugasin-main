/**
 * Google Analytics 4 (GA4) Integration
 * Provides comprehensive tracking for pageviews, events, conversions, and ecommerce
 */

// Google Analytics configuration
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Enhanced ecommerce events
export interface EcommerceItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_category2?: string;
  item_brand?: string;
  price?: number;
  currency?: string;
  quantity?: number;
}

export interface EcommerceEvent {
  transaction_id?: string;
  value?: number;
  currency?: string;
  items: EcommerceItem[];
}

export interface CustomEvent {
  event_name: string;
  event_category?: string;
  event_label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'consent',
      targetId: string | Date | 'default',
      config?: Record<string, any>
    ) => void;
    dataLayer: Record<string, any>[];
  }
}

/**
 * Initialize Google Analytics dataLayer only
 */
export function initializeDataLayer(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Initialize dataLayer if not already present
  window.dataLayer = window.dataLayer || [];
}

/**
 * Configure Google Analytics after script loads
 */
export function configureGA(): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') {
    console.warn('GA4: Measurement ID not found or running server-side');
    return;
  }

  // Check if gtag is available (loaded by the GA script)
  if (typeof window.gtag !== 'function') {
    console.error('GA4: gtag function not available. Make sure the GA script loaded correctly.');
    return;
  }

  // Configure GA4
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href,
    // Enhanced measurement settings
    enhanced_measurements: {
      scrolls: true,
      outbound_clicks: true,
      site_search: true,
      video_engagement: true,
      file_downloads: true,
    },
    // Custom dimensions for user journey tracking
    custom_map: {
      custom_dimension_1: 'user_type',
      custom_dimension_2: 'service_interest',
      custom_dimension_3: 'traffic_source',
    },
    // Cookie settings for privacy compliance
    cookie_flags: 'SameSite=Strict;Secure',
    anonymize_ip: true,
    allow_google_signals: false, // Adjust based on privacy requirements
  });

  console.log('GA4: Configured with measurement ID:', GA_MEASUREMENT_ID);
}

/**
 * Track page views
 */
export function trackPageView(url: string, title?: string): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') {
    console.warn('GA4: gtag not available, skipping page view tracking');
    return;
  }

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
    page_title: title || document.title,
    page_location: window.location.href,
  });

  // Custom page view event for enhanced tracking
  window.gtag('event', 'page_view', {
    page_title: title || document.title,
    page_location: window.location.href,
    page_path: url,
  });
}

/**
 * Track custom events
 */
export function trackEvent(event: CustomEvent): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') {
    console.warn('GA4: gtag not available, skipping event tracking');
    return;
  }

  const { event_name, event_category, event_label, value, custom_parameters } = event;

  window.gtag('event', event_name, {
    event_category,
    event_label,
    value,
    ...custom_parameters,
  });
}

/**
 * Track service inquiry (lead generation)
 */
export function trackServiceInquiry(serviceType: string, contactMethod: 'form' | 'whatsapp' | 'phone'): void {
  trackEvent({
    event_name: 'generate_lead',
    event_category: 'engagement',
    event_label: `${serviceType}_${contactMethod}`,
    custom_parameters: {
      service_type: serviceType,
      contact_method: contactMethod,
      lead_source: 'website',
    },
  });

  // Enhanced ecommerce tracking for service inquiry
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') {
    console.warn('GA4: gtag not available, skipping ecommerce tracking');
    return;
  }

  window.gtag('event', 'begin_checkout', {
    currency: 'IDR',
    value: 0, // Will be updated when price is known
    items: [{
      item_id: `service_${serviceType.toLowerCase().replace(/\s+/g, '_')}`,
      item_name: serviceType,
      item_category: 'academic_service',
      quantity: 1,
    }],
  });
}

/**
 * Track conversion goals
 */
export function trackConversion(conversionType: 'contact_form' | 'whatsapp_click' | 'phone_call' | 'service_request'): void {
  trackEvent({
    event_name: 'conversion',
    event_category: 'goal',
    event_label: conversionType,
    value: 1,
    custom_parameters: {
      conversion_type: conversionType,
      timestamp: Date.now(),
    },
  });

  // Google Ads conversion tracking (if applicable)
  if (conversionType === 'contact_form') {
    if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;
    if (typeof window.gtag !== 'function') {
      console.warn('GA4: gtag not available, skipping conversion tracking');
      return;
    }

    window.gtag('event', 'contact', {
      event_category: 'engagement',
      event_label: 'form_submission',
    });
  }
}

/**
 * Track user journey milestones
 */
export function trackUserJourney(stage: 'awareness' | 'interest' | 'consideration' | 'intent' | 'evaluation' | 'purchase'): void {
  trackEvent({
    event_name: 'user_journey',
    event_category: 'engagement',
    event_label: stage,
    custom_parameters: {
      journey_stage: stage,
      session_timestamp: Date.now(),
    },
  });
}

/**
 * Track scroll depth
 */
export function trackScrollDepth(percentage: number): void {
  if (percentage % 25 === 0) { // Track at 25%, 50%, 75%, 100%
    trackEvent({
      event_name: 'scroll',
      event_category: 'engagement',
      event_label: `${percentage}%`,
      value: percentage,
    });
  }
}

/**
 * Track file downloads
 */
export function trackFileDownload(fileName: string, fileType: string): void {
  trackEvent({
    event_name: 'file_download',
    event_category: 'engagement',
    event_label: fileName,
    custom_parameters: {
      file_name: fileName,
      file_type: fileType,
    },
  });
}

/**
 * Track search queries
 */
export function trackSiteSearch(searchTerm: string, resultCount?: number): void {
  trackEvent({
    event_name: 'search',
    event_category: 'engagement',
    event_label: searchTerm,
    custom_parameters: {
      search_term: searchTerm,
      result_count: resultCount,
    },
  });
}

/**
 * Set user properties for segmentation
 */
export function setUserProperties(properties: Record<string, string | number>): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') {
    console.warn('GA4: gtag not available, skipping user properties');
    return;
  }

  window.gtag('config', GA_MEASUREMENT_ID, {
    custom_map: properties,
  });
}

/**
 * Enable/disable tracking based on consent
 */
export function setConsentMode(
  analytics: boolean = true,
  marketing: boolean = true
): void {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') {
    console.warn('GA4: gtag not available, skipping consent mode');
    return;
  }

  window.gtag('consent', 'default', {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: marketing ? 'granted' : 'denied',
    personalization_storage: marketing ? 'granted' : 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
  });
}

/**
 * Load GA4 script dynamically
 */
export function loadGAScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!GA_MEASUREMENT_ID) {
      console.warn('GA4: No measurement ID provided');
      resolve();
      return;
    }

    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`)) {
      // Script already loaded, just configure
      if (typeof window.gtag === 'function') {
        configureGA();
      }
      resolve();
      return;
    }

    // Initialize dataLayer before loading script
    initializeDataLayer();

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    
    script.onload = () => {
      // Wait a bit for the script to fully initialize gtag
      setTimeout(() => {
        configureGA();
        resolve();
      }, 100);
    };
    
    script.onerror = () => {
      console.warn('GA4: Failed to load Google Analytics script (likely blocked by CSP or ad blocker)');
      // Don't reject - just resolve to prevent blocking the application
      resolve();
    };

    document.head.appendChild(script);
  });
}