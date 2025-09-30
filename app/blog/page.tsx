import React from 'react'
import { headers } from 'next/headers'
import BlogClient from '@/components/pages/BlogClient'
import { generateMetadata as genMetadata } from '@/lib/seo/metadata'
import { breadcrumbSchema, generateStructuredDataScript } from '@/lib/seo/structured-data'
import { siteConfig } from '@/config/site'
import { blogService } from '@/lib/cms/blog-service'
import type { BlogPost, BlogCategory } from '@/lib/utils/types'

// Use ISR for page 1 only - this will be built at build time
// For page > 1, we use dynamic rendering with cache headers
export const revalidate = 86400 // 24 hours in seconds for ISR

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page, 10) : 1
  const canonical = page === 1 ? `${siteConfig.url}/blog` : `${siteConfig.url}/blog?page=${page}`
  
  return genMetadata(
    page === 1 ? 'Blog & Tips Akademik' : `Blog & Tips Akademik - Halaman ${page}`,
    'Artikel dan tips seputar dunia akademik, strategi mengerjakan tugas, dan panduan penelitian untuk mahasiswa.',
    canonical,
    `${siteConfig.url}/og-default.jpg`,
    'page'
  )
}

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const currentPage = params.page ? parseInt(params.page, 10) : 1
  const postsPerPage = 20
  
  // For pages > 1, set dynamic rendering
  if (currentPage > 1) {
    // This forces dynamic rendering for paginated pages
    await headers()
  }
  
  let featuredPost: BlogPost | null = null
  let blogPosts: BlogPost[] = []
  let categories: BlogCategory[] = []
  let error: string | null = null
  let totalPosts = 0
  
  try {
    const [featured, posts, cats, allPostsData] = await Promise.all([
      blogService.getFeaturedPost(),
      blogService.getPostsForPage(currentPage, postsPerPage),
      blogService.getCategories(),
      blogService.getAllPostsForSitemap()
    ])
    
    featuredPost = featured
    blogPosts = posts
    categories = cats
    totalPosts = allPostsData.length
  } catch (err) {
    console.error('Failed to load blog data:', err)
    error = 'Gagal memuat data blog'
  }
  
  const breadcrumbs = currentPage === 1
    ? [
        { name: 'Beranda', url: siteConfig.url },
        { name: 'Blog', url: `${siteConfig.url}/blog` }
      ]
    : [
        { name: 'Beranda', url: siteConfig.url },
        { name: 'Blog', url: `${siteConfig.url}/blog` },
        { name: `Halaman ${currentPage}`, url: `${siteConfig.url}/blog?page=${currentPage}` }
      ]
  
  const structuredData = [breadcrumbSchema(breadcrumbs)]
  const totalPages = Math.ceil(totalPosts / postsPerPage)

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
        currentPage={currentPage}
        totalPages={totalPages}
        postsPerPage={postsPerPage}
      />
    </>
  )
}