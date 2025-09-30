import { MetadataRoute } from 'next'

// ISR configuration for root sitemap
export const revalidate = 86400 // 24 hours

// Root sitemap that references main sitemap categories
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tugasin.com'
  
  const sitemaps: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/sitemap-pages.xml`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/sitemap-post.xml`,
      lastModified: new Date(),
    }
  ]
  
  return sitemaps
}