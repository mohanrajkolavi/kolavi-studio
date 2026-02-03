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

Copy `.env.example` to `.env.local` and set **your own** values (use placeholders for local dev). **Never commit `.env.local`** or real API keys/URLs—see [docs/SECURITY.md](docs/SECURITY.md).

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WP_GRAPHQL_URL=https://your-wordpress-site.com/graphql
# Optional: NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX (enables GA4)
```

See [SETUP.md](SETUP.md) for full env vars, Google Search Console verification, sitemap submission, and ongoing GSC/GA monitoring. See [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) for env vars, WordPress usage, caching (middleware + `unstable_cache`), and how to run bundle analysis.

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

## Sitemap

- **URL:** `https://<your-domain>/sitemap.xml` (or `http://localhost:3000/sitemap.xml` in dev)
- **Format:** Sitemap index (Google-style). Root lists child sitemaps; each child is a standard `<urlset>`.
- **Child sitemaps:** `/sitemap/static`, `/sitemap/posts`, `/sitemap/categories`, `/sitemap/tags`
- **Implementation:** `src/app/sitemap/route.ts` (index) + `src/app/sitemap/*/route.ts` (children); shared logic in `src/lib/sitemap-index.ts`
- **Standards:** [sitemaps.org](https://www.sitemaps.org/protocol.html) (UTF-8, entity escaping, &lt;loc&gt; &lt; 2048 chars, schemaLocation for validation)
- **robots.txt** references `Sitemap: <SITE_URL>/sitemap.xml`

## Architecture

- **Env:** All config via `NEXT_PUBLIC_*` (see [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md)).
- **WordPress:** Blog data from WPGraphQL when `NEXT_PUBLIC_WP_GRAPHQL_URL` is set; fallback to sample data when unset or on error. Paginated slug fetcher for 1000+ posts.
- **Caching:** Security headers in middleware; blog and sitemap data cached with `unstable_cache` (60s revalidate); ISR on blog pages; sitemap/RSS responses cached 1h.
- **Bundle analysis:** See [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) for running `ANALYZE=true npm run build` with `@next/bundle-analyzer`.

## Documentation

- **[QUICKSTART.md](QUICKSTART.md)** – Get running in 5 minutes
- **[SETUP.md](SETUP.md)** – Full setup, env vars, GSC, sitemap
- **[docs/SECURITY.md](docs/SECURITY.md)** – Never commit API keys or secrets; what’s gitignored
- **[docs/README.md](docs/README.md)** – Design docs, implementation notes, SEO audits, architecture

## Features

- Mobile-first responsive design
- SEO optimized (metadata, JSON-LD, sitemap, FAQ schema, keywords)
- Headless WordPress blog with ISR and paginated slugs
- Security headers (CSP, X-Frame-Options, etc.) and HTML sanitization for post content
- Core Web Vitals optimized; skip-to-main link and jsx-a11y
- Scalable architecture for multiple verticals
