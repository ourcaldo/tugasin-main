import React from 'react'
import Homepage from '@/components/pages/Homepage'
import { generateMetadata as genMetadata } from '@/lib/seo/metadata'
import { organizationSchema, websiteSchema, generateStructuredDataScript } from '@/lib/seo/structured-data'
import { siteConfig } from '@/config/site'
import { scheduleBackgroundRevalidation } from '@/lib/cache/isr-revalidation'
import { blogService } from '@/lib/cms/blog-service'

// Disable revalidation for build
export const dynamic = 'force-static'

export async function generateMetadata() {
  const canonical = siteConfig.url
  return genMetadata(
    '', // Homepage uses full title from metadata.ts
    'Tugasin membantu mahasiswa menyelesaikan tugas kuliah dan skripsi dengan mudah. Layanan joki tugas terpercaya, cepat, dan berkualitas tinggi.',
    canonical,
    `${siteConfig.url}/og-default.jpg`,
    'homepage'
  )
}

export default async function Page() {
  // Schedule background revalidation for intelligent updates
  scheduleBackgroundRevalidation('homepage');
  
  // Fetch recent blog posts server-side
  let recentPosts: any[] = [];
  try {
    recentPosts = await blogService.getRecentPosts(3);
  } catch (error) {
    console.error('Failed to fetch recent posts for homepage:', error);
  }
  
  // Generate structured data for homepage
  const structuredData = [
    organizationSchema(),
    websiteSchema()
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={generateStructuredDataScript(structuredData)}
      />
      <Homepage recentPosts={recentPosts} />
    </>
  )
}