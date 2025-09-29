import React from 'react'
import Blog from '@/components/pages/Blog'
import { generateMetadata as genMetadata } from '@/lib/seo/metadata'
import { breadcrumbSchema, generateStructuredDataScript } from '@/lib/seo/structured-data'
import { siteConfig } from '@/config/site'
import { getRevalidationForPageType, scheduleBackgroundRevalidation } from '@/lib/cache/isr-revalidation'

// Smart ISR configuration for blog listing page with CMS awareness
export const revalidate = 300 // 5 minutes

export async function generateMetadata() {
  const canonical = `${siteConfig.url}/blog`
  return genMetadata(
    'Blog & Tips Akademik',
    'Artikel dan tips seputar dunia akademik, strategi mengerjakan tugas, dan panduan penelitian untuk mahasiswa.',
    canonical,
    `${siteConfig.url}/og-default.jpg`,
    'page'
  )
}

export default function Page() {
  // Schedule intelligent background revalidation for blog listing
  scheduleBackgroundRevalidation('blog-listing');
  
  // Generate structured data for blog listing page
  const breadcrumbs = [
    { name: 'Beranda', url: siteConfig.url },
    { name: 'Blog', url: `${siteConfig.url}/blog` }
  ]
  
  const structuredData = [
    breadcrumbSchema(breadcrumbs)
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={generateStructuredDataScript(structuredData)}
      />
      <Blog />
    </>
  )
}