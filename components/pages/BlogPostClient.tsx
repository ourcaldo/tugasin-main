"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, Tag, User, ArrowLeft, Share2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '../ui/breadcrumb';
import { TableOfContents } from '../ui/table-of-contents';
import SEO from '@/components/layout/SEO';
import { sanitizeContent } from '@/lib/cms/sanitizer';
import { getCategoryNameFromSlug, getCategorySlug } from '@/lib/utils/utils';
import type { BlogPost as BlogPostType } from '@/lib/utils/types';

interface BlogPostClientProps {
  post: BlogPostType;
  relatedPosts: BlogPostType[];
  categoryParam: string;
}

export default function BlogPostClient({ post, relatedPosts, categoryParam }: BlogPostClientProps) {
  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else if (post) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title={`${post.title} - Tugasin.me`}
        description={post.seo?.description || post.excerpt}
        keywords={post.seo?.focusKeywords?.join(', ')}
        image={post.image}
      />
      
      {/* Article content - full width */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Beranda</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/blog">Blog</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {categoryParam && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/blog/${categoryParam}`}>{getCategoryNameFromSlug(categoryParam)}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{post.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        {/* Back button */}
        <Button 
          variant="ghost" 
          asChild 
          className="mt-4 mb-6 -ml-2 hover:bg-gray-100"
        >
          <Link href={categoryParam ? `/blog/${categoryParam}` : '/blog'}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Blog
          </Link>
        </Button>

        {/* Article header */}
        <header className="mb-8">
          {/* Category badge */}
          <Badge variant="secondary" className="mb-4">
            {post.category}
          </Badge>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta information */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-8">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              {post.author}
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              {post.date}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              {post.readTime}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleShare}
              className="ml-auto"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Bagikan
            </Button>
          </div>

          {/* Featured image - full width */}
          <div className="mb-8 relative w-full aspect-[16/9]">
            <Image 
              src={post.image} 
              alt={post.title}
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
              priority
            />
          </div>
        </header>

        {/* Table of Contents */}
        <div className="mb-8">
          <TableOfContents content={post.content || post.excerpt} />
        </div>

        {/* Content */}
        <div 
          className="prose prose-lg prose-gray max-w-none mb-8 overflow-visible w-full"
          style={{
            minHeight: 'auto',
            height: 'auto',
            maxHeight: 'none',
            overflow: 'visible',
            maxWidth: 'none',
            width: '100%'
          }}
          dangerouslySetInnerHTML={{ 
            // Defense-in-depth: Additional sanitization at component level
            // Content is already sanitized at service layer, but we add extra protection
            __html: sanitizeContent(post.content || post.excerpt || '') 
          }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <div className="flex items-start gap-2">
              <Tag className="h-4 w-4 mt-1 text-gray-500" />
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </article>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Artikel Terkait
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost) => (
              <Card key={relatedPost.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <Link href={`/blog/${categoryParam || 'uncategorized'}/${relatedPost.slug}`}>
                    <div className="relative w-full aspect-[16/9] mb-3">
                      <Image 
                        src={relatedPost.image} 
                        alt={relatedPost.title}
                        fill
                        className="object-cover rounded"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                      />
                    </div>
                    <Badge variant="secondary" className="text-xs mb-2">
                      {relatedPost.category}
                    </Badge>
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2 hover:text-primary">
                      {relatedPost.title}
                    </h3>
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {relatedPost.date}
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold mb-4">
              Butuh Bantuan dengan Tugas atau Skripsi?
            </h3>
            <p className="mb-6 opacity-90">
              Tim ahli kami siap membantu Anda menyelesaikan tugas akademik dengan kualitas terbaik. 
              Dapatkan bantuan profesional untuk skripsi, tesis, dan berbagai jenis tugas kuliah.
            </p>
            <Button asChild variant="secondary" size="lg">
              <Link href="/contact">
                Konsultasi Gratis Sekarang
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}