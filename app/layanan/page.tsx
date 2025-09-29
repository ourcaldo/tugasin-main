import React from 'react'
import Layanan from '@/components/pages/Layanan'
import { generateMetadata as genMetadata } from '@/lib/seo/metadata'
import { serviceSchema, breadcrumbSchema, generateStructuredDataScript } from '@/lib/seo/structured-data'
import { siteConfig } from '@/config/site'
import { getRevalidationForPageType, scheduleBackgroundRevalidation } from '@/lib/cache/isr-revalidation'

// Smart ISR configuration for services page
export const revalidate = 3600 // 1 hour

export async function generateMetadata() {
  const canonical = `${siteConfig.url}/layanan`
  return genMetadata(
    'Layanan Joki Tugas & Skripsi',
    'Berbagai layanan akademik tersedia: joki tugas kuliah, skripsi, thesis, dan konsultasi akademik. Dikerjakan oleh tim profesional sesuai bidang studi.',
    canonical,
    `${siteConfig.url}/og-default.jpg`,
    'page'
  )
}

export default function Page() {
  // Schedule background revalidation for services page
  scheduleBackgroundRevalidation('services');
  
  // Generate structured data for services page
  const breadcrumbs = [
    { name: 'Beranda', url: siteConfig.url },
    { name: 'Layanan', url: `${siteConfig.url}/layanan` }
  ]
  
  const structuredData = [
    serviceSchema(
      'Layanan Joki Tugas & Skripsi Akademik',
      'Layanan profesional untuk membantu mahasiswa menyelesaikan tugas kuliah, skripsi, thesis, dan konsultasi akademik dengan kualitas tinggi.',
      'Academic Writing Service'
    ),
    breadcrumbSchema(breadcrumbs)
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={generateStructuredDataScript(structuredData)}
      />
      <Layanan />
    </>
  )
}