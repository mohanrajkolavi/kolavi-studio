# Architecture & Runbooks

## Project structure

- **`src/app/`** – Routes and page composition only (pages, layouts, API routes, sitemap/robots). No shared UI components.
- **`src/components/`** – Reusable UI: `blog/` (BlogContent, BlogSubscribe, BlogPostTOC, ShareButtons), `layout/` (Header, Footer, CTAStrip, MobileNav), `sections/`, `ui/`, `contact/`.
- **`src/lib/`** – Shared logic: `blog/` (data, utils, sample-posts), `graphql/` (client, queries, types), `seo/` (metadata, JSON-LD, canonical, rank-math), `constants.ts`, `utils.ts`, `sitemap-index.ts`.
- **`docs/`** – `architecture/`, `integrations/`, `dashboard/`.

## Environment variables

All public config is via `NEXT_PUBLIC_*`; no server secrets are exposed to the client.

- **NEXT_PUBLIC_SITE_URL** – Canonical base URL (canonical links, Open Graph, sitemap, RSS). Set to production URL in prod.
- **NEXT_PUBLIC_WP_GRAPHQL_URL** – WordPress GraphQL endpoint. When set, blog data comes from WordPress; when unset, sample data is used so the site runs without WP.
- **NEXT_PUBLIC_GA_MEASUREMENT_ID** – Optional GA4 Measurement ID. When set, GA4 scripts load on every page.

See [INTEGRATIONS.md](../integrations/INTEGRATIONS.md) for full list and GTM notes.

## WordPress (headless)

- **Where it's used:** Blog posts, categories, tags, sitemap posts/categories/tags, RSS, and static params for blog post pages.
- **Data layer:** `src/lib/blog/data.ts` – `getPosts`, `getPostBySlug`, `getCategoryBySlug`, `getAllCategorySlugs`, `fetchAllPostSlugs`. GraphQL client in `src/lib/graphql/client.ts`; queries in `src/lib/graphql/queries.ts`.
- **Slugs at scale:** `fetchAllPostSlugs()` paginates (100 per page) so sitemaps and `generateStaticParams` work with 1000+ posts. Post list for the blog index still uses `getPosts()` (first 100); increase or paginate there if needed.
- **Auth:** Public read-only by default. To lock down WP, add headers or auth in `src/lib/graphql/client.ts`.

## Caching

- **Security headers:** `src/middleware.ts` runs on every request (except static assets) and sets `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Content-Security-Policy`.
- **Data cache:** Blog and sitemap data use Next.js `unstable_cache` (revalidate 60s). Keys: `blog-posts`, `blog-post-<slug>`, `blog-category-<slug>`, `blog-category-slugs`, `sitemap-posts`, `sitemap-categories`, `sitemap-tags`. This reduces hits to WordPress within the revalidate window.
- **Route cache:** Blog pages use `revalidate = 60` (ISR). Sitemap and RSS responses send `Cache-Control: public, max-age=3600, s-maxage=3600`.

## Bundle analysis

To inspect bundle size and route-based code splitting:

1. Install the analyzer (one-time):
   ```bash
   npm install --save-dev @next/bundle-analyzer
   ```
2. In `next.config.ts`, wrap the config with the analyzer:
   ```ts
   import bundleAnalyzer from "@next/bundle-analyzer";
   const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });
   export default withBundleAnalyzer(nextConfig);
   ```
3. Run:
   ```bash
   ANALYZE=true npm run build
   ```
   A browser window will open with the report.

## Error handling

- **Runtime errors:** Root `src/app/error.tsx` catches unhandled errors and shows a friendly message with "Try again" and "Go home" / "Blog".
- **404:** `src/app/not-found.tsx` with links to home and blog.
- **GraphQL failures:** `lib/blog/data.ts` catches errors and falls back to sample data (posts) or null (category) so the site degrades gracefully.
