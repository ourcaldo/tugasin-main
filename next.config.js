/** @type {import('next').NextConfig} */
const { securityConfig } = require('./config/security')
const { imageConfig } = require('./config/images')
const { siteConfig } = require('./config/site')

const nextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: imageConfig.getRemotePatterns(),
    formats: imageConfig.formats,
  },
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tugasin.com';
    
    return [
      // Comprehensive security headers for all routes
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // XSS Protection (legacy browsers)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // DNS prefetching control
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          // Permissions Policy (restrict sensitive APIs)
          {
            key: 'Permissions-Policy',
            value: securityConfig.permissionsPolicy.join(', '),
          },
          // HSTS for HTTPS enforcement (production only)
          ...(isDevelopment || !securityConfig.hsts.enabled ? [] : [{
            key: 'Strict-Transport-Security',
            value: `max-age=${securityConfig.hsts.maxAge}${securityConfig.hsts.includeSubDomains ? '; includeSubDomains' : ''}${securityConfig.hsts.preload ? '; preload' : ''}`,
          }]),
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              `default-src ${securityConfig.csp.defaultSrc}`,
              `script-src ${securityConfig.csp.scriptSrc}`,
              `style-src ${securityConfig.csp.styleSrc}`,
              `font-src ${securityConfig.csp.fontSrc}`,
              `img-src ${securityConfig.csp.imgSrc} ${imageConfig.getAllDomainsForCSP()}`,
              `connect-src ${securityConfig.csp.connectSrc}`,
              `media-src ${securityConfig.csp.mediaSrc}`,
              `object-src ${securityConfig.csp.objectSrc}`,
              `base-uri ${securityConfig.csp.baseUri}`,
              `form-action ${securityConfig.csp.formAction}`,
              `frame-ancestors ${securityConfig.csp.frameAncestors}`,
              securityConfig.csp.upgradeInsecureRequests ? 'upgrade-insecure-requests' : '',
            ].filter(Boolean).join('; '),
          },
        ],
      },
      // Static images - optimized caching with content negotiation
      {
        source: '/(.*)\\.(png|jpg|jpeg|gif|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      // SVG and vector assets - with compression hints
      {
        source: '/(.*)\\.(svg|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      // Fonts - optimized with cross-origin support
      {
        source: '/(.*)\\.(woff|woff2|eot|ttf|otf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      // Next.js static assets - enhanced with compression
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      // JavaScript and CSS files - optimized caching
      {
        source: '/(.*)\\.(js|css|mjs)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      // Manifest and service worker - immediate revalidation
      {
        source: '/(manifest\\.json|sw\\.js|workbox-.*\\.js)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      // API routes - no caching for dynamic content
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      // Blog pages with ISR - short-term caching
      {
        source: '/blog/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400',
          },
        ],
      },
      // HTML pages - short-term caching with stale-while-revalidate
      {
        source: '/((?!_next|api|.*\\.[^/]*$).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600',
          },
        ],
      },
      // Replit development environment CORS headers
      ...(process.env.NODE_ENV === 'development' ? [{
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      }] : []),
    ];
  },
  // Configure for Replit environment
  experimental: {
    allowedRevalidateHeaderKeys: ['authorization'],
  },
  // Compression and optimization settings
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  // Allow dev origins for Replit proxy environment
  allowedDevOrigins: securityConfig.allowedDevOrigins,
  // Simplified Webpack configuration to fix module loading issues
  webpack: (config, { isServer }) => {

    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: isServer
            ? '../analyze/server.html'
            : '../analyze/client.html',
        })
      );
    }

    // Performance improvements
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
  // Allow all hosts for Replit proxy
  async rewrites() {
    return [];
  },
  // Disable host checking for Replit environment
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Environment-specific configuration
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  trailingSlash: false,
  // Output configuration for different platforms
  output: process.env.VERCEL ? 'standalone' : undefined,
};

module.exports = nextConfig;