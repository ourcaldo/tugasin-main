import { NextResponse } from 'next/server'
import { blogService } from '@/lib/cms/blog-service'

// ISR configuration for blog posts sitemap index - 24 hour cache
export const revalidate = 86400 // 24 hours

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tugasin.com'
  const postsPerSitemap = 200
  
  try {
    // Fetch all posts to get accurate count (uses 24-hour cache)
    const allPosts = await blogService.getAllPostsForSitemap()
    const totalPosts = allPosts.length
    
    if (totalPosts === 0) {
      // Return empty sitemap index if no posts
      const emptySitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</sitemapindex>`
      
      return new NextResponse(emptySitemapIndex, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400',
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
    <loc>${baseUrl}/sitemap-post-${pageNumber}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`
}).join('\n')}
</sitemapindex>`

    return new NextResponse(sitemapIndex, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400',
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
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  }
}