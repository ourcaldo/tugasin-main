# Tugasin - Project Documentation

## Overview
Tugasin is a Next.js 15 + TypeScript application for an academic assistance service. It provides a platform for academic help, featuring a blog system, service catalog, contact forms, and testimonials, all designed with a responsive and modern user interface.

## Database Structure
This project uses Supabase as the database. Database structure and schema details should be documented here as they are created or modified.

### Current Tables
(To be documented as tables are created)

## Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Library**: Radix UI with shadcn/ui components
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Analytics**: Google Analytics 4, PostHog, Sentry (via GetAnalytics.io)
- **Database**: Supabase
- **Deployment**: Configured for Replit (port 5000, host 0.0.0.0)

## Project Structure
- `app/` - Next.js App Router pages
- `components/` - React components
  - `components/pages/` - Page-specific components
  - `components/ui/` - Reusable UI components (shadcn/ui)
  - `components/shared/` - Shared components
  - `components/sections/` - Section components
  - `components/figma/` - Figma-related components
- `lib/` - Utilities and services
  - `lib/analytics/` - Analytics configuration
  - `lib/cache/` - Caching utilities
  - `lib/cms/` - CMS integration
  - `lib/forms/` - Form utilities
  - `lib/hooks/` - Custom React hooks
  - `lib/security/` - Security utilities
  - `lib/seo/` - SEO utilities
  - `lib/utils/` - General utilities
- `data/` - Static data and configuration
- `styles/` - Global styles
- `public/` - Static assets

## Environment Variables
See `.env.example` for required environment variables. Key variables:
- `CMS_TOKEN` - Authorization token for CMS
- `NEXT_PUBLIC_WHATSAPP_URL` - WhatsApp contact URL
- `SESSION_SECRET` - Session secret key
- `DATABASE_URL` - Supabase database connection string

## Recent Changes

### November 06, 2025 - 12:30 PM
- **Post Redirect Tombstone Pattern Implementation** (Multiple files)
  - Completed full implementation of the tombstone pattern for deleted posts with active redirects
  - **API Client Updates** (`lib/cms/api-client.ts`):
    - Updated `APISinglePostResponse` interface to support tombstone pattern
    - Added optional `data`, `error`, and top-level `redirect` fields for handling deleted posts with redirects
    - Created new `getRawPostBySlug()` method to fetch complete API response including tombstone redirects
    - Enhanced `getPostBySlug()` error handling to detect and log tombstone redirects
    - Proper handling of API responses where `success: false` but `redirect` is present
  - **Redirect Handler Improvements** (`lib/cms/redirect-handler.ts`):
    - Enhanced post-to-post redirect handling with fallback category support
    - Changed error handling from returning `{ shouldRedirect: false }` to using fallback redirects
    - When target post fetch fails, now constructs redirect URL using current category as fallback
    - Prevents broken redirect chains by always attempting redirect even if target post is unavailable
    - Improved debug logging for fallback scenarios
  - **Blog Page Tombstone Support** (`app/blog/[...params]/page.tsx`):
    - Implemented full tombstone pattern detection before checking post existence
    - Checks for `!rawResponse.success && rawResponse.redirect` to catch deleted posts with redirects
    - Processes tombstone redirects with same priority as active post redirects
    - Ensures SEO-friendly redirects persist even after content deletion
    - Maintains backward compatibility with existing redirect implementation
  - **Implementation Features**:
    - SEO-preserved URL transitions for deleted content
    - Graceful handling of missing target posts in redirect chains
    - Debug logging for troubleshooting redirect issues
    - Full alignment with API documentation tombstone pattern specification
    - Proper HTTP status code preservation (301, 302, 307, 308, 410)
    - Zero breaking changes to existing functionality

### November 06, 2025 - 05:15 AM
- **Post Redirect HTTP Status Code Implementation** (`app/blog/[...params]/page.tsx`)
  - Implemented explicit HTTP status code handling using `Response.redirect()` for accurate status codes
  - All redirect types now use correct HTTP status codes:
    - 301 (Moved Permanently): Explicit 301 redirect for permanent content moves
    - 302 (Found): Explicit 302 redirect for temporary content moves
    - 307 (Temporary Redirect): Explicit 307 redirect preserving request method
    - 308 (Permanent Redirect): Explicit 308 redirect preserving request method
    - 410 (Gone): Returns custom 410 response indicating content is permanently removed
  - Converts relative URLs to absolute URLs using `siteConfig.url` for proper redirect handling
  - Properly honors exact HTTP status codes from CMS backend for optimal SEO

### November 06, 2025 - 05:10 AM
- **Post Redirect Feature Implementation** (Multiple files)
  - Added comprehensive redirect handling system for blog posts supporting post-to-post and post-to-URL redirects
  - **Type Definitions** (`lib/cms/api-client.ts`):
    - Added `PostRedirect` interface with support for redirect types ('post' | 'url')
    - Added `PostRedirectTargetPost` and `PostRedirectTargetURL` interfaces for typed redirect targets
    - Supports HTTP status codes: 301 (Permanent), 302 (Temporary), 307, 308, 410 (Gone)
    - Updated `APIPost` and `CMSPost` interfaces to include optional `redirect` field
  - **Redirect Handler Service** (`lib/cms/redirect-handler.ts`):
    - Created dedicated `RedirectHandler` class to handle redirect logic in a well-refactored manner
    - `handlePostRedirect()`: Processes redirect data and returns redirect URL
    - For post-to-post redirects: Fetches target post data and constructs proper blog URL
    - For post-to-URL redirects: Returns the raw URL directly
    - Includes helper methods: `isPermanentRedirect()`, `isTemporaryRedirect()`, `getRedirectStatusText()`
    - Proper error handling and debug logging support
  - **Blog Service Updates** (`lib/cms/blog-service.ts`):
    - Updated all CMSPost transformations to include redirect data from API responses
    - Modified `getPosts()`, `getPostsWithPagination()`, and `getPostsForPage()` methods
  - **Blog Page Component** (`app/blog/[...params]/page.tsx`):
    - Integrated redirect checking before rendering blog post pages
    - Fetches raw CMS post data to access redirect configuration
    - Calls `redirectHandler.handlePostRedirect()` to process redirects
    - Performs Next.js server-side redirect with proper HTTP status codes
    - Maintains backward compatibility - only redirects when explicitly configured in CMS
  - **Implementation Features**:
    - Server-side redirects for optimal SEO (proper HTTP status codes)
    - Supports content consolidation (post-to-post) and external migrations (post-to-URL)
    - Respects HTTP status codes from CMS (301, 302, 307, 308, 410)
    - Debug logging for redirect processing when debug mode is enabled
    - No breaking changes - existing posts without redirects work normally

### October 31, 2025 - 06:35 AM
- **Comprehensive Project Analysis** (`PROJECT_ANALYSIS.md`)
  - Created detailed 15-section analysis document covering:
    - Complete project overview and business model
    - Full technology stack breakdown
    - Current project stage assessment (65% complete)
    - Critical issues identification (console.log exposure, database not connected, hardcoded values)
    - High/medium priority enhancements needed
    - Code quality improvements required
    - Performance optimization recommendations
    - Security enhancements
    - SEO & marketing strategy
    - Future feature roadmap (Phase 1-3)
    - Development effort estimates (8-12 weeks to production MVP)
    - Technology recommendations
    - Action plan with top 3 priorities

### October 31, 2025 - 06:30 AM
- **Hero Section Padding Adjustment** (`components/pages/Homepage.tsx`)
  - Changed vertical padding to exactly 50px (`py-[50px]`) for consistent spacing across all screen sizes

### October 31, 2025 - 06:28 AM
- **Hero Section UI Improvements** (`components/pages/Homepage.tsx`)
  - Reduced top padding from `py-20 lg:py-32` to `py-16 lg:py-24` for better spacing
  - Fixed tablet view alignment: Added `justify-center lg:justify-start` to buttons container to ensure centering on tablet devices
  - Fixed paragraph alignment on tablet: Added `mx-auto lg:mx-0` to paragraph for proper centering
  - Reduced main heading size from `text-4xl lg:text-6xl` to `text-3xl lg:text-5xl` for better readability
  - Changed heading layout from two-line to inline by removing `block` class from the colored span, making "Tugas numpuk bikin stress? Serahin aja ke Tugasin!" appear on one line

### October 31, 2025 - 06:22 AM
- **Initial Setup**: Project imported to Replit environment
  - Copied `.env.example` to `.env`
  - Installed all npm dependencies
  - Configured Frontend workflow to run on port 5000 with webview output
  - Application successfully started and running
  - Created `project.md` documentation file to track project changes and database structure

### (Previous changes from replit.md - for reference)
- **Analytics Migration**: Migrated to GetAnalytics.io for unified tracking
- **Sitemap Optimization**: Improved sitemap generation with 24-hour memory cache
- **Blog Enhancements**: Implemented API-level category filtering and pagination
- **API Migration**: Transitioned from GraphQL to REST API (`/api/v1/posts`)
- **Project Structure**: Moved from `src/` to root-level structure

## Development Guidelines
1. Always update this file when making changes to the project
2. Document all database schema changes
3. Add timeline entries to Recent Changes section
4. Do not use `console.log` for debugging in production code
5. Write refactored, modular code - avoid single functions handling multiple responsibilities
6. Edit `.env.example` then copy to `.env` - never edit `.env` directly
7. All changes must be committed to git with descriptive messages

## Notes
- This project uses Supabase for database, which is not directly accessible from the Replit agent
- Database queries should be provided to the user to run manually
- The application runs on port 5000 for Replit compatibility
