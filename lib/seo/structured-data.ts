import { siteConfig } from '@/config/site'
import { CONTACT_INFO } from '@/config/constants'

export interface StructuredData {
  '@context': string
  '@type': string
  [key: string]: any
}

// Organization schema for homepage
export const organizationSchema = (): StructuredData => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: siteConfig.name,
  description: siteConfig.description,
  url: siteConfig.url,
  logo: `${siteConfig.url}/logo.png`,
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: CONTACT_INFO.phone,
    contactType: 'customer service',
    availableLanguage: 'Indonesian'
  },
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'ID',
    addressLocality: 'Indonesia'
  },
  sameAs: [
    CONTACT_INFO.whatsapp,
    ...(process.env.NEXT_PUBLIC_INSTAGRAM_URL ? [process.env.NEXT_PUBLIC_INSTAGRAM_URL] : []),
    ...(process.env.NEXT_PUBLIC_TWITTER_URL ? [process.env.NEXT_PUBLIC_TWITTER_URL] : []),
    ...(process.env.NEXT_PUBLIC_LINKEDIN_URL ? [process.env.NEXT_PUBLIC_LINKEDIN_URL] : [])
  ].filter(Boolean)
})

// WebSite schema with search functionality
export const websiteSchema = (): StructuredData => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteConfig.name,
  description: siteConfig.description,
  url: siteConfig.url,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteConfig.url}/blog?search={search_term_string}`,
    'query-input': 'required name=search_term_string'
  },
  publisher: {
    '@type': 'Organization',
    name: siteConfig.name,
    logo: `${siteConfig.url}/logo.png`
  }
})

// Article schema for blog posts
export const articleSchema = (
  title: string,
  description: string,
  publishedTime: string,
  modifiedTime: string,
  authorName: string = 'Tugasin',
  slug: string,
  category: string = 'Academic Writing',
  tags: string[] = []
): StructuredData => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description: description,
  author: {
    '@type': 'Person',
    name: authorName
  },
  publisher: {
    '@type': 'Organization',
    name: siteConfig.name,
    logo: `${siteConfig.url}/logo.png`
  },
  datePublished: publishedTime,
  dateModified: modifiedTime,
  url: `${siteConfig.url}/blog/${slug}`,
  image: `${siteConfig.url}/og-default.jpg`,
  articleSection: category,
  keywords: tags.join(', '),
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `${siteConfig.url}/blog/${slug}`
  }
})

// BreadcrumbList schema for navigation
export const breadcrumbSchema = (breadcrumbs: Array<{ name: string; url: string }>): StructuredData => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((breadcrumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: breadcrumb.name,
    item: breadcrumb.url
  }))
})

// Service schema for service pages
export const serviceSchema = (
  name: string,
  description: string,
  category: string = 'Academic Writing Service'
): StructuredData => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: name,
  description: description,
  provider: {
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    telephone: CONTACT_INFO.phone,
    email: CONTACT_INFO.email
  },
  serviceType: category,
  areaServed: {
    '@type': 'Country',
    name: 'Indonesia'
  },
  availableLanguage: 'Indonesian',
  offers: {
    '@type': 'Offer',
    availability: 'https://schema.org/InStock',
    priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 year from now
  }
})

// Utility function to generate structured data script tag
export const generateStructuredDataScript = (data: StructuredData | StructuredData[]) => {
  const structuredData = Array.isArray(data) ? data : [data]
  return {
    __html: JSON.stringify(structuredData)
  }
}