import React from 'react'
import BlogClient from '@/components/pages/BlogClient'
import { generateMetadata as genMetadata } from '@/lib/seo/metadata'
import { breadcrumbSchema, generateStructuredDataScript } from '@/lib/seo/structured-data'
import { siteConfig } from '@/config/site'
import { getRevalidationForPageType, scheduleBackgroundRevalidation } from '@/lib/cache/isr-revalidation'
import { blogService } from '@/lib/cms/blog-service'
import type { BlogPost, BlogCategory } from '@/lib/utils/types'

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

export default async function Page() {
  // Schedule intelligent background revalidation for blog listing
  scheduleBackgroundRevalidation('blog-listing');
  
  // Pre-fetch blog data on the server for SEO
  let featuredPost: BlogPost | null = null;
  let blogPosts: BlogPost[] = [];
  let categories: BlogCategory[] = [];
  let error: string | null = null;
  
  try {
    const [featured, posts, cats] = await Promise.all([
      blogService.getFeaturedPost(),
      blogService.getRecentPosts(50),
      blogService.getCategories()
    ]);
    
    featuredPost = featured;
    blogPosts = posts;
    categories = cats;
  } catch (err) {
    console.error('Failed to load blog data:', err);
    error = 'Gagal memuat data blog';
  }
  
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
      <BlogClient 
        initialFeaturedPost={featuredPost}
        initialBlogPosts={blogPosts}
        initialCategories={categories}
        initialError={error}
      />
    </>
  )
}