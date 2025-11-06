import Blog from '@/components/pages/Blog'
import BlogPostClient from '@/components/pages/BlogPostClient'
import { notFound, redirect as nextRedirect, permanentRedirect } from 'next/navigation'
import { generateMetadata as genMetadata } from '@/lib/seo/metadata'
import { articleSchema, breadcrumbSchema, generateStructuredDataScript } from '@/lib/seo/structured-data'
import { siteConfig } from '@/config/site'
import { getRevalidationForPageType, scheduleBackgroundRevalidation } from '@/lib/cache/isr-revalidation'
import { blogService } from '@/lib/cms/blog-service'
import { apiClient } from '@/lib/cms/api-client'
import { redirectHandler } from '@/lib/cms/redirect-handler'
import { getCategoryNameFromSlug } from '@/lib/utils/utils'
import type { BlogPost as BlogPostType } from '@/lib/utils/types'

interface PageProps {
  params: Promise<{
    params: string[]
  }>
  searchParams: Promise<{ page?: string }>
}

// Smart ISR configuration for dynamic blog pages with CMS awareness
export const revalidate = 300 // 5 minutes

export default async function Page({ params, searchParams }: PageProps) {
  const { params: routeParams } = await params
  const searchParamsResolved = await searchParams
  
  // Schedule intelligent background revalidation for blog posts
  scheduleBackgroundRevalidation('blog-post');
  
  // If we have 2 segments: [category, slug] - show individual post
  if (routeParams.length === 2) {
    const [category, slug] = routeParams
    
    // Fetch blog post data on the server for faster loading
    let post: BlogPostType | null = null
    let relatedPosts: BlogPostType[] = []
    let error: string | null = null
    
    try {
      // First, fetch the raw CMS post to check for redirects
      const cmsPostResponse = await apiClient.getPostBySlug(slug)
      
      if (!cmsPostResponse || !cmsPostResponse.post) {
        notFound()
      }
      
      // Check if post has a redirect configured
      const redirectResult = await redirectHandler.handlePostRedirect(
        cmsPostResponse.post.redirect,
        category
      )
      
      // If redirect is needed, perform the redirect with proper HTTP status
      if (redirectResult.shouldRedirect) {
        const httpStatus = redirectResult.httpStatus || 302
        
        // Handle 410 Gone - return custom 410 response
        if (httpStatus === 410) {
          return new Response('Gone', {
            status: 410,
            statusText: 'Gone',
            headers: {
              'Content-Type': 'text/plain',
            },
          })
        }
        
        // Ensure absolute URL for redirects
        let redirectUrl = redirectResult.redirectUrl || '/'
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = `${siteConfig.url}${redirectUrl.startsWith('/') ? redirectUrl : '/' + redirectUrl}`
        }
        
        // Handle redirects with explicit status codes
        // Use Response.redirect to set exact HTTP status codes (301, 302, 307, 308)
        return Response.redirect(redirectUrl, httpStatus)
      }
      
      // No redirect, continue with normal flow
      post = await blogService.getPostBySlug(slug)
      
      if (!post) {
        notFound()
      }
      
      // Fetch related posts by category - limited query, no fetching all posts
      const categoryPosts = await blogService.getPostsByCategory(post.category, 4)
      relatedPosts = categoryPosts.filter((p: BlogPostType) => p.id !== post!.id).slice(0, 3)
        
    } catch (err) {
      error = 'Gagal memuat artikel'
    }
    
    if (error || !post) {
      notFound()
    }
    
    // Generate structured data for blog post
    const categoryName = getCategoryNameFromSlug(category);
    const breadcrumbs = [
      { name: 'Beranda', url: `${siteConfig.url}/` },
      { name: 'Blog', url: `${siteConfig.url}/blog/` },
      { name: categoryName, url: `${siteConfig.url}/blog/${category}/` },
      { name: post.title, url: `${siteConfig.url}/blog/${category}/${slug}/` }
    ]
    
    const structuredData = [
      articleSchema(
        post.title,
        post.seo?.description || post.excerpt,
        new Date().toISOString(), // Published time - ideally from CMS
        new Date().toISOString(), // Modified time - ideally from CMS  
        post.author || 'Tim Tugasin',
        `${category}/${slug}`,
        category,
        post.tags || [category, 'akademik', 'tips']
      ),
      breadcrumbSchema(breadcrumbs)
    ]

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={generateStructuredDataScript(structuredData)}
        />
        <BlogPostClient 
          post={post}
          relatedPosts={relatedPosts}
          categoryParam={category}
        />
      </>
    )
  }
  
  // If we have 1 segment: [category] - show category listing
  if (routeParams.length === 1) {
    const [categorySlug] = routeParams
    const currentPage = searchParamsResolved.page ? parseInt(searchParamsResolved.page, 10) : 1
    const postsPerPage = 20
    
    // Fetch blog data with category filter
    let featuredPost: BlogPostType | null = null
    let blogPosts: BlogPostType[] = []
    let categories: any[] = []
    let error: string | null = null
    let totalPosts = 0
    
    try {
      const [featured, postsData, cats] = await Promise.all([
        blogService.getFeaturedPost(),
        blogService.getPostsWithPagination(currentPage, postsPerPage, categorySlug),
        blogService.getCategories()
      ])
      
      featuredPost = featured
      blogPosts = postsData.posts
      categories = cats
      totalPosts = postsData.pageInfo.totalCount
    } catch (err) {
      console.error('Error fetching category posts:', err)
      error = 'Gagal memuat data blog'
    }
    
    // Generate structured data for category listing
    const categoryName = getCategoryNameFromSlug(categorySlug);
    const breadcrumbs = [
      { name: 'Beranda', url: `${siteConfig.url}/` },
      { name: 'Blog', url: `${siteConfig.url}/blog/` },
      { name: categoryName, url: `${siteConfig.url}/blog/${categorySlug}/` }
    ]
    
    const structuredData = [
      breadcrumbSchema(breadcrumbs)
    ]
    
    const BlogClient = (await import('@/components/pages/BlogClient')).default
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
          categoryParam={categorySlug}
        />
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
    const canonical = `${siteConfig.url}/blog/${category}/${slug}/`
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
    const canonical = `${siteConfig.url}/blog/${category}/`
    const categoryTitle = getCategoryNameFromSlug(category)
    
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
    `${siteConfig.url}/blog/`,
    `${siteConfig.url}/og-default.jpg`,
    'page'
  )
}