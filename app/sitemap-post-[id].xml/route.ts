import { NextResponse, NextRequest } from 'next/server'

export const revalidate = 3600
export const dynamic = 'force-dynamic'

// Tell Next.js not to pre-generate these routes at build time
export async function generateStaticParams() {
  return []
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
    // Safely await params with null check
    const resolvedParams = await context.params
    if (!resolvedParams || !resolvedParams.id) {
      throw new Error('Missing id parameter')
    }
    
    const { id } = resolvedParams
    
    const response = await fetch(`${cmsEndpoint}/api/v1/sitemaps/sitemap-post-${id}.xml`, {
      headers: {
        'Authorization': `Bearer ${cmsToken}`
      },
      next: { revalidate: 3600 }
    })

    if (!response.ok) {
      throw new Error(`CMS returned ${response.status}`)
    }

    const xmlContent = await response.text()

    return new NextResponse(xmlContent, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error proxying chunked blog sitemap from CMS:', error)
    
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
