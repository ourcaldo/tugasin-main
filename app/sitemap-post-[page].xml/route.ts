import { NextResponse } from 'next/server'
import { blogService } from '@/lib/cms/blog-service'

// ISR configuration for blog posts sitemap
export const revalidate = 3600 // 1 hour

// Helper function to create URL-safe slugs
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim() // Remove leading/trailing spaces
}

// Helper function to safely parse dates from fallback data
function parseDate(dateString: string): string {
  try {
    // First try parsing as ISO string
    const isoDate = new Date(dateString)
    if (!isNaN(isoDate.getTime())) {
      return isoDate.toISOString()
    }
    
    // Handle Indonesian date format like "15 Desember 2024"
    const indonesianMonths = {
      'januari': '01', 'februari': '02', 'maret': '03', 'april': '04',
      'mei': '05', 'juni': '06', 'juli': '07', 'agustus': '08',
      'september': '09', 'oktober': '10', 'november': '11', 'desember': '12'
    }
    
    const parts = dateString.toLowerCase().split(' ')
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0')
      const monthName = parts[1]
      const year = parts[2]
      const month = indonesianMonths[monthName as keyof typeof indonesianMonths]
      
      if (month) {
        const normalizedDate = new Date(`${year}-${month}-${day}`)
        if (!isNaN(normalizedDate.getTime())) {
          return normalizedDate.toISOString()
        }
      }
    }
    
    // Fallback to current date if parsing fails
    return new Date().toISOString()
  } catch (error) {
    console.warn('Date parsing failed for:', dateString, error)
    return new Date().toISOString()
  }
}

export async function GET(
  request: Request,
  { params }: { params: { page: string } }
) {
  try {
    // Extract page parameter directly from params
    let pageNumber = 1
    
    if (params?.page) {
      const parsedPage = parseInt(params.page, 10)
      if (!isNaN(parsedPage) && parsedPage >= 1) {
        pageNumber = parsedPage
      } else {
        return new NextResponse('Invalid page number', { status: 400 })
      }
    } else {
      console.warn('Sitemap: Missing page parameter, defaulting to page 1')
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tugasin.com'
    const postsPerSitemap = 200
    const offset = (pageNumber - 1) * postsPerSitemap

    // Get blog posts from the service (fallback to demo data if CMS unavailable)
    const posts = await blogService.getAllPosts(postsPerSitemap, offset)
    
    if (!posts || posts.length === 0) {
      // Return empty sitemap for pages with no content
      const emptySitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`
      
      return new NextResponse(emptySitemap, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      })
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${posts.map(post => {
  const slug = post.slug || createSlug(post.title)
  const categorySlug = createSlug(post.category || 'tips')
  const lastmod = parseDate(post.date || '')
  
  return `  <url>
    <loc>${baseUrl}/blog/${categorySlug}/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
}).join('\n')}
</urlset>`

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error generating numbered sitemap:', error)
    
    // Return empty sitemap on error to avoid breaking the sitemap hierarchy
    const emptySitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`
    
    return new NextResponse(emptySitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  }
}