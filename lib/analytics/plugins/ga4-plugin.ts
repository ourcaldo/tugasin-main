/**
 * Custom Google Analytics 4 Plugin for getanalytics.io
 * Handles GA4 initialization and event tracking
 */

interface GA4PluginConfig {
  measurementId: string;
  debug?: boolean;
}

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export default function ga4Plugin(userConfig: GA4PluginConfig) {
  return {
    name: 'google-analytics-4',
    config: {
      measurementId: userConfig.measurementId,
      debug: userConfig.debug || false,
    },
    initialize: ({ config }: { config: GA4PluginConfig }) => {
      if (typeof window === 'undefined' || !config.measurementId) {
        return;
      }

      try {
        // Initialize dataLayer
        window.dataLayer = window.dataLayer || [];
        
        // Define gtag function
        window.gtag = function gtag() {
          window.dataLayer.push(arguments);
        };
        
        // Initial gtag commands
        window.gtag('js', new Date());
        window.gtag('config', config.measurementId, {
          anonymize_ip: true,
          cookie_flags: 'SameSite=Strict;Secure',
          send_page_view: false, // We'll handle page views manually
        });

        // Load GA4 script
        const scriptId = `ga-script-${config.measurementId}`;
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.async = true;
          script.src = `https://www.googletagmanager.com/gtag/js?id=${config.measurementId}`;
          
          script.onload = () => {
            if (config.debug) {
              console.log('GA4: Script loaded successfully for', config.measurementId);
            }
          };
          
          script.onerror = () => {
            console.warn('GA4: Failed to load script (may be blocked by ad blocker or CSP)');
          };
          
          document.head.appendChild(script);
        }

        if (config.debug) {
          console.log('GA4: Initialized with measurement ID:', config.measurementId);
        }
      } catch (error) {
        console.error('GA4: Failed to initialize:', error);
      }
    },
    page: ({ payload }: { payload: any }) => {
      if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
        return;
      }

      try {
        window.gtag('event', 'page_view', {
          page_title: payload.properties.title,
          page_location: payload.properties.url || window.location.href,
          page_path: payload.properties.path,
        });
      } catch (error) {
        console.error('GA4: Failed to track page view:', error);
      }
    },
    track: ({ payload }: { payload: any }) => {
      if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
        return;
      }

      try {
        const eventName = payload.event;
        const eventParams = { ...payload.properties };
        
        window.gtag('event', eventName, eventParams);
      } catch (error) {
        console.error('GA4: Failed to track event:', error);
      }
    },
    identify: ({ payload }: { payload: any }) => {
      if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
        return;
      }

      try {
        window.gtag('set', 'user_properties', {
          user_id: payload.userId,
          ...payload.traits,
        });
      } catch (error) {
        console.error('GA4: Failed to identify user:', error);
      }
    },
    loaded: () => {
      return !!(typeof window !== 'undefined' && window.gtag);
    },
  };
}
