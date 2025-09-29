const imageConfig = {
  // Image domains configuration
  domains: {
    fallback: (process.env.NEXT_PUBLIC_FALLBACK_IMAGE_DOMAINS || 'images.unsplash.com').split(',').map(d => d.trim()),
    cms: (process.env.NEXT_PUBLIC_CMS_IMAGE_DOMAINS || 'cms.tugasin.me').split(',').map(d => d.trim()),
    additional: ['syd.cloud.appwrite.io'],
  },

  // Image formats
  formats: ['image/webp', 'image/avif'],

  // Remote patterns for Next.js Image component
  getRemotePatterns: () => {
    const allDomains = [
      ...imageConfig.domains.fallback,
      ...imageConfig.domains.cms,
      ...imageConfig.domains.additional,
    ];

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

    return allDomains.map(domain => `https://${domain.trim()}`).join(' ');
  },
}

module.exports = { imageConfig }