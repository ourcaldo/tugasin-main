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
  const canonical = page === 1 ? `${siteConfig.url}/blog/` : `${siteConfig.url}/blog/?page=${page}`
  
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
  
  console.log(`\n========== BLOG PAGE SERVER RENDER START ==========`)
  console.log(`📄 Rendering /blog with page=${currentPage}`)
  console.log(`⏰ Time: ${new Date().toISOString()}`)
  console.log(`🔄 Rendering mode: ${currentPage === 1 ? 'ISR (24h revalidation)' : 'Dynamic with cache'}`)
  
  // For pages > 1, set dynamic rendering
  if (currentPage > 1) {
    console.log(`🔀 Forcing dynamic rendering for page ${currentPage}`)
    // This forces dynamic rendering for paginated pages
    await headers()
  }
  
  let featuredPost: BlogPost | null = null
  let blogPosts: BlogPost[] = []
  let categories: BlogCategory[] = []
  let error: string | null = null
  let totalPosts = 0
  
  const startTime = Date.now()
  
  try {
    console.log(`\n📡 Starting API calls...`)
    
    const [featured, postsData, cats] = await Promise.all([
      blogService.getFeaturedPost(),
      blogService.getPostsWithPagination(currentPage, postsPerPage),
      blogService.getCategories()
    ])
    
    const duration = Date.now() - startTime
    
    featuredPost = featured
    blogPosts = postsData.posts
    categories = cats
    totalPosts = postsData.pageInfo.totalCount
    
    console.log(`\n✅ API calls completed successfully`)
    console.log(`⏱️  Duration: ${duration}ms`)
    console.log(`📊 Results:`)
    console.log(`   - Featured post: ${featuredPost ? featuredPost.title : 'None'}`)
    console.log(`   - Blog posts: ${blogPosts.length} posts fetched`)
    console.log(`   - Categories: ${categories.length} categories`)
    console.log(`   - Total posts: ${totalPosts}`)
    console.log(`   - Total pages: ${Math.ceil(totalPosts / postsPerPage)}`)
    console.log(`   - Current page: ${currentPage}`)
    console.log(`\n📝 Post titles on this page:`)
    blogPosts.forEach((post, i) => {
      console.log(`   ${i + 1}. ${post.title}`)
    })
  } catch (err) {
    const duration = Date.now() - startTime
    console.error(`\n❌ Failed to load blog data after ${duration}ms:`, err)
    error = 'Gagal memuat data blog'
  }
  
  console.log(`========== BLOG PAGE SERVER RENDER END ==========\n`)
  
  const breadcrumbs = currentPage === 1
    ? [
        { name: 'Beranda', url: `${siteConfig.url}/` },
        { name: 'Blog', url: `${siteConfig.url}/blog/` }
      ]
    : [
        { name: 'Beranda', url: `${siteConfig.url}/` },
        { name: 'Blog', url: `${siteConfig.url}/blog/` },
        { name: `Halaman ${currentPage}`, url: `${siteConfig.url}/blog/?page=${currentPage}` }
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