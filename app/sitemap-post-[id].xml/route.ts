import { NextResponse, NextRequest } from 'next/server'

export const revalidate = 3600

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cmsEndpoint = process.env.NEXT_PUBLIC_CMS_ENDPOINT
  const cmsToken = process.env.CMS_TOKEN
  
  if (!cmsEndpoint || !cmsToken) {
    return new NextResponse('CMS configuration missing', { status: 500 })
  }

  try {
    const { id } = await params
    
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
