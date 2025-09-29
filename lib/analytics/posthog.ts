/**
 * PostHog Analytics Integration
 * Provides comprehensive tracking for pageviews, events, feature flags, and user analytics
 */

import posthog from 'posthog-js';

// PostHog configuration
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

export interface PostHogEvent {
  event_name: string;
  properties?: Record<string, any>;
}

/**
 * Initialize PostHog
 */
export function initializePostHog(): void {
  if (!POSTHOG_KEY || typeof window === 'undefined') {
    console.warn('PostHog: API key not found or running server-side');
    return;
  }

  // Check if already initialized
  if (posthog.__loaded) {
    console.log('PostHog: Already initialized');
    return;
  }

  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only', // Privacy-focused setting
      defaults: '2025-05-24',
      // Privacy and performance settings
      capture_pageview: false, // We'll handle this manually for better control
      capture_pageleave: true,
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          posthog.debug();
          console.log('PostHog: Debug mode enabled');
        }
      },
      // Enhanced tracking settings
      autocapture: {
        // Enhanced autocapture for form interactions
        capture_copied_text: true,
        css_selector_allowlist: [
          '[data-ph-capture]',
          '.ph-capture',
          'button',
          'a[href]',
          'input[type="submit"]',
          'input[type="button"]',
          '[role="button"]',
        ],
      },
      // Session recording (adjust based on privacy requirements)
      disable_session_recording: process.env.NODE_ENV !== 'production',
      enable_recording_console_log: false,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: '.sensitive',
        blockSelector: '.private',
      },
      // Feature flags
      bootstrap: {
        featureFlags: {},
      },
    });

    console.log('PostHog: Initialized successfully');
  } catch (error) {
    console.error('PostHog: Failed to initialize:', error);
  }
}

/**
 * Track page views manually
 */
export function trackPageView(url: string, title?: string): void {
  if (!POSTHOG_KEY || typeof window === 'undefined' || !posthog.__loaded) return;

  try {
    posthog.capture('$pageview', {
      $current_url: url,
      $title: title || document.title,
      $host: window.location.host,
      $pathname: window.location.pathname,
      $search: window.location.search,
    });
  } catch (error) {
    console.error('PostHog: Failed to track page view:', error);
  }
}

/**
 * Track custom events
 */
export function trackEvent(event: PostHogEvent): void {
  if (!POSTHOG_KEY || typeof window === 'undefined' || !posthog.__loaded) return;

  try {
    const { event_name, properties = {} } = event;
    posthog.capture(event_name, {
      ...properties,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('PostHog: Failed to track event:', error);
  }
}

/**
 * Track service inquiry (lead generation)
 */
export function trackServiceInquiry(serviceType: string, contactMethod: 'form' | 'whatsapp' | 'phone'): void {
  trackEvent({
    event_name: 'service_inquiry',
    properties: {
      service_type: serviceType,
      contact_method: contactMethod,
      lead_source: 'website',
      category: 'lead_generation',
    },
  });

  // Track as a conversion event
  trackEvent({
    event_name: 'lead_generated',
    properties: {
      service_type: serviceType,
      method: contactMethod,
      value: 1,
    },
  });
}

/**
 * Track conversion goals
 */
export function trackConversion(conversionType: 'contact_form' | 'whatsapp_click' | 'phone_call' | 'service_request', value?: number): void {
  trackEvent({
    event_name: 'conversion',
    properties: {
      conversion_type: conversionType,
      value: value || 1,
      timestamp: Date.now(),
    },
  });
}

/**
 * Track user journey milestones
 */
export function trackUserJourney(stage: 'awareness' | 'interest' | 'consideration' | 'intent' | 'evaluation' | 'purchase'): void {
  trackEvent({
    event_name: 'user_journey_stage',
    properties: {
      stage,
      journey_step: stage,
      session_timestamp: Date.now(),
    },
  });
}

/**
 * Identify user for tracking
 */
export function identifyUser(userId: string, properties?: Record<string, any>): void {
  if (!POSTHOG_KEY || typeof window === 'undefined' || !posthog.__loaded) return;

  try {
    posthog.identify(userId, properties);
  } catch (error) {
    console.error('PostHog: Failed to identify user:', error);
  }
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, any>): void {
  if (!POSTHOG_KEY || typeof window === 'undefined' || !posthog.__loaded) return;

  try {
    posthog.people.set(properties);
  } catch (error) {
    console.error('PostHog: Failed to set user properties:', error);
  }
}

/**
 * Track feature flag usage
 */
export function trackFeatureFlag(flagKey: string, flagValue: any, properties?: Record<string, any>): void {
  trackEvent({
    event_name: 'feature_flag_used',
    properties: {
      flag_key: flagKey,
      flag_value: flagValue,
      ...properties,
    },
  });
}

/**
 * Get feature flag value
 */
export function getFeatureFlag(flagKey: string, defaultValue: any = false): any {
  if (!POSTHOG_KEY || typeof window === 'undefined' || !posthog.__loaded) {
    return defaultValue;
  }

  try {
    return posthog.isFeatureEnabled(flagKey) ?? defaultValue;
  } catch (error) {
    console.error('PostHog: Failed to get feature flag:', error);
    return defaultValue;
  }
}

/**
 * Reset user session (for logout)
 */
export function resetUser(): void {
  if (!POSTHOG_KEY || typeof window === 'undefined' || !posthog.__loaded) return;

  try {
    posthog.reset();
  } catch (error) {
    console.error('PostHog: Failed to reset user:', error);
  }
}

/**
 * Enable/disable tracking based on consent
 */
export function setTrackingConsent(enabled: boolean): void {
  if (!POSTHOG_KEY || typeof window === 'undefined' || !posthog.__loaded) return;

  try {
    if (enabled) {
      posthog.opt_in_capturing();
    } else {
      posthog.opt_out_capturing();
    }
  } catch (error) {
    console.error('PostHog: Failed to set tracking consent:', error);
  }
}

/**
 * Check if PostHog is loaded and ready
 */
export function isPostHogReady(): boolean {
  return !!(POSTHOG_KEY && typeof window !== 'undefined' && posthog.__loaded);
}

export default posthog;