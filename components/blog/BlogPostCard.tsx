import { User, Calendar, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { getCategoryColor } from '@/lib/utils/utils';
import type { BlogPost } from '@/lib/utils/types';

interface BlogPostCardProps {
  post: BlogPost;
  featured?: boolean;
}

export default function BlogPostCard({ post, featured = false }: BlogPostCardProps) {
  const categorySlug = post.category.toLowerCase().replace(/\s+/g, '-');
  const postUrl = `/blog/${categorySlug}/${post.slug}/` as const;

  if (featured) {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="relative w-full aspect-[16/9]">
            <Link href={postUrl}>
              <ImageWithFallback
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </Link>
            <div className="absolute top-4 left-4">
              <Badge className="bg-primary">Featured</Badge>
            </div>
          </div>
          <div className="p-6">
            <Badge variant="secondary" className={`mb-3 ${getCategoryColor(post.category)}`}>
              {post.category}
            </Badge>
            <Link href={postUrl}>
              <h2 className="text-2xl font-bold mb-3 line-clamp-2 hover:text-primary transition-colors">
                {post.title}
              </h2>
            </Link>
            <p className="text-gray-600 mb-4 line-clamp-3">
              {post.excerpt.replace(/<[^>]*>/g, '').trim()}
            </p>
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <User className="h-4 w-4 mr-1" />
              <span className="mr-4">{post.author}</span>
              <Calendar className="h-4 w-4 mr-1" />
              <span className="mr-4">{post.date}</span>
              <Clock className="h-4 w-4 mr-1" />
              <span>{post.readTime}</span>
            </div>
            <Button asChild>
              <Link href={postUrl}>
                Baca Selengkapnya
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative w-full aspect-[16/9]">
        <Link href={postUrl}>
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
        <Link href={postUrl}>
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
          <Link href={postUrl}>
            Baca Artikel
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}