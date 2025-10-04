const imageConfig = {
  // CDN configuration
  cdnUrl: process.env.NEXT_PUBLIC_CDN_URL || '',
  
  // Image domains configuration
  domains: {
    fallback: (process.env.NEXT_PUBLIC_FALLBACK_IMAGE_DOMAINS || 'images.unsplash.com').split(',').map(d => d.trim()),
    cms: (process.env.NEXT_PUBLIC_CMS_IMAGE_DOMAINS || 'cms.tugasin.me').split(',').map(d => d.trim()),
    additional: ['syd.cloud.appwrite.io'],
  },

  // Image formats
  formats: ['image/webp', 'image/avif'],

  // Custom image loader for CDN
  loader: ({ src, width, quality }) => {
    const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;
    if (cdnUrl) {
      // If CDN is configured, use it
      return `${cdnUrl}${src}?w=${width}&q=${quality || 75}`;
    }
    // Otherwise use default Next.js loader
    return src;
  },

  // Remote patterns for Next.js Image component
  getRemotePatterns: () => {
    const allDomains = [
      ...imageConfig.domains.fallback,
      ...imageConfig.domains.cms,
      ...imageConfig.domains.additional,
    ];

    // Add CDN domain if configured
    const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;
    if (cdnUrl) {
      try {
        const cdnDomain = new URL(cdnUrl).hostname;
        allDomains.push(cdnDomain);
      } catch (e) {
        console.warn('Invalid CDN URL:', cdnUrl);
      }
    }

    return allDomains.map(hostname => ({
      protocol: 'https',
      hostname: hostname.trim(),
    }));
  },

  // Get all domains as string for CSP
  getAllDomainsForCSP: () => {
    const allDomains = [
      ...imageConfig.domains.fallback,
      ...imageConfig.domains.cms,
      ...imageConfig.domains.additional,
    ];

    // Add CDN domain if configured
    const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;
    if (cdnUrl) {
      try {
        const cdnDomain = new URL(cdnUrl).hostname;
        allDomains.push(cdnDomain);
      } catch (e) {
        console.warn('Invalid CDN URL:', cdnUrl);
      }
    }

    return allDomains.map(domain => `https://${domain.trim()}`).join(' ');
  },
}

module.exports = { imageConfig }