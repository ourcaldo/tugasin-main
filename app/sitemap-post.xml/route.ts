import { NextResponse } from 'next/server'

export const revalidate = 3600
export const dynamic = 'force-dynamic'

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  const timeout = parseInt(process.env.CMS_TIMEOUT || '10000', 10)
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        return response
      }
      
      if (attempt === maxRetries) {
        throw new Error(`CMS returned ${response.status} after ${maxRetries} attempts`)
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
  
  throw new Error('Failed to fetch after retries')
}

export async function GET() {
  const cmsEndpoint = process.env.NEXT_PUBLIC_CMS_ENDPOINT
  const cmsToken = process.env.CMS_TOKEN
  const frontendDomain = process.env.NEXT_PUBLIC_SITE_URL || 'https://tugasin.me'
  
  if (!cmsEndpoint || !cmsToken) {
    return new NextResponse('CMS configuration missing', { status: 500 })
  }

  try {
    const response = await fetchWithRetry(`${cmsEndpoint}/api/v1/sitemaps`, {
      headers: {
        'Authorization': `Bearer ${cmsToken}`
      },
      next: { revalidate: 3600 }
    })

    const data = await response.json()
    
    if (!data || !data.data || !data.data.sitemaps) {
      throw new Error('Invalid API response structure')
    }
    
    const blogSitemap = data.data.sitemaps.find((s: any) => s.type === 'blog')
    
    if (!blogSitemap) {
      throw new Error('Blog sitemap not found in API response')
    }
    
    if (!blogSitemap.references || !Array.isArray(blogSitemap.references) || blogSitemap.references.length === 0) {
      throw new Error(`Blog sitemap references not found or empty. Found: ${JSON.stringify(blogSitemap)}`)
    }

    const sitemaps = blogSitemap.references.map((ref: string) => {
      const match = ref.match(/sitemap-post-(\d+)\.xml/)
      const id = match ? match[1] : ''
      return `<sitemap>
<loc>${frontendDomain}/sitemap-post-${id}.xml</loc>
<lastmod>${new Date().toISOString()}</lastmod>
</sitemap>`
    }).join('\n')

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>`

    return new NextResponse(xmlContent, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    
    if (process.env.NODE_ENV === 'development') {
      console.error('=== Blog Sitemap Generation Error ===')
      console.error('Error:', errorMessage)
      console.error('Stack:', errorStack)
      console.error('CMS Endpoint:', cmsEndpoint)
      console.error('=====================================')
    }
    
    const emptySitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</sitemapindex>`
    
    return new NextResponse(emptySitemapIndex, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }
}
