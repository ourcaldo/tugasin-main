/**
 * Custom Google Tag Manager Plugin for getanalytics.io
 * Handles GTM initialization and event tracking
 * Production-ready implementation with proper error handling
 */

interface GTMPluginConfig {
  containerId: string;
  debug?: boolean;
  dataLayerName?: string;
  auth?: string;
  preview?: string;
}

declare global {
  interface Window {
    dataLayer: any[];
    [key: string]: any;
  }
}

export default function gtmPlugin(userConfig: GTMPluginConfig) {
  const dataLayerName = userConfig.dataLayerName || 'dataLayer';
  
  return {
    name: 'google-tag-manager',
    config: {
      containerId: userConfig.containerId,
      debug: userConfig.debug || false,
      dataLayerName,
      auth: userConfig.auth,
      preview: userConfig.preview,
    },
    initialize: ({ config }: { config: GTMPluginConfig }) => {
      if (typeof window === 'undefined') {
        return;
      }

      if (!config.containerId) {
        if (config.debug) {
          console.warn('GTM: No container ID provided');
        }
        return;
      }

      try {
        // Initialize dataLayer if it doesn't exist
        window[dataLayerName] = window[dataLayerName] || [];
        
        // Push GTM initialization event
        window[dataLayerName].push({
          'gtm.start': new Date().getTime(),
          event: 'gtm.js'
        });

        // Build GTM script URL with optional auth and preview parameters
        let gtmUrl = `https://www.googletagmanager.com/gtm.js?id=${config.containerId}`;
        
        if (config.auth && config.preview) {
          gtmUrl += `&gtm_auth=${config.auth}&gtm_preview=${config.preview}&gtm_cookies_win=x`;
        }
        
        if (dataLayerName !== 'dataLayer') {
          gtmUrl += `&l=${dataLayerName}`;
        }

        // Load GTM script
        const scriptId = `gtm-script-${config.containerId}`;
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.async = true;
          script.src = gtmUrl;
          
          script.onload = () => {
            if (config.debug) {
              console.log('GTM: Container loaded successfully:', config.containerId);
            }
          };
          
          script.onerror = () => {
            if (config.debug) {
              console.warn('GTM: Failed to load container (may be blocked by ad blocker or CSP)');
            }
          };
          
          document.head.appendChild(script);
        }

        // Add noscript fallback iframe
        if (!document.getElementById('gtm-noscript')) {
          const noscript = document.createElement('noscript');
          noscript.id = 'gtm-noscript';
          
          let iframeSrc = `https://www.googletagmanager.com/ns.html?id=${config.containerId}`;
          if (config.auth && config.preview) {
            iframeSrc += `&gtm_auth=${config.auth}&gtm_preview=${config.preview}&gtm_cookies_win=x`;
          }
          
          noscript.innerHTML = `<iframe src="${iframeSrc}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
          document.body.insertBefore(noscript, document.body.firstChild);
        }

        if (config.debug) {
          console.log('GTM: Initialized with container ID:', config.containerId);
        }
      } catch (error) {
        if (config.debug) {
          console.error('GTM: Failed to initialize:', error);
        }
      }
    },
    page: ({ payload }: { payload: any }) => {
      if (typeof window === 'undefined' || !window[dataLayerName]) {
        return;
      }

      try {
        window[dataLayerName].push({
          event: 'page_view',
          page: {
            title: payload.properties.title,
            path: payload.properties.path,
            url: payload.properties.url,
            referrer: payload.properties.referrer,
          }
        });
      } catch (error) {
        // Silently fail in production
      }
    },
    track: ({ payload }: { payload: any }) => {
      if (typeof window === 'undefined' || !window[dataLayerName]) {
        return;
      }

      try {
        window[dataLayerName].push({
          event: payload.event,
          eventCategory: payload.properties?.category,
          eventAction: payload.event,
          eventLabel: payload.properties?.label,
          eventValue: payload.properties?.value,
          ...payload.properties,
        });
      } catch (error) {
        // Silently fail in production
      }
    },
    identify: ({ payload }: { payload: any }) => {
      if (typeof window === 'undefined' || !window[dataLayerName]) {
        return;
      }

      try {
        window[dataLayerName].push({
          event: 'user_identified',
          userId: payload.userId,
          userTraits: payload.traits,
        });
      } catch (error) {
        // Silently fail in production
      }
    },
    loaded: () => {
      return !!(typeof window !== 'undefined' && window[dataLayerName]);
    },
  };
}
