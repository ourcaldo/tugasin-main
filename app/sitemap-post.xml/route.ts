import { NextResponse } from 'next/server'

export const revalidate = 3600

export async function GET() {
  const cmsEndpoint = process.env.NEXT_PUBLIC_CMS_ENDPOINT
  const cmsToken = process.env.CMS_TOKEN
  const frontendDomain = process.env.NEXT_PUBLIC_SITE_URL || 'https://tugasin.me'
  
  if (!cmsEndpoint || !cmsToken) {
    return new NextResponse('CMS configuration missing', { status: 500 })
  }

  try {
    const response = await fetch(`${cmsEndpoint}/api/v1/sitemaps`, {
      headers: {
        'Authorization': `Bearer ${cmsToken}`
      },
      next: { revalidate: 3600 }
    })

    if (!response.ok) {
      throw new Error(`CMS returned ${response.status}`)
    }

    const data = await response.json()
    const blogSitemap = data.data.sitemaps.find((s: any) => s.type === 'blog')
    
    if (!blogSitemap?.references) {
      throw new Error('Blog sitemap references not found')
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
    console.error('Error generating blog sitemap from API:', error)
    
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
