import Blog from '@/components/pages/Blog'
import BlogPost from '@/components/pages/BlogPost'
import { notFound } from 'next/navigation'
import { generateMetadata as genMetadata } from '@/lib/seo/metadata'
import { articleSchema, breadcrumbSchema, generateStructuredDataScript } from '@/lib/seo/structured-data'
import { siteConfig } from '@/config/site'
import { getRevalidationForPageType, scheduleBackgroundRevalidation } from '@/lib/cache/isr-revalidation'

interface PageProps {
  params: Promise<{
    params: string[]
  }>
}

// Smart ISR configuration for dynamic blog pages with CMS awareness
export const revalidate = 300 // 5 minutes

export default async function Page({ params }: PageProps) {
  const { params: routeParams } = await params
  
  // Schedule intelligent background revalidation for blog posts
  scheduleBackgroundRevalidation('blog-post');
  
  // If we have 2 segments: [category, slug] - show individual post
  if (routeParams.length === 2) {
    const [category, slug] = routeParams
    
    // Generate structured data for blog post
    const breadcrumbs = [
      { name: 'Beranda', url: siteConfig.url },
      { name: 'Blog', url: `${siteConfig.url}/blog` },
      { name: category, url: `${siteConfig.url}/blog/${category}` },
      { name: slug.replace(/-/g, ' '), url: `${siteConfig.url}/blog/${category}/${slug}` }
    ]
    
    const structuredData = [
      articleSchema(
        slug.replace(/-/g, ' '), // Convert slug to readable title
        `Artikel tentang ${slug.replace(/-/g, ' ')} dalam kategori ${category}`,
        new Date().toISOString(), // Published time - ideally from CMS
        new Date().toISOString(), // Modified time - ideally from CMS  
        'Tim Tugasin',
        `${category}/${slug}`,
        category,
        [category, 'akademik', 'tips']
      ),
      breadcrumbSchema(breadcrumbs)
    ]

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={generateStructuredDataScript(structuredData)}
        />
        <BlogPost />
      </>
    )
  }
  
  // If we have 1 segment: [category] - show category listing
  if (routeParams.length === 1) {
    const [category] = routeParams
    
    // Generate structured data for category listing
    const breadcrumbs = [
      { name: 'Beranda', url: siteConfig.url },
      { name: 'Blog', url: `${siteConfig.url}/blog` },
      { name: category, url: `${siteConfig.url}/blog/${category}` }
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
  
  // Invalid route
  notFound()
}

export async function generateMetadata({ params }: PageProps) {
  const { params: routeParams } = await params
  
  if (routeParams.length === 2) {
    const [category, slug] = routeParams
    const canonical = `${siteConfig.url}/blog/${category}/${slug}`
    const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) // Convert slug to title case
    
    return genMetadata(
      title,
      `Artikel tentang ${title} dalam kategori ${category}. Tips dan panduan akademik terbaru untuk membantu perjalanan studi Anda.`,
      canonical,
      `${siteConfig.url}/og-default.jpg`,
      'blog-post'
    )
  }
  
  if (routeParams.length === 1) {
    const [category] = routeParams
    const canonical = `${siteConfig.url}/blog/${category}`
    const categoryTitle = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    
    return genMetadata(
      `${categoryTitle} - Blog`,
      `Artikel kategori ${categoryTitle} - tips dan panduan akademik terbaru untuk membantu perjalanan studi Anda.`,
      canonical,
      `${siteConfig.url}/og-default.jpg`,
      'page'
    )
  }
  
  return genMetadata(
    'Blog',
    'Blog Tugasin - tips dan panduan akademik',
    `${siteConfig.url}/blog`,
    `${siteConfig.url}/og-default.jpg`,
    'page'
  )
}