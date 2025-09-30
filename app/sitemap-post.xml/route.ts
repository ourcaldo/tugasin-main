import { NextResponse } from 'next/server'
import { blogService } from '@/lib/cms/blog-service'

// ISR configuration for blog posts sitemap index
export const revalidate = 3600 // 1 hour

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tugasin.com'
  const postsPerSitemap = 200
  
  try {
    // Fetch total posts count from CMS to calculate number of sitemaps needed
    const allPosts = await blogService.getAllPosts(1000, 0, false) // Get up to 1000 posts to count
    const totalPosts = allPosts.length
    
    if (totalPosts === 0) {
      // Return empty sitemap index if no posts
      const emptySitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</sitemapindex>`
      
      return new NextResponse(emptySitemapIndex, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        },
      })
    }
    
    const numberOfSitemaps = Math.ceil(totalPosts / postsPerSitemap)
    
    // Generate sitemap index for blog posts
    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from({ length: numberOfSitemaps }, (_, i) => {
  const pageNumber = i + 1
  return `  <sitemap>
    <loc>${baseUrl}/api/sitemap-post/${pageNumber}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`
}).join('\n')}
</sitemapindex>`

    return new NextResponse(sitemapIndex, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error generating blog posts sitemap index:', error)
    
    // Return empty sitemap index on error to prevent breaking the sitemap hierarchy
    const emptySitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</sitemapindex>`
    
    return new NextResponse(emptySitemapIndex, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  }
}