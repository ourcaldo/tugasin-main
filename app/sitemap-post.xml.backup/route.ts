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

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tugasin.com'
  const postsPerSitemap = 200
  
  // Temporarily return empty sitemap during build to prevent hanging
  const totalPosts = 0
  
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
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}