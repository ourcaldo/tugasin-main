import React from 'react'
import BlogClient from '@/components/pages/BlogClient'
import { generateMetadata as genMetadata } from '@/lib/seo/metadata'
import { breadcrumbSchema, generateStructuredDataScript } from '@/lib/seo/structured-data'
import { siteConfig } from '@/config/site'
import { blogService } from '@/lib/cms/blog-service'
import type { BlogPost, BlogCategory } from '@/lib/utils/types'

// ISR with 24-hour revalidation
export const revalidate = 86400

export async function generateStaticParams() {
  const postsPerPage = 20
  const allPosts = await blogService.getAllPostsForSitemap()
  const totalPages = Math.ceil(allPosts.length / postsPerPage)
  
  return Array.from({ length: totalPages }, (_, i) => ({
    page: String(i + 1)
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params
  const canonical = `${siteConfig.url}/blog/page/${page}`
  return genMetadata(
    `Blog & Tips Akademik - Halaman ${page}`,
    'Artikel dan tips seputar dunia akademik, strategi mengerjakan tugas, dan panduan penelitian untuk mahasiswa.',
    canonical,
    `${siteConfig.url}/og-default.jpg`,
    'page'
  )
}

export default async function Page({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params
  const currentPage = parseInt(page, 10)
  const postsPerPage = 20
  
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
  
  const breadcrumbs = [
    { name: 'Beranda', url: siteConfig.url },
    { name: 'Blog', url: `${siteConfig.url}/blog` },
    { name: `Halaman ${currentPage}`, url: `${siteConfig.url}/blog/page/${currentPage}` }
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
