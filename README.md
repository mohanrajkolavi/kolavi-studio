# Kolavi Studio

A production-ready Next.js website for Kolavi Studio agency: mobile-first design, SEO-first architecture, headless WordPress blog, and an owner dashboard with AI-powered Content Writer (Blog Maker), leads, and content maintenance.

> **Public repository:** Never commit `.env.local`, API keys, or credentials. Run `npm run check:secrets` before pushing. See [SECURITY.md](SECURITY.md).

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

Copy `.env.example` to `.env.local` and set **your own** values (use placeholders for local dev). **Never commit `.env.local`** or real API keys/URLs—see [SECURITY.md](SECURITY.md).

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WP_GRAPHQL_URL=https://your-wordpress-site.com/graphql
# Optional: NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX (enables GA4)
```

See [SETUP.md](SETUP.md) for full env vars, Google Search Console verification, sitemap submission, and ongoing GSC/GA monitoring. See [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) for env vars, WordPress usage, caching. See [docs/dashboard/DASHBOARD_SETUP.md](docs/dashboard/DASHBOARD_SETUP.md) for the dashboard (Blog Maker, Leads, Content Maintenance).

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run check:secrets` | Verify no secrets in staged files (run before push) |
| `npm run prepush` | Run `check:secrets` and `lint` |
| `npm run open:browser` | Open app in browser (dev) |

## Project Structure

- **`/src/app`** – Next.js App Router: pages, layouts, API routes (`/api/auth`, `/api/blog`, `/api/contact`, `/api/content-audit`, `/api/content-maintenance`, `/api/leads`, `/api/revalidate`), sitemap, RSS
- **`/src/components`** – Reusable UI: `blog/`, `contact/`, `dashboard/`, `layout/`, `legal/`, `sections/`, `ui/` (shadcn)
- **`/src/lib`** – Shared logic: `auth/`, `blog/`, `claude/`, `gemini/`, `openai/`, `pipeline/`, `seo/`, `graphql/`, `jina/`, `serper/`, `supabase/`, `db/`, `constants/`
- **`/src/types`** – TypeScript type definitions
- **`/scripts`** – Dev/ops scripts (check-secrets, run-audit, open-app-in-browser)
- **`/content_audit`** – Optional Python E-E-A-T/content-audit tool (see [content_audit/README.md](content_audit/README.md))
- **`/docs`** – Documentation (architecture, dashboard, integrations, blog)

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

- **[SETUP.md](SETUP.md)** – Full setup, env vars, database, GSC, sitemap, deployment
- **[SECURITY.md](SECURITY.md)** – Never commit API keys or secrets; what’s gitignored
- **[docs/README.md](docs/README.md)** – Doc index: architecture, dashboard, integrations, blog, content audit
- **[docs/TECH_STACK_AUDIT.md](docs/TECH_STACK_AUDIT.md)** – Tech stack audit and recommendations

## Features

- **Site:** Mobile-first responsive design; SEO (metadata, JSON-LD, sitemap, FAQ schema); headless WordPress blog with ISR and paginated slugs
- **Security:** Security headers (CSP, X-Frame-Options, etc.), HTML sanitization for post content; Core Web Vitals; skip-to-main link and jsx-a11y
- **Dashboard:** Owner dashboard (Overview, Leads, Content Writer, Recent, Content Maintenance); login with rate limiting; optional Supabase for Blog Maker “Recent” history
- **Content Writer (Blog Maker):** AI pipeline (Serper/Jina/Gemini, OpenAI brief, Claude draft, humanize, SEO audit, fact check); publishable = 75%+ score and no Level 1 fails
- **Content audit:** In-app SEO article audit (`src/lib/seo/article-audit.ts`); optional Python E-E-A-T tool in `content_audit/`; API route `/api/content-audit/quality`
- **Scalable:** Multiple verticals (e.g. medical-spas, industries); legal pages (privacy, terms, disclaimer, cookies)

## License

Proprietary – All Rights Reserved. See [LICENSE](LICENSE).
