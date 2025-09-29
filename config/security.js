const securityConfig = {
  // HSTS Configuration
  hsts: {
    enabled: true,
    maxAge: 63072000, // 2 years
    includeSubDomains: true,
    preload: true,
  },

  // Content Security Policy
  csp: {
    scriptSrc: "'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://*.posthog.com https://us-assets.i.posthog.com https://www.googletagmanager.com https://www.google-analytics.com",
    styleSrc: "'self' 'unsafe-inline' https://fonts.googleapis.com",
    fontSrc: "'self' https://fonts.gstatic.com",
    connectSrc: "'self' https://cms.tugasin.me https://va.vercel-scripts.com https://fonts.googleapis.com https://*.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com https://*.ingest.us.sentry.io https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://stats.g.doubleclick.net",
    imgSrc: "'self' blob: data: https://images.unsplash.com https://cms.tugasin.me https://www.google-analytics.com",
    mediaSrc: "'self'",
    objectSrc: "'none'",
    baseUri: "'self'",
    formAction: "'self'",
    frameAncestors: "'self'",
    workerSrc: "'self' blob:",
    defaultSrc: "'self'",
    upgradeInsecureRequests: true,
  },

  // Permissions Policy
  permissionsPolicy: [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'payment=(self)',
    'usb=()',
    'clipboard-read=(self)',
    'clipboard-write=(self)',
  ],

  // Allowed development origins for Replit proxy
  allowedDevOrigins: [
    '127.0.0.1',
    'localhost',
    'worf.replit.dev',
  ],
}

module.exports = { securityConfig }