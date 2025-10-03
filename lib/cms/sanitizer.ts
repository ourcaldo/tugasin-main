/**
 * Content Sanitization Module
 * Provides secure HTML sanitization for CMS content using DOMPurify
 * Prevents XSS attacks by stripping dangerous HTML elements and attributes
 */

// Edge runtime compatible DOMPurify import
let DOMPurify: any;
try {
  // Only import DOMPurify in environments where it's supported
  if (typeof window !== 'undefined' || typeof global !== 'undefined') {
    const { createDOMPurify } = require('isomorphic-dompurify');
    DOMPurify = createDOMPurify();
  } else {
    throw new Error('Not supported in edge runtime');
  }
} catch {
  // Fallback sanitizer for edge runtime
  DOMPurify = {
    sanitize: (input: string, config?: any) => {
      // Basic server-side sanitization - strip script tags and dangerous attributes
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/data:text\/html/gi, '');
    }
  };
}

/**
 * Configuration for allowed HTML tags and attributes
 * Based on production security requirements
 */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
    'a', 'img', 'blockquote', 'code', 'pre'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'class', 'id', 'title',
    'target', 'rel'
  ],
  ALLOW_DATA_ATTR: false,
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - Raw HTML content from CMS
 * @returns Sanitized HTML safe for rendering
 */
export const sanitizeContent = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
};

/**
 * Sanitizes plain text content by escaping HTML entities
 * Only use for text that will be inserted into HTML via innerHTML
 * For React-rendered text, use cleanText() instead
 * @param text - Plain text content
 * @returns Escaped text safe for HTML rendering
 */
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

/**
 * Cleans text without HTML encoding (for React-rendered content)
 * React automatically escapes text, so we only need to strip dangerous chars
 * @param text - Plain text content
 * @returns Cleaned text safe for React rendering
 */
export const cleanText = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Only remove script injection attempts, let React handle the rest
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

/**
 * Validates and sanitizes URL for safe usage
 * @param url - URL to validate and sanitize
 * @returns Safe URL or empty string if invalid
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Remove any leading/trailing whitespace
  const cleanUrl = url.trim();

  // Check if URL is safe (http/https/mailto or relative)
  if (SANITIZE_CONFIG.ALLOWED_URI_REGEXP.test(cleanUrl)) {
    return cleanUrl;
  }

  return '';
};

/**
 * Sanitizes blog post content including title, excerpt, and body
 * @param post - Blog post object with content fields
 * @returns Sanitized blog post object
 */
export const sanitizeBlogPost = (post: any): any => {
  if (!post || typeof post !== 'object') {
    return null;
  }

  return {
    ...post,
    title: sanitizeText(post.title || ''),
    excerpt: sanitizeText(post.excerpt || ''),
    content: sanitizeContent(post.content || ''),
    author: post.author ? {
      ...post.author,
      name: sanitizeText(post.author.name || ''),
      bio: sanitizeContent(post.author.bio || '')
    } : null,
    tags: Array.isArray(post.tags) 
      ? post.tags.map((tag: any) => sanitizeText(tag?.name || tag || ''))
      : [],
    featuredImage: post.featuredImage ? {
      ...post.featuredImage,
      url: sanitizeUrl(post.featuredImage.url || ''),
      alt: sanitizeText(post.featuredImage.alt || '')
    } : null
  };
};

/**
 * Validates that DOMPurify is properly initialized
 * Should be called during application startup
 */
export const validateSanitizer = (): boolean => {
  try {
    const testHtml = '<script>alert("test")</script><p>Safe content</p>';
    const sanitized = DOMPurify.sanitize(testHtml);
    
    // Should remove script tag but keep p tag
    return !sanitized.includes('script') && sanitized.includes('<p>');
  } catch (error) {
    console.error('DOMPurify validation failed:', error);
    return false;
  }
};