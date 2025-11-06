import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware for intelligent ISR revalidation and URL standardization
 * Handles dynamic revalidation decisions based on CMS status, content priority, and user context
 * Enforces trailing slash convention for all URLs (except API routes and files)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';
  const isBot = /bot|crawler|spider|crawling/i.test(userAgent);
  
  // Enforce trailing slash for SEO consistency
  // Redirect URLs without trailing slash to the trailing slash version
  const shouldHaveTrailingSlash = 
    pathname !== '/' && // Root path doesn't need trailing slash
    !pathname.startsWith('/api') && // API routes don't need trailing slash
    !pathname.match(/\.[a-zA-Z0-9]+$/) && // Files with extensions (e.g., .xml, .json, .txt)
    !pathname.endsWith('/'); // Already has trailing slash
  
  if (shouldHaveTrailingSlash) {
    const url = request.nextUrl.clone();
    url.pathname = pathname + '/';
    return NextResponse.redirect(url, 301); // 301 Permanent Redirect for SEO
  }
  
  // Handle sitemap-post-[number].xml routing
  const sitemapPostMatch = pathname.match(/^\/sitemap-post-(\d+)\.xml$/);
  if (sitemapPostMatch) {
    const pageNumber = sitemapPostMatch[1];
    const url = request.nextUrl.clone();
    url.pathname = `/api/sitemap-post/${pageNumber}`;
    return NextResponse.rewrite(url);
  }
  
  // Determine content type based on pathname
  let contentType: string | null = null;
  
  if (pathname === '/') {
    contentType = 'homepage';
  } else if (pathname === '/layanan' || pathname === '/layanan/') {
    contentType = 'services';
  } else if (pathname === '/contact' || pathname === '/contact/') {
    contentType = 'contact';
  } else if (pathname === '/blog' || pathname === '/blog/') {
    contentType = 'blog-listing';
  } else if (pathname.startsWith('/blog/')) {
    contentType = 'blog-post';
  } else if (pathname.includes('sitemap')) {
    contentType = 'sitemap';
  }

  // Clone the request headers to add revalidation context
  const requestHeaders = new Headers(request.headers);
  
  if (contentType) {
    // Add basic revalidation context headers for the page to use
    requestHeaders.set('x-content-type', contentType);
    requestHeaders.set('x-is-bot', isBot.toString());
    
    // Set content priority based on content type (simplified)
    const priority = contentType === 'cms-status' ? 'critical' :
                    contentType.startsWith('blog') ? 'high' : 'medium';
    requestHeaders.set('x-content-priority', priority);
    
    // Basic revalidation logic for high-priority content
    if (priority === 'critical' || priority === 'high') {
      requestHeaders.set('x-should-revalidate', 'true');
    }
  }

  // For API routes related to revalidation, add security context
  if (pathname.startsWith('/api/revalidate')) {
    // Add rate limiting context (this could be enhanced with actual rate limiting)
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    requestHeaders.set('x-client-ip', clientIP);
    requestHeaders.set('x-revalidation-request', 'true');
  }

  // Return response with enhanced headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * Configure which paths this middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};