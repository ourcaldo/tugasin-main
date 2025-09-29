import React from 'react'
import Homepage from '@/components/pages/Homepage'
import { generateMetadata as genMetadata } from '@/lib/seo/metadata'
import { organizationSchema, websiteSchema, generateStructuredDataScript } from '@/lib/seo/structured-data'
import { siteConfig } from '@/config/site'
import { getRevalidationForPageType, scheduleBackgroundRevalidation } from '@/lib/cache/isr-revalidation'

// Smart ISR configuration for homepage with CMS awareness
export const revalidate = 3600 // 1 hour

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

export default function Page() {
  // Schedule background revalidation for intelligent updates
  scheduleBackgroundRevalidation('homepage');
  
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
      <Homepage />
    </>
  )
}