# Tugasin - Production-Ready Website

## Overview
Tugasin is a Next.js 15 + TypeScript application for an academic assistance service. It leverages the Next.js App Router, modern React patterns, and shadcn/ui components to deliver a production-ready website. The project aims to provide a robust platform for academic help, featuring a blog system, service catalog, contact forms, and testimonials, all designed with a responsive and modern user interface.

## User Preferences
No explicit user preferences were provided in the original document.

## System Architecture
The application is built on Next.js 15 with React 18 and TypeScript, utilizing the App Router for navigation. Turbopack is the chosen build tool. UI components are developed using Radix UI patterns integrated with shadcn/ui. Styling is managed with Tailwind CSS, and icons are provided by Lucide React. Next.js font optimization is used for improved performance. The project structure organizes main page components under `src/components/pages/`, reusable UI components under `src/components/ui/`, shared components under `src/components/shared/`, utilities and services under `src/lib/`, and static data/configuration under `src/data/`. Key features include a blog system with CMS integration, a service catalog, and contact forms. The application is configured to run on port 5000 and host 0.0.0.0 for Replit compatibility, with Fast Refresh enabled for development.

**Key Technical Implementations:**
- **Analytics**: Migrated to GetAnalytics.io for unified tracking across GA4, PostHog, and Sentry using custom plugins.
- **Sitemap Optimization**: Improved sitemap generation performance by using single API requests for all posts and implementing a 24-hour memory cache.
- **Blog Enhancements**: Implemented API-level category filtering, query parameter-based pagination with hybrid rendering (ISR for page 1, dynamic for subsequent pages), and automatic scroll-to-top on page changes.
- **API Migration**: Transitioned from GraphQL to a REST API (`/api/v1/posts`) utilizing page/limit query parameters for pagination.
- **Performance**: Optimized build times by removing unnecessary dynamic imports and suppressing Webpack warnings.
- **Project Structure**: Moved from `src/` to a root-level structure with `components/`, `lib/`, `styles/`, `data/` directories, updating all import aliases.

## External Dependencies
- **UI Libraries**: Radix UI, shadcn/ui
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Analytics**: Google Analytics 4 (GA4), PostHog, Sentry (integrated via GetAnalytics.io)
- **CMS Integration**: Utilizes a CMS for blog content, requiring a `CMS_TOKEN` for authorization.
- **External Communication**: WhatsApp (linked via `NEXT_PUBLIC_WHATSAPP_URL` for consultations).
- **Containerization**: Docker (multi-stage build with `node:20-alpine` base image).
- **CI/CD**: GitHub Actions for automated Docker image builds and publishing to GitHub Container Registry (GHCR).