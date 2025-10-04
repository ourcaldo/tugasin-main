"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { Calendar, User, Clock, ArrowRight, BookOpen, Lightbulb, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { IconMapper } from '../ui/icon-mapper';

import SEO from '../layout/SEO';
import { blogService } from '@/lib/cms/blog-service';
import { getCategoryColor, getCategorySlug, getCategoryNameFromSlug } from '@/lib/utils/utils';
import type { BlogPost, BlogCategory } from '@/lib/utils/types';

// Dynamic import for BlogPostCard (not critical for initial load)
const BlogPostCard = dynamic(() => import('../blog/BlogPostCard'), {
  loading: () => (
    <div className="bg-white rounded-lg shadow animate-pulse overflow-hidden">
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
  )
});

export default function Blog() {
  const params = useParams();
  const categoryParam = params?.category as string | undefined;
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);

  // Load blog data from CMS
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
      
      // Filter posts by category if category parameter is provided
      if (categoryParam) {
        const categoryName = getCategoryNameFromSlug(categoryParam);
        const filtered = posts.filter(post => 
          post.category.toLowerCase().replace(/\s+/g, '-') === categoryParam ||
          post.category === categoryName
        );
        setFilteredPosts(filtered);
      } else {
        setFilteredPosts(posts.slice(0, 6)); // Show first 6 posts on main blog page
      }
    } catch (err) {
      // Error handling for blog data loading
      setError('Unable to load blog content. Please check CMS configuration.');
      
      // Set empty data when there's an error
      setFeaturedPost(null);
      setBlogPosts([]);
      setCategories([]);
      setFilteredPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadBlogData();
  }, []);

  // Determine which posts to display
  const postsToDisplay = categoryParam ? filteredPosts : filteredPosts;

  return (
    <div className="min-h-screen">
      <SEO 
        title="Blog - Tugasin.me"
        description="Kumpulan artikel, tips, dan panduan lengkap untuk membantu mahasiswa sukses dalam studi. Dari menulis skripsi hingga manajemen waktu."
        keywords="tips kuliah, panduan skripsi, produktivitas mahasiswa, academic writing, mental health mahasiswa"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Badge variant="secondary">
                Blog Tugasin
              </Badge>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              {categoryParam ? `${getCategoryNameFromSlug(categoryParam)}` : 'Tips & Panduan Akademik'}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {categoryParam 
                ? `Kumpulan artikel dalam kategori ${getCategoryNameFromSlug(categoryParam)}. Temukan tips dan panduan yang sesuai dengan kebutuhan kamu.`
                : 'Kumpulan artikel, tips, dan panduan yang membantu kamu sukses dalam perjalanan akademik. Ditulis oleh para ahli dan praktisi berpengalaman.'
              }
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Error Alert */}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Post */}
            {isLoading ? (
              <div className="mb-12">
                <Card className="overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                    <div className="h-64 md:h-80 bg-gray-200 animate-pulse"></div>
                    <div className="p-6">
                      <div className="h-6 bg-gray-200 rounded mb-3 w-1/3 animate-pulse"></div>
                      <div className="h-8 bg-gray-200 rounded mb-3 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4 w-3/4 animate-pulse"></div>
                      <div className="h-6 bg-gray-200 rounded mb-4 w-2/3 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                </Card>
              </div>
            ) : featuredPost ? (
              <div className="mb-12">
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                    <div className="relative w-full aspect-[16/9]">
                      <Link href={`/blog/${getCategorySlug(featuredPost.category)}/${featuredPost.slug}`}>
                        <ImageWithFallback
                          src={featuredPost.image}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-primary">Featured</Badge>
                      </div>
                    </div>
                    <div className="p-6">
                      <Badge variant="secondary" className={`mb-3 ${getCategoryColor(featuredPost.category)}`}>
                        {featuredPost.category}
                      </Badge>
                      <Link href={`/blog/${getCategorySlug(featuredPost.category)}/${featuredPost.slug}`}>
                        <h2 className="text-2xl font-bold mb-3 line-clamp-2 hover:text-primary transition-colors">
                          {featuredPost.title}
                        </h2>
                      </Link>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {featuredPost.excerpt.replace(/<[^>]*>/g, '').trim()}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <User className="h-4 w-4 mr-1" />
                        <span className="mr-4">{featuredPost.author}</span>
                        <Calendar className="h-4 w-4 mr-1" />
                        <span className="mr-4">{featuredPost.date}</span>
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{featuredPost.readTime}</span>
                      </div>
                      <Button asChild>
                        <Link href={`/blog/${getCategorySlug(featuredPost.category)}/${featuredPost.slug}`}>
                          Baca Selengkapnya
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            ) : null}

            {/* Blog Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="h-48 bg-gray-200 animate-pulse"></div>
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-200 rounded mb-3 w-1/3 animate-pulse"></div>
                      <div className="h-6 bg-gray-200 rounded mb-3 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4 w-3/4 animate-pulse"></div>
                      <div className="h-6 bg-gray-200 rounded mb-4 w-2/3 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    </CardContent>
                  </Card>
                ))
              ) : postsToDisplay.length > 0 ? (
                postsToDisplay.map((post) => (
                  <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative w-full aspect-[16/9]">
                      <Link href={`/blog/${getCategorySlug(post.category)}/${post.slug}`}>
                        <ImageWithFallback
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                    </div>
                    <CardContent className="p-6">
                      <Badge variant="secondary" className={`mb-3 ${getCategoryColor(post.category)}`}>
                        {post.category}
                      </Badge>
                      <Link href={`/blog/${getCategorySlug(post.category)}/${post.slug}`}>
                        <h3 className="text-xl font-semibold mb-3 line-clamp-2 hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                      </Link>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {post.excerpt.replace(/<[^>]*>/g, '').trim()}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <User className="h-4 w-4 mr-1" />
                        <span className="mr-3">{post.author}</span>
                        <Calendar className="h-4 w-4 mr-1" />
                        <span className="mr-3">{post.date}</span>
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{post.readTime}</span>
                      </div>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/blog/${getCategorySlug(post.category)}/${post.slug}`}>
                          Baca Artikel
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : error ? (
                // Show error state when CMS is not available
                <div className="col-span-2">
                  <Card className="p-8 text-center border-red-200 bg-red-50">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-red-800">Blog Content Unavailable</h3>
                    <p className="text-red-600 mb-4">
                      {error}
                    </p>
                    <div className="flex justify-center">
                      <Button asChild variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                        <Link href="/contact">
                          Contact Support
                        </Link>
                      </Button>
                    </div>
                  </Card>
                </div>
              ) : (
                // Show default message when no posts available
                <div className="col-span-2">
                  <Card className="p-8 text-center">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Blog Posts Available</h3>
                    <p className="text-gray-600 mb-4">
                      No blog content is currently available. Please check back later.
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/contact">
                        Contact Us
                      </Link>
                    </Button>
                  </Card>
                </div>
              )}
            </div>

            {/* Load More */}
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Muat Artikel Lainnya
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Categories */}
            <Card className="p-6 mb-8">
              <CardHeader className="p-0 mb-4">
                <h3 className="text-xl font-semibold">Kategori</h3>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="space-y-3">
                  {categories.map((category, index) => (
                    <li key={index}>
                      <Link
                        href={`/blog/${getCategorySlug(category.name)}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="text-gray-500 mr-2">
                            <IconMapper iconName={category.icon} />
                          </div>
                          <span>{category.name}</span>
                        </div>
                        <Badge variant="secondary">{category.count}</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Newsletter */}
            <Card className="p-6 mb-8 bg-primary text-white">
              <CardHeader className="p-0 mb-4">
                <h3 className="text-xl font-semibold">Newsletter</h3>
              </CardHeader>
              <CardContent className="p-0">
                <p className="mb-4 opacity-90">
                  Dapatkan tips dan panduan akademik terbaru langsung di email kamu!
                </p>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Email kamu"
                    className="w-full p-3 rounded-lg text-gray-900"
                  />
                  <Button variant="secondary" className="w-full">
                    Subscribe
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Popular Posts */}
            <Card className="p-6">
              <CardHeader className="p-0 mb-4">
                <h3 className="text-xl font-semibold">Artikel Populer</h3>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="space-y-4">
                  {blogPosts.slice(0, 3).map((post, index) => (
                    <li key={index} className="border-b border-gray-100 pb-4 last:border-0">
                      <Link href={`/blog/${getCategorySlug(post.category)}/${post.slug}`}>
                        <h4 className="font-medium mb-2 line-clamp-2 hover:text-primary cursor-pointer transition-colors">
                          {post.title}
                        </h4>
                      </Link>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{post.date}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}