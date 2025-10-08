import { NextResponse } from 'next/server'

export const revalidate = 3600

export async function GET() {
  const cmsEndpoint = process.env.NEXT_PUBLIC_CMS_ENDPOINT
  const cmsToken = process.env.CMS_TOKEN
  
  if (!cmsEndpoint || !cmsToken) {
    return new NextResponse('CMS configuration missing', { status: 500 })
  }

  try {
    const response = await fetch(`${cmsEndpoint}/api/v1/sitemaps/sitemap-post.xml`, {
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
    console.error('Error proxying blog sitemap from CMS:', error)
    
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
