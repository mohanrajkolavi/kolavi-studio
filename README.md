# Kolavi Studio

A production-ready Next.js website for Kolavi Studio agency, featuring mobile-first design, SEO-first architecture, and headless WordPress integration.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- WPGraphQL (WordPress headless CMS)
- ISR (Incremental Static Regeneration)

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

Copy `.env.local` and update the WordPress GraphQL URL:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WP_GRAPHQL_URL=https://your-wordpress-site.com/graphql
```

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/src/app` - Next.js App Router pages
- `/src/components` - Reusable React components
- `/src/lib` - Utilities (GraphQL client, SEO helpers)
- `/src/types` - TypeScript type definitions

## Features

- Mobile-first responsive design
- SEO optimized (metadata, JSON-LD, sitemap)
- Headless WordPress blog with ISR
- Core Web Vitals optimized
- Scalable architecture for multiple verticals
