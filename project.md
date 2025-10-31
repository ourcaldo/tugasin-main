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
