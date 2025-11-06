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

// Force dynamic rendering for redirect support
// Redirects cannot be cached as they need to check real-time redirect configuration
export const dynamic = 'force-dynamic'

export default async function Page({ params, searchParams }: PageProps) {
  const { params: rawParams } = await params
  const searchParamsResolved = await searchParams
  
  // Filter out empty segments caused by trailing slashes
  // e.g., /blog/category/slug/ becomes ['category', 'slug', '']
  // We need to remove the empty string to get proper routing
  const routeParams = rawParams.filter(param => param !== '')
  
  // Schedule intelligent background revalidation for blog posts
  scheduleBackgroundRevalidation('blog-post');
  
  // If we have 2 segments: [category, slug] - show individual post
  if (routeParams.length === 2) {
    const [category, slug] = routeParams
    
    // First, fetch the raw API response to check for redirects (including tombstone pattern)
    // This MUST be outside try-catch because redirect functions throw errors internally
    const rawResponse = await apiClient.getRawPostBySlug(slug)
    
    // Check for tombstone pattern: post not found but redirect exists
    if (!rawResponse.success && rawResponse.redirect) {
      console.log('[BLOG-PAGE] Tombstone redirect detected for:', slug);
      
      const redirectResult = await redirectHandler.handlePostRedirect(
        rawResponse.redirect,
        category
      )
      
      if (redirectResult.shouldRedirect) {
        const httpStatus = redirectResult.httpStatus || 302
        const redirectPath = redirectResult.redirectUrl || '/'
        
        if (httpStatus === 410) {
          console.log('[BLOG-PAGE] Tombstone 410 Gone response');
          return new Response('Gone', {
            status: 410,
            statusText: 'Gone',
            headers: {
              'Content-Type': 'text/plain',
            },
          })
        }
        
        console.log('[BLOG-PAGE] Tombstone redirect to:', redirectPath, 'with status:', httpStatus);
        
        // Use Next.js redirect functions (these throw errors internally to trigger redirect)
        if (httpStatus === 301 || httpStatus === 308) {
          permanentRedirect(redirectPath)
        } else {
          nextRedirect(redirectPath)
        }
      }
    }
    
    // Check if post exists
    if (!rawResponse.success || !rawResponse.data) {
      notFound()
    }
    
    // Check if post has a redirect configured
    console.log('[BLOG-PAGE] Checking for redirect on post:', slug, {
      hasRedirect: !!rawResponse.data.redirect,
      redirectData: rawResponse.data.redirect
    });
    
    const redirectResult = await redirectHandler.handlePostRedirect(
      rawResponse.data.redirect,
      category
    )
    
    console.log('[BLOG-PAGE] Redirect result:', redirectResult);
    
    // If redirect is needed, perform the redirect with proper HTTP status
    if (redirectResult.shouldRedirect) {
      const httpStatus = redirectResult.httpStatus || 302
      
      // Handle 410 Gone - return custom 410 response
      if (httpStatus === 410) {
        console.log('[BLOG-PAGE] Returning 410 Gone response');
        return new Response('Gone', {
          status: 410,
          statusText: 'Gone',
          headers: {
            'Content-Type': 'text/plain',
          },
        })
      }
      
      // Build redirect URL (relative path only, Next.js handles absolute URLs)
      const redirectPath = redirectResult.redirectUrl || '/'
      
      console.log('[BLOG-PAGE] Performing redirect:', {
        from: `/blog/${category}/${slug}`,
        to: redirectPath,
        httpStatus
      });
      
      // Use Next.js redirect functions for proper server-side redirects
      // These work correctly with App Router and throw errors internally to stop execution
      if (httpStatus === 301 || httpStatus === 308) {
        permanentRedirect(redirectPath)
      } else {
        nextRedirect(redirectPath)
      }
    }
    
    console.log('[BLOG-PAGE] No redirect needed, continuing with normal render');
    
    // Fetch blog post data on the server for faster loading
    let post: BlogPostType | null = null
    let relatedPosts: BlogPostType[] = []
    let error: string | null = null
    
    try {
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
  const { params: rawParams } = await params
  
  // Filter out empty segments caused by trailing slashes (same as in Page component)
  const routeParams = rawParams.filter(param => param !== '')
  
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