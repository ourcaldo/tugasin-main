/**
 * Analytics Configuration using getanalytics.io
 * Centralized analytics setup with GA4, PostHog, and Sentry
 */

import Analytics from 'analytics';
import ga4Plugin from './plugins/ga4-plugin';
import postHogPlugin from './plugins/posthog-plugin';
import sentryPlugin from './plugins/sentry-plugin';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const IS_DEV = process.env.NODE_ENV === 'development';

const plugins = [];

if (GA_MEASUREMENT_ID) {
  plugins.push(
    ga4Plugin({
      measurementId: GA_MEASUREMENT_ID,
      debug: IS_DEV,
    })
  );
}

if (POSTHOG_KEY) {
  plugins.push(
    postHogPlugin({
      apiKey: POSTHOG_KEY,
      apiHost: POSTHOG_HOST,
      debug: IS_DEV,
    })
  );
}

if (SENTRY_DSN) {
  plugins.push(
    sentryPlugin({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      debug: IS_DEV,
      tracesSampleRate: IS_DEV ? 1.0 : 0.1,
    })
  );
}

const analytics = Analytics({
  app: 'Tugasin',
  version: 1,
  plugins,
  debug: IS_DEV,
});

export default analytics;

export { GA_MEASUREMENT_ID, POSTHOG_KEY, SENTRY_DSN };
