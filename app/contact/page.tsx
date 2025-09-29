import React from 'react'
import Contact from '@/components/pages/Contact'
import { generateMetadata as genMetadata } from '@/lib/seo/metadata'
import { breadcrumbSchema, generateStructuredDataScript } from '@/lib/seo/structured-data'
import { siteConfig } from '@/config/site'
import { getRevalidationForPageType } from '@/lib/cache/isr-revalidation'

// Smart ISR configuration for contact page - low priority, long cache
export const revalidate = 86400 // 24 hours

export async function generateMetadata() {
  const canonical = `${siteConfig.url}/contact`
  return genMetadata(
    'Kontak & Konsultasi',
    'Hubungi tim Tugasin untuk konsultasi gratis tentang kebutuhan akademik Anda. Tersedia layanan 24/7 melalui WhatsApp.',
    canonical,
    `${siteConfig.url}/og-default.jpg`,
    'page'
  )
}

export default function Page() {
  // Generate structured data for contact page
  const breadcrumbs = [
    { name: 'Beranda', url: siteConfig.url },
    { name: 'Kontak', url: `${siteConfig.url}/contact` }
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
      <Contact />
    </>
  )
}