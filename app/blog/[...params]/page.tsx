import Blog from '@/components/pages/Blog'
import BlogPostClient from '@/components/pages/BlogPostClient'
import { notFound } from 'next/navigation'
import { generateMetadata as genMetadata } from '@/lib/seo/metadata'
import { articleSchema, breadcrumbSchema, generateStructuredDataScript } from '@/lib/seo/structured-data'
import { siteConfig } from '@/config/site'
import { getRevalidationForPageType, scheduleBackgroundRevalidation } from '@/lib/cache/isr-revalidation'
import { blogService } from '@/lib/cms/blog-service'
import type { BlogPost as BlogPostType } from '@/lib/utils/types'

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
    
    // Fetch blog post data on the server for faster loading
    let post: BlogPostType | null = null
    let relatedPosts: BlogPostType[] = []
    let error: string | null = null
    
    try {
      // Fetch the main post
      post = await blogService.getPostBySlug(slug)
      
      if (!post) {
        notFound()
      }
      
      // Fetch related posts by category - limited query, no fetching all posts
      const categoryPosts = await blogService.getPostsByCategory(post.category, 4)
      relatedPosts = categoryPosts.filter((p: BlogPostType) => p.id !== post!.id).slice(0, 3)
        
    } catch (err) {
      console.error('Error fetching blog post:', err)
      error = 'Gagal memuat artikel'
    }
    
    if (error || !post) {
      notFound()
    }
    
    // Generate structured data for blog post
    const breadcrumbs = [
      { name: 'Beranda', url: `${siteConfig.url}/` },
      { name: 'Blog', url: `${siteConfig.url}/blog/` },
      { name: category, url: `${siteConfig.url}/blog/${category}/` },
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
    
    // Fetch blog data with category filter
    let featuredPost: BlogPostType | null = null
    let blogPosts: BlogPostType[] = []
    let categories: any[] = []
    let error: string | null = null
    let totalPosts = 0
    
    try {
      const [featured, postsData, cats] = await Promise.all([
        blogService.getFeaturedPost(),
        blogService.getPostsWithPagination(1, 20, categorySlug),
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
    const breadcrumbs = [
      { name: 'Beranda', url: `${siteConfig.url}/` },
      { name: 'Blog', url: `${siteConfig.url}/blog/` },
      { name: categorySlug, url: `${siteConfig.url}/blog/${categorySlug}/` }
    ]
    
    const structuredData = [
      breadcrumbSchema(breadcrumbs)
    ]
    
    const BlogClient = (await import('@/components/pages/BlogClient')).default
    const totalPages = Math.ceil(totalPosts / 20)

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
          currentPage={1}
          totalPages={totalPages}
          postsPerPage={20}
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
    `${siteConfig.url}/blog/`,
    `${siteConfig.url}/og-default.jpg`,
    'page'
  )
}