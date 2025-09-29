"use client";

import { useState, useEffect } from 'react';
import { blogService } from '@/lib/cms/blog-service';
import type { BlogPost, BlogCategory } from '@/lib/utils/types';

export interface UseBlogReturn {
  featuredPost: BlogPost | null;
  blogPosts: BlogPost[];
  categories: BlogCategory[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  isRefreshing: boolean;
}

export function useBlog(): UseBlogReturn {
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadBlogData = async (forceRefresh: boolean = false) => {
    try {
      setError(null);
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const [featured, posts, cats] = await Promise.all([
        blogService.getFeaturedPost(),
        blogService.getRecentPosts(10),
        blogService.getCategories()
      ]);

      setFeaturedPost(featured);
      setBlogPosts(posts);
      setCategories(cats);
    } catch (err) {
      setError('Gagal memuat data blog dari CMS');
      
      // Set empty data when CMS fails
      setFeaturedPost(null);
      setBlogPosts([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const refresh = () => {
    blogService.clearCache();
    loadBlogData(true);
  };

  useEffect(() => {
    loadBlogData();
  }, []);

  return {
    featuredPost,
    blogPosts,
    categories,
    isLoading,
    error,
    refresh,
    isRefreshing
  };
}

export function useRecentPosts(limit: number = 3): {
  posts: BlogPost[];
  isLoading: boolean;
  error: string | null;
} {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setError(null);
        const recentPosts = await blogService.getRecentPosts(limit);
        setPosts(recentPosts);
      } catch (err) {
          setError('Gagal memuat artikel terbaru');
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, [limit]);

  return { posts, isLoading, error };
}