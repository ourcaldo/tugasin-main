import { NextResponse, NextRequest } from 'next/server'

export const revalidate = 3600
export const dynamic = 'force-dynamic'

// Tell Next.js not to pre-generate these routes at build time
export async function generateStaticParams() {
  return []
}

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const cmsEndpoint = process.env.NEXT_PUBLIC_CMS_ENDPOINT
  const cmsToken = process.env.CMS_TOKEN
  
  if (!cmsEndpoint || !cmsToken) {
    return new NextResponse('CMS configuration missing', { status: 500 })
  }

  try {
    const resolvedParams = await context.params
    if (!resolvedParams || !resolvedParams.id) {
      throw new Error('Missing id parameter')
    }
    
    const { id } = resolvedParams
    
    const response = await fetchWithRetry(`${cmsEndpoint}/api/v1/sitemaps/sitemap-post-${id}.xml`, {
      headers: {
        'Authorization': `Bearer ${cmsToken}`
      },
      next: { revalidate: 3600 }
    })

    const xmlContent = await response.text()

    return new NextResponse(xmlContent, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (process.env.NODE_ENV === 'development') {
      console.error('=== Chunked Blog Sitemap Error ===')
      console.error('Error:', errorMessage)
      console.error('CMS Endpoint:', cmsEndpoint)
      console.error('==================================')
    }
    
    const emptySitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`
    
    return new NextResponse(emptySitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }
}
