# Tugasin - Production-Ready Website

## Overview
This is a Next.js 15 + TypeScript application for Tugasin, an academic assistance service. The application uses Next.js App Router with modern React patterns and shadcn/ui components.

## Recent Changes
- **2025-10-25**: ✅ **UX ENHANCEMENTS - FAQ & SUPPLEMENTAL CONTENT ADDITIONS**
  - **New Components**: Created reusable FAQ and SupplementalContent components for better content organization
    - `components/shared/FAQ.tsx` - Accordion-based FAQ component with customizable title and description
    - `components/shared/SupplementalContent.tsx` - Expandable content section with "Read More" functionality (shows 20% preview with gradient shadow, SEO-friendly with full content in noscript tag)
  - **Homepage Updates** (`components/pages/Homepage.tsx`):
    - Changed hero headline from "Stress Tugas? Serahkan ke Tugasin!" to "Tugas numpuk bikin stress? Serahin aja ke Tugasin!" for better engagement
    - Added FAQ section before blog preview section for improved information accessibility
    - Added supplemental content section after blog preview and before CTA section with detailed service information
  - **Layanan Page Updates** (`components/pages/Layanan.tsx`):
    - Added FAQ section after "Kenapa Tugasin Berbeda?" section
    - Added supplemental content section with comprehensive service details and pricing information
  - **Services Section Enhancement** (`components/sections/ServicesSection.tsx`):
    - Changed button text from "Pesan Sekarang" to "Konsultasi Sekarang" for clearer call-to-action
    - Updated button to link to WhatsApp URL from environment variable (NEXT_PUBLIC_WHATSAPP_URL)
    - Added MessageCircle icon to button for better visual communication
    - Button now opens in new tab with proper rel attributes for security
  - **Data Layer**: Created `data/supplemental.tsx` with HOMEPAGE_SUPPLEMENTAL_CONTENT and LAYANAN_SUPPLEMENTAL_CONTENT for maintainable content management
  - **SEO Improvements**: Supplemental content rendered in full for search engines while maintaining clean UX with expand/collapse functionality
  - **Accessibility**: All new sections follow existing design patterns with proper semantic HTML and ARIA support

- **2025-10-17**: ✅ **SITEMAP BUILD ERROR FIX**
  - **Issue Fixed**: Build failing with "Cannot destructure property 'id' of '(intermediate value)' as it is undefined"
  - **Root Cause**: Dynamic sitemap route `sitemap-post-[id].xml` lacked generateStaticParams() and tried to statically generate at build time
  - **Solution**: Updated `app/sitemap-post-[id].xml/route.ts`:
    - Added `generateStaticParams()` returning empty array to prevent build-time generation
    - Added `export const dynamic = 'force-dynamic'` to force dynamic rendering
    - Added null checks for params before destructuring to handle edge cases
  - **Impact**: Build now completes successfully without sitemap errors
  - **Testing**: Verified no regressions to sitemap functionality

- **2025-10-17**: ✅ **BLOG POST LIST RENDERING FIX**
  - **Issue Fixed**: Blog posts weren't displaying bullet points and numbering for lists (ul/ol elements)
  - **Root Cause**: CSS was missing `list-style-type` property for `.prose ul` and `.prose ol` elements
  - **Solution**: Added proper list styling to `styles/globals.css`:
    - `list-style-type: disc` for unordered lists (ul)
    - `list-style-type: decimal` for ordered lists (ol)
    - `list-style-position: outside` for proper marker positioning
    - `display: list-item` on li elements to guard against upstream overrides
  - **Backend Verification**: Confirmed CMS sends list HTML correctly and sanitizer preserves ul, ol, li tags
  - **Testing**: Recommended to smoke-test blog posts with nested lists in production

- **2025-10-04**: ✅ **ANALYTICS VERIFICATION & DOCKER BUILD FIX**
  - **Analytics Status**: Verified all three analytics services working correctly in Replit environment:
    - GA4 (G-15MHZ6EXEN): ✅ Initialized and tracking events successfully
    - PostHog: ✅ Initialized with debug mode, capturing page views and interactions
    - Sentry: ✅ Error monitoring active with proper breadcrumb tracking
  - **Error Investigation**: The "GA4: gtag function not available" error does NOT exist in current codebase
    - Error was likely from old cached production build (tugasin.me)
    - Current implementation properly loads gtag script and initializes before use
    - Browser console shows "GA4: Script loaded successfully for G-15MHZ6EXEN" ✅
  - **Docker Build Fix**: Fixed GitHub Actions Docker build failure
    - Added `package-lock.json` to repository (required by `npm ci` in Dockerfile)
    - File was generated during npm install and needs to be committed to version control
  - **Implementation Confirmation**: Current analytics setup uses industry-standard GetAnalytics.io
    - Unified API for all analytics providers (standardized approach ✅)
    - Type-safe hooks: `useAnalytics()`, `useTrackInteraction()`, `useBusinessTracking()`
    - Custom plugins for each service in `lib/analytics/plugins/`
    - Centralized configuration in `lib/analytics/config.ts`

- **2025-10-04**: ✅ **GETANALYTICS.IO MIGRATION - UNIFIED ANALYTICS FRAMEWORK**
  - **Analytics Migration**: Migrated from manual analytics implementation to GetAnalytics.io library
  - **Unified API**: Centralized GA4, PostHog, and Sentry tracking under single Analytics API
  - **Custom Plugins**: Created custom plugins for GA4, PostHog, and Sentry integration
    - `lib/analytics/plugins/ga4-plugin.ts` - Google Analytics 4 plugin with proper gtag initialization
    - `lib/analytics/plugins/posthog-plugin.ts` - PostHog analytics plugin
    - `lib/analytics/plugins/sentry-plugin.ts` - Sentry error monitoring plugin
  - **Error Fix**: Resolved "gtag is not a function" error by implementing proper GA4 script loading
  - **Legacy Cleanup**: Removed old gtag.ts and posthog.ts files that were causing "trackEvent is not defined" errors
  - **Analytics Config**: Centralized configuration in `lib/analytics/config.ts` with debug mode for development
  - **Provider Setup**: AnalyticsProvider in app/providers.tsx wraps entire application
  - **Web Vitals**: Integrated Core Web Vitals monitoring with both GetAnalytics and PostHog
  - **Services Working**: All three analytics services (GA4: G-15MHZ6EXEN, PostHog, Sentry) verified functional

- **2025-10-04**: ✅ **DOCKER CONTAINERIZATION & SITEMAP PERFORMANCE OPTIMIZATION**
  - **Sitemap Performance Fix**: Reduced generation time from 17-22s to 2-5s (first request) and <100ms (cached)
  - **Single API Request**: Changed from 10-50 paginated API calls to 1 non-paginated request fetching all posts
  - **Memory Caching**: Implemented 24-hour memory cache for sitemap data with SITEMAP_POSTS cache key
  - **Docker Setup**: Created multi-stage Dockerfile with Node 20 Alpine for optimized production builds
  - **GitHub Actions**: Added automated CI/CD workflow for publishing to GitHub Container Registry (GHCR)
  - **Standalone Output**: Enabled Next.js standalone output for Docker containerization
  - **Environment Setup**: Automated .env.example to .env copy during Docker build process
  - **Docker Ignore**: Added comprehensive .dockerignore for optimized build context

- **2025-10-03**: ✅ **BLOG UX IMPROVEMENTS - PAGINATION, CATEGORY FILTERING & URL STRUCTURE**
  - **Pagination Scroll Fix**: Added automatic scroll-to-top when page changes for better UX
  - **API-Level Category Filtering**: Replaced client-side filtering with REST API `?category=` parameter
  - **URL Trailing Slashes**: Enabled trailing slashes in next.config.js and updated all URLs throughout the app
  - **Category Support in Blog Service**: Updated `getPosts()` and `getPostsWithPagination()` to accept optional category parameter
  - **Category Page Integration**: Updated `/blog/[category]/` to use BlogClient with API-filtered posts
  - **Author Update**: Changed default author from "Admin" to "Tugasin" for proper branding
  - **Consistent URL Format**: All blog URLs now follow `/blog/`, `/blog/?page=2`, `/blog/{category}/`, `/blog/{category}/{slug}/` pattern
  - **BlogPostCard Fix**: Updated to use proper category-based URL structure with trailing slashes

- **2025-10-03**: ✅ **PERFORMANCE OPTIMIZATION - REMOVED IMPORT WARNINGS & FIXED BLOG GLITCHING**
  - **Webpack Configuration**: Suppressed annoying Prisma/Sentry instrumentation import trace warnings in console
  - **Blog Performance Fix**: Removed dynamic import of BlogPostCard component that was causing content glitching
  - **Clean Console**: Development server now runs without repetitive critical dependency warnings
  - **Improved UX**: Blog posts now render immediately without skeleton loading state causing visual jumps
  - **ISR Confirmation**: Page 1 uses ISR with 24-hour revalidation, pages 2+ use dynamic rendering with cache
  - **Skeleton Loading**: Replaced spinner loading.tsx with proper skeleton UI for better UX
  - **Debug Logging**: Added comprehensive server-side logging to track blog data fetching performance
  - **Layout Fix**: Removed dynamic Footer import to fix chunk loading timeout errors
  - **Client State Fix**: Fixed filteredPosts initialization to prevent empty state flash on initial render

- **2025-10-03**: ✅ **API V1 MIGRATION - REST API WITH PAGE-BASED PAGINATION**
  - **API Endpoint Migration**: Migrated from `/api/public/posts` to `/api/v1/posts` REST API
  - **Pagination Change**: Replaced cursor-based pagination with page/limit query parameters
  - **GraphQL Removal**: Completely removed all GraphQL terminology and references
  - **New API Client**: Created `api-client.ts` to replace `graphql.ts`
  - **Response Structure**: Updated to use new API response format with `success`, `data`, `pagination` objects
  - **Pagination Object**: Now uses `page`, `limit`, `total`, `totalPages`, `hasNextPage`, `hasPrevPage` from API
  - **Blog Service**: Updated all methods to use page-based pagination instead of cursor-based
  - **Sitemap**: Updated to fetch posts using page-based pagination (100 posts per page)
  - **Token Auth**: Maintained Bearer token authorization from `.env` (CMS_TOKEN)
  - **Consistent Flow**: Blog archive and sitemap now use the same API pagination mechanism

- **2025-09-30**: ✅ **QUERY PARAMETER PAGINATION WITH ISR + PREFETCH**
  - **Pagination Route Change**: Migrated from `/blog/page/x` to `/blog?page=x` using query parameters
  - **Hybrid Rendering Strategy**: 
    - Page 1 (`/blog`) uses ISR with 24-hour revalidation for build-time caching
    - Pages 2+ (`/blog?page=2`, etc.) use dynamic rendering with server-side caching
  - **Cursor-Based Pagination**: Added `getPostsWithPagination()` method for proper GraphQL cursor pagination
  - **Prefetch Implementation**: 
    - Link components use `prefetch={true}` for automatic route prefetching
    - `router.prefetch()` in useEffect to preload next page when current page loads
  - **CMS Integration**: Maintains 24-hour cache for sitemap data (getAllPostsForSitemap fetches 1000 posts/batch)
  - **Performance**: Page 1 ~30s initial (ISR), subsequent pages ~1.3s (dynamic with cache)
  - **Deleted**: Removed old `/blog/page/[page]` static route structure

- **2025-09-30**: ✅ **ISR-ONLY BLOG & SITEMAP IMPLEMENTATION** (SUPERSEDED by query param approach)
  - **Blog ISR Implementation**: Changed blog from dynamic to ISR with 24-hour revalidation (revalidate = 86400)
  - **Sitemap ISR**: Updated all sitemaps to use 24-hour ISR (revalidate = 86400)
  - **CMS Batch Fetching**: getAllPostsForSitemap() fetches 1000 posts per batch until hasNextPage is false

- **2025-09-28**: ✅ **PHASE 1 COMPLETE** - Production-Ready Framework Migration
  - **File Structure Migration**: Successfully moved from src/ to root-level structure (components/, lib/, styles/, data/)
  - **App Router Implementation**: Created loading.tsx, not-found.tsx, sitemap.ts for Next.js 15.5.4 App Router
  - **Config Directory Setup**: Established config/ with cms.ts, constants.ts, site.ts for centralized configuration
  - **Environment Migration**: Updated all VITE_ variables to NEXT_PUBLIC_ prefixes for Next.js compatibility
  - **Component Reorganization**: Structured components into layout/, ui/, blog/, services/, shared/ directories
  - **Lib Reorganization**: Organized lib into cms/, seo/, utils/, hooks/ for better maintainability
  - **TypeScript Configuration**: Updated tsconfig.json path aliases to reference new root-level structure
  - **Import Resolution**: Fixed all import statements throughout codebase to use @/ paths
  - **Zero LSP Diagnostics**: All TypeScript errors resolved, application compiles successfully
  - **Production Ready**: Next.js Fast Refresh enabled, proper CORS configuration, serving on port 5000
  - **Architect Review Passed**: All Phase 1 requirements verified and confirmed complete

## Architecture
- **Frontend**: Next.js 15 with React 18 and TypeScript
- **Build Tool**: Next.js with Turbopack
- **UI Components**: Radix UI with shadcn/ui patterns
- **Routing**: Next.js App Router
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Fonts**: Next.js font optimization

## Project Structure
- `src/components/pages/` - Main page components (Homepage, Blog, Contact, etc.)
- `src/components/ui/` - Reusable UI components based on shadcn/ui
- `src/components/shared/` - Shared components (BlogPostCard, ServiceCard, etc.)
- `src/lib/` - Utilities, types, and services
- `src/data/` - Static data and configuration

## Key Features
- Blog system with CMS integration capability
- Service catalog for academic assistance
- Contact forms and testimonials
- Responsive design with modern UI components

## Development
- Port: 5000 (configured for Replit environment)
- Host: 0.0.0.0 with allowedDevOrigins: true for proxy compatibility
- Fast Refresh enabled for development experience
- Next.js development server with hot module replacement

## Deployment

### Replit Deployment
- Target: Autoscale (stateless website)
- Build: npm run build (Next.js production build)
- Serve: npm start (Next.js production server)

### Docker Deployment
- **Image Registry**: GitHub Container Registry (ghcr.io)
- **Base Image**: node:20-alpine (multi-stage build)
- **Build Process**: 
  1. Dependencies stage (npm ci)
  2. Builder stage (Next.js standalone build with .env from .env.example)
  3. Runner stage (minimal production image)
- **Port**: 5000
- **Automated CI/CD**: GitHub Actions workflow triggers on push to main/master or version tags
- **Image Tags**: 
  - `latest` (default branch)
  - `main` or `master` (branch name)
  - `v*` (semantic version tags)
- **Security**: Runs as non-root user (nextjs:nodejs with UID 1001)
- **Standalone Output**: Next.js configured for standalone builds (includes minimal server.js)
- Using webhook