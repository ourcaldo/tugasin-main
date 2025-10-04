/**
 * Custom PostHog Analytics Plugin for getanalytics.io
 */

import posthog from 'posthog-js';

interface PostHogPluginConfig {
  apiKey: string;
  apiHost?: string;
  debug?: boolean;
}

export default function postHogPlugin(userConfig: PostHogPluginConfig) {
  return {
    name: 'posthog',
    config: {
      apiKey: userConfig.apiKey,
      apiHost: userConfig.apiHost || 'https://us.i.posthog.com',
      debug: userConfig.debug || false,
    },
    initialize: ({ config }: { config: PostHogPluginConfig }) => {
      if (typeof window === 'undefined' || !config.apiKey) {
        return;
      }

      try {
        posthog.init(config.apiKey, {
          api_host: config.apiHost,
          person_profiles: 'identified_only',
          capture_pageview: false,
          capture_pageleave: true,
          loaded: (posthog) => {
            if (config.debug) {
              posthog.debug();
              console.log('PostHog: Debug mode enabled');
            }
          },
          autocapture: {
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
          disable_session_recording: process.env.NODE_ENV !== 'production',
          enable_recording_console_log: false,
          session_recording: {
            maskAllInputs: true,
            maskTextSelector: '.sensitive',
            blockSelector: '.private',
          },
        });

        console.log('PostHog: Initialized successfully');
      } catch (error) {
        console.error('PostHog: Failed to initialize:', error);
      }
    },
    page: ({ payload }: { payload: any }) => {
      if (typeof window === 'undefined' || !posthog.__loaded) return;

      try {
        posthog.capture('$pageview', {
          $current_url: payload.properties.url,
          $pathname: payload.properties.path,
          $title: payload.properties.title,
        });
      } catch (error) {
        console.error('PostHog: Failed to track page view:', error);
      }
    },
    track: ({ payload }: { payload: any }) => {
      if (typeof window === 'undefined' || !posthog.__loaded) return;

      try {
        posthog.capture(payload.event, payload.properties);
      } catch (error) {
        console.error('PostHog: Failed to track event:', error);
      }
    },
    identify: ({ payload }: { payload: any }) => {
      if (typeof window === 'undefined' || !posthog.__loaded) return;

      try {
        posthog.identify(payload.userId, payload.traits);
      } catch (error) {
        console.error('PostHog: Failed to identify user:', error);
      }
    },
    loaded: () => {
      return !!(typeof window !== 'undefined' && posthog.__loaded);
    },
  };
}
