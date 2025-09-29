import React from 'react'
import HomepageClient from '@/components/pages/HomepageClient'
import { generateMetadata as genMetadata } from '@/lib/seo/metadata'
import { organizationSchema, websiteSchema, generateStructuredDataScript } from '@/lib/seo/structured-data'
import { siteConfig } from '@/config/site'
import { getRevalidationForPageType, scheduleBackgroundRevalidation } from '@/lib/cache/isr-revalidation'
import { blogService } from '@/lib/cms/blog-service'
import type { BlogPost } from '@/lib/utils/types'

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

export default async function Page() {
  // Schedule background revalidation for intelligent updates
  scheduleBackgroundRevalidation('homepage');
  
  // Pre-fetch recent blog posts for homepage
  let recentPosts: BlogPost[] = [];
  let error: string | null = null;
  
  try {
    recentPosts = await blogService.getRecentPosts(3);
  } catch (err) {
    console.error('Failed to load recent posts for homepage:', err);
    error = 'Gagal memuat artikel terbaru';
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
      <HomepageClient 
        initialRecentPosts={recentPosts}
        initialError={error}
      />
    </>
  )
}