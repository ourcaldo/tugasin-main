import React from 'react'
import Homepage from '@/components/pages/Homepage'
import { generateMetadata as genMetadata } from '@/lib/seo/metadata'
import { organizationSchema, websiteSchema, generateStructuredDataScript } from '@/lib/seo/structured-data'
import { siteConfig } from '@/config/site'
import { scheduleBackgroundRevalidation } from '@/lib/cache/isr-revalidation'

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