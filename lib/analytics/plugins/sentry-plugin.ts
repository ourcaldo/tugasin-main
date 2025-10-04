/**
 * Custom Sentry Error Monitoring Plugin for getanalytics.io
 */

import * as Sentry from '@sentry/nextjs';

interface SentryPluginConfig {
  dsn: string;
  environment?: string;
  debug?: boolean;
  tracesSampleRate?: number;
}

export default function sentryPlugin(userConfig: SentryPluginConfig) {
  return {
    name: 'sentry',
    config: {
      dsn: userConfig.dsn,
      environment: userConfig.environment || 'production',
      debug: userConfig.debug || false,
      tracesSampleRate: userConfig.tracesSampleRate || 0.1,
    },
    initialize: ({ config }: { config: SentryPluginConfig }) => {
      if (typeof window === 'undefined' || !config.dsn) {
        return;
      }

      try {
        Sentry.init({
          dsn: config.dsn,
          environment: config.environment,
          tracesSampleRate: config.tracesSampleRate,
          beforeSend(event) {
            if (process.env.NODE_ENV === 'development') {
              if (event.message?.includes('Warning:') || 
                  event.exception?.values?.[0]?.value?.includes('Warning:')) {
                return null;
              }
            }
            return event;
          },
          beforeBreadcrumb(breadcrumb) {
            if (process.env.NODE_ENV === 'production' && breadcrumb.category === 'console') {
              return breadcrumb.level === 'error' ? breadcrumb : null;
            }
            return breadcrumb;
          },
        });

        console.log('🛡️ Sentry initialized for error monitoring');
      } catch (error) {
        console.error('Sentry: Failed to initialize:', error);
      }
    },
    identify: ({ payload }: { payload: any }) => {
      if (typeof window === 'undefined') return;

      try {
        Sentry.setUser({
          id: payload.userId,
          email: payload.traits?.email,
          username: payload.traits?.username || payload.traits?.name,
        });
      } catch (error) {
        console.error('Sentry: Failed to set user:', error);
      }
    },
    track: ({ payload }: { payload: any }) => {
      if (typeof window === 'undefined') return;

      try {
        Sentry.addBreadcrumb({
          category: 'analytics',
          message: payload.event,
          level: 'info',
          data: payload.properties,
        });
      } catch (error) {
        console.error('Sentry: Failed to add breadcrumb:', error);
      }
    },
    loaded: () => {
      return !!(typeof window !== 'undefined' && Sentry);
    },
  };
}
