"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, User, Clock, ArrowRight, BookOpen, Lightbulb, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { IconMapper } from '../ui/icon-mapper';
import BlogPostCard from '../blog/BlogPostCard';

import SEO from '../layout/SEO';
import { blogService } from '@/lib/cms/blog-service';
import type { BlogPost, BlogCategory } from '@/lib/utils/types';

interface BlogClientProps {
  initialFeaturedPost: BlogPost | null;
  initialBlogPosts: BlogPost[];
  initialCategories: BlogCategory[];
  initialError: string | null;
  currentPage?: number;
  totalPages?: number;
  postsPerPage?: number;
}

export default function BlogClient({ 
  initialFeaturedPost, 
  initialBlogPosts, 
  initialCategories, 
  initialError,
  currentPage = 1,
  totalPages = 1,
  postsPerPage = 20
}: BlogClientProps) {
  const params = useParams();
  const router = useRouter();
  const categoryParam = params?.category as string | undefined;
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(initialFeaturedPost);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialBlogPosts);
  const [categories, setCategories] = useState<BlogCategory[]>(initialCategories);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);

  // Prefetch next page for faster navigation
  useEffect(() => {
    if (!categoryParam && currentPage < totalPages) {
      const nextPage = currentPage + 1;
      const nextPageUrl = nextPage === 1 ? '/blog' : `/blog?page=${nextPage}`;
      // Prefetch the next page route (cast to any to handle Next.js 15 strict typing)
      router.prefetch(nextPageUrl as any);
    }
  }, [currentPage, totalPages, categoryParam, router]);

  // Load blog data from CMS (for client-side refresh only)
  const loadBlogData = async (forceRefresh: boolean = false) => {
    try {
      setError(null);
      setIsLoading(true);

      // Try CMS first, if offline use cache
      const [featured, posts, cats] = await Promise.all([
        blogService.getFeaturedPost(),
        blogService.getRecentPosts(50), // Get more posts for filtering  
        blogService.getCategories()
      ]);

      setFeaturedPost(featured);
      setBlogPosts(posts);
      setCategories(cats);
    } catch (err) {
      setError('Gagal memuat data blog dari CMS');
      
      // Keep existing data if refresh fails
      if (!featuredPost && !blogPosts.length) {
        setFeaturedPost(null);
        setBlogPosts([]);
        setCategories([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Filter posts based on category parameter
  useEffect(() => {
    if (categoryParam && blogPosts.length > 0) {
      const getCategoryNameFromSlug = (slug: string) => {
        const categoryMap: Record<string, string> = {
          'panduan-skripsi': 'Panduan Skripsi',
          'tips-produktivitas': 'Tips Produktivitas',
          'metodologi': 'Metodologi',
          'academic-writing': 'Academic Writing',
          'mental-health': 'Mental Health',
          'manajemen-waktu': 'Manajemen Waktu',
          'presentasi': 'Presentasi',
          'edukasi': 'Edukasi'
        };
        return categoryMap[slug] || slug;
      };

      const categoryName = getCategoryNameFromSlug(categoryParam);
      const filtered = blogPosts.filter(post => 
        post.category.toLowerCase() === categoryName.toLowerCase()
      );
      setFilteredPosts(filtered);
    } else {
      setFilteredPosts(blogPosts);
    }
  }, [categoryParam, blogPosts]);

  const displayPosts = filteredPosts;

  // Get current category name for display
  const getCategoryDisplayName = (slug: string) => {
    const categoryMap: Record<string, string> = {
      'panduan-skripsi': 'Panduan Skripsi',
      'tips-produktivitas': 'Tips Produktivitas', 
      'metodologi': 'Metodologi',
      'academic-writing': 'Academic Writing',
      'mental-health': 'Mental Health',
      'manajemen-waktu': 'Manajemen Waktu',
      'presentasi': 'Presentasi',
      'edukasi': 'Edukasi'
    };
    return categoryMap[slug] || slug;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Blog & Tips Akademik - Tugasin"
        description="Artikel dan tips seputar dunia akademik, strategi mengerjakan tugas, dan panduan penelitian untuk mahasiswa."
        keywords="blog akademik, tips kuliah, panduan skripsi, strategi belajar"
      />
      
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <p className="text-primary font-medium mb-4">Blog Tugasin</p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {categoryParam ? getCategoryDisplayName(categoryParam) : 'Tips & Panduan Akademik'}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {categoryParam 
                ? `Artikel terpilih dalam kategori ${getCategoryDisplayName(categoryParam)} untuk membantu perjalanan akademik Anda.`
                : 'Kumpulan artikel, tips, dan panduan yang membantu kamu sukses dalam perjalanan akademik. Ditulis oleh para ahli dan praktisi berpengalaman.'
              }
            </p>
            
            {/* Back to all categories button if viewing specific category */}
            {categoryParam && (
              <div className="mt-8">
                <Button asChild variant="outline">
                  <Link href="/blog">
                    <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                    Lihat Semua Artikel
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Error State */}
            {error && (
              <Card className="mb-8 border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                    <div>
                      <h3 className="font-semibold text-red-800">Terjadi Kesalahan</h3>
                      <p className="text-red-600 mt-1">{error}</p>
                      <Button 
                        onClick={() => loadBlogData(true)} 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Memuat...' : 'Coba Lagi'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Featured Post (only show on main blog page) */}
            {!categoryParam && featuredPost && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Artikel Unggulan</h2>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="md:flex">
                    <div className="md:w-1/2">
                      <div className="relative h-64 md:h-full">
                        <ImageWithFallback
                          src={featuredPost.image}
                          alt={featuredPost.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          priority
                        />
                      </div>
                    </div>
                    <div className="md:w-1/2 p-8">
                      <Badge variant="secondary" className="mb-4">
                        {featuredPost.category}
                      </Badge>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4 line-clamp-2">
                        {featuredPost.title}
                      </h3>
                      <p className="text-gray-600 mb-6 line-clamp-3">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 mb-6 space-x-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {featuredPost.author}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {featuredPost.date}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {featuredPost.readTime}
                        </div>
                      </div>
                      <Button asChild>
                        <Link href={`/blog/${featuredPost.category.toLowerCase().replace(/\s+/g, '-')}/${featuredPost.slug}`}>
                          Baca Artikel
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Blog Posts Grid */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {categoryParam ? `Artikel ${getCategoryDisplayName(categoryParam)}` : 'Artikel Terbaru'}
              </h2>
              
              {isLoading ? (
                <div className="grid md:grid-cols-2 gap-8">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="bg-white rounded-lg shadow animate-pulse overflow-hidden">
                      <div className="h-48 bg-gray-200"></div>
                      <div className="p-6">
                        <div className="h-4 bg-gray-200 rounded mb-3 w-1/3"></div>
                        <div className="h-6 bg-gray-200 rounded mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                        <div className="h-10 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayPosts.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-8">
                  {displayPosts.map((post) => (
                    <BlogPostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {categoryParam ? 'Belum Ada Artikel' : 'Artikel Sedang Disiapkan'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {categoryParam 
                      ? `Belum ada artikel dalam kategori ${getCategoryDisplayName(categoryParam)}.`
                      : 'Tim kami sedang menyiapkan artikel-artikel berkualitas untuk Anda.'
                    }
                  </p>
                  {categoryParam && (
                    <Button asChild variant="outline">
                      <Link href="/blog">
                        Lihat Semua Artikel
                      </Link>
                    </Button>
                  )}
                </Card>
              )}
            </div>

            {/* Pagination */}
            {!categoryParam && totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <Button
                  asChild
                  variant="outline"
                  disabled={currentPage === 1}
                >
                  {currentPage === 1 ? (
                    <span className="cursor-not-allowed opacity-50">Previous</span>
                  ) : currentPage === 2 ? (
                    <Link href="/blog" prefetch={true}>Previous</Link>
                  ) : (
                    <Link href={`/blog?page=${currentPage - 1}`} prefetch={true}>Previous</Link>
                  )}
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, index, array) => {
                    const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                    
                    return (
                      <React.Fragment key={page}>
                        {showEllipsisBefore && (
                          <span className="px-2 text-gray-500">...</span>
                        )}
                        <Button
                          asChild
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                        >
                          {page === 1 ? (
                            <Link href="/blog" prefetch={true}>{page}</Link>
                          ) : (
                            <Link href={`/blog?page=${page}`} prefetch={true}>{page}</Link>
                          )}
                        </Button>
                      </React.Fragment>
                    );
                  })}

                <Button
                  asChild
                  variant="outline"
                  disabled={currentPage === totalPages}
                >
                  {currentPage === totalPages ? (
                    <span className="cursor-not-allowed opacity-50">Next</span>
                  ) : (
                    <Link href={`/blog?page=${currentPage + 1}`} prefetch={true}>Next</Link>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Categories */}
            <Card className="mb-8">
              <CardHeader>
                <h3 className="text-lg font-semibold">Kategori</h3>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <Link
                      key={category.name}
                      href={`/blog/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                        categoryParam === category.name.toLowerCase().replace(/\s+/g, '-') 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <IconMapper 
                          iconName={category.icon} 
                          className="h-4 w-4 mr-3" 
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {category.count}
                      </Badge>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">Kategori tidak tersedia</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Newsletter */}
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3">Newsletter</h3>
                <p className="text-sm opacity-90 mb-4">
                  Dapatkan tips akademik terbaru langsung di email Anda setiap minggu.
                </p>
                <Button asChild variant="secondary" size="sm" className="w-full">
                  <Link href="/contact">
                    Berlangganan Sekarang
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}