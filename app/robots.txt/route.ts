import { NextResponse } from 'next/server'

// ISR configuration for robots.txt
export const revalidate = 86400 // 24 hours

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tugasin.com'
  
  const robotsTxt = `User-agent: *
Allow: /

# Sitemap references
Sitemap: ${baseUrl}/sitemap.xml

# Host
Host: ${baseUrl}`

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}