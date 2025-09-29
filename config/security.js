const securityConfig = {
  // HSTS Configuration
  hsts: {
    enabled: true,
    maxAge: 63072000, // 2 years
    includeSubDomains: true,
    preload: true,
  },

  // Content Security Policy - Very permissive (allows everything)
  csp: {
    defaultSrc: "*",
    scriptSrc: "* 'unsafe-eval' 'unsafe-inline' data: blob:",
    styleSrc: "* 'unsafe-inline' data: blob:",
    fontSrc: "* data: blob:",
    connectSrc: "* data: blob:",
    imgSrc: "* data: blob:",
    mediaSrc: "* data: blob:",
    objectSrc: "*",
    baseUri: "*",
    formAction: "*",
    frameAncestors: "*",
    workerSrc: "* data: blob:",
    upgradeInsecureRequests: false,
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
    // Dynamic Replit domains pattern
    /.*\.replit\.dev$/,
    /.*\.janeway\.replit\.dev$/,
    /.*\.worf\.replit\.dev$/,
  ],
}

module.exports = { securityConfig }