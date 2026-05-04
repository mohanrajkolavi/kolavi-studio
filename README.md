# Kolavi Studio

A production-ready Next.js website for Kolavi Studio agency: mobile-first design, SEO-first architecture, headless WordPress blog, owner dashboard with AI-powered Content Writer (Blog Maker), partner program, leads, content maintenance, and a growing suite of free SEO & developer tools.

> **Public repository:** Never commit `.env.local`, API keys, or credentials. Run `npm run check:secrets` before pushing. See [SECURITY.md](SECURITY.md).

## Tech Stack

- Next.js 15 (App Router) + React 19
- TypeScript 5
- Tailwind CSS 3 + shadcn/ui (Radix primitives)
- WPGraphQL (WordPress headless CMS)
- Supabase (auth + Postgres) for partner portal & dashboard history
- AI providers: Anthropic Claude, OpenAI, Google Gemini
- ISR (Incremental Static Regeneration) + `unstable_cache`

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
| `npm run build` | Production build (regenerates sitemap routes via `prebuild`) |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (`tsx --test`) |
| `npm run generate:sitemap-routes` | Regenerate static sitemap route list |
| `npm run db:migrate` | Apply SQL migrations (Supabase/Postgres) |
| `npm run check:secrets` | Verify no secrets in staged files (run before push) |
| `npm run prepush` | Run sitemap-routes check, `check:secrets`, `lint`, and `test` |
| `npm run open:browser` | Open app in browser (dev) |

## Project Structure

- **`/src/app`** – Next.js App Router
  - **Marketing site:** home, about, contact, pricing, services, portfolio, industries, medical-spas, blog, legal (privacy, terms, disclaimer, cookies)
  - **Free tools (`/tools`):** speed-audit, bio-generator, email-generator, sitemap-generator, slogan-generator, motto-generator
  - **Markdown tools:** `/markdown-tools` hub plus editor, formatter, to-html, to-pdf, table-generator, cheat-sheet, syntax, extended-syntax, hacks, guide, and platform-specific pages (github-markdown, slack-markdown, discord-markdown)
  - **YAML tools:** `/yaml-tools` hub plus editor, formatter, validator, diff, to-json, json-to-yaml, guide, and tutorial pages (anchors, arrays-and-lists, comments, docker-compose, kubernetes, multiline-strings, python, syntax, yaml-vs-json, yml-vs-yaml, no-module-named-yaml)
  - **Partner program (`/partner`):** apply, login, dashboard, set-password, forgot-password
  - **Owner dashboard (`/dashboard`):** Overview, Leads, Content Writer, Recent, Content Maintenance, Partners
  - **API routes (`/api`):** `auth`, `blog`, `contact`, `content-audit`, `content-maintenance`, `leads`, `partner`, `partners`, `revalidate`, `bio-generator`, `email-generator`, `slogan-generator`, `sitemap-generator`, `speed-audit`, `gsc`, `indexing`
  - **SEO surfaces:** `sitemap/` (index + child routes), `robots.ts`, RSS
- **`/src/components`** – Reusable UI: `blog/`, `booking/`, `contact/`, `dashboard/`, `layout/`, `legal/`, `markdown-tools/`, `partner/`, `sections/`, `tools/`, `ui/` (shadcn), `yaml-tools/`
- **`/src/lib`** – Shared logic: `analytics/`, `anthropic/`, `auth/`, `blog/`, `claude/`, `constants/`, `db/`, `email/`, `gemini/`, `graphql/`, `jina/`, `knowledge/`, `logging/`, `markdown/`, `openai/`, `partner/`, `pipeline/`, `rate-limit/`, `security/`, `seo/`, `serper/`, `site/`, `sitemap/`, `supabase/`, `validators/`, `yaml/`, plus `google-indexing.ts` and `google-search-console.ts`
- **`/src/types`** – TypeScript type definitions
- **`/scripts`** – Dev/ops scripts (`check-secrets.sh`, `generate-sitemap-routes.ts`, `open-app-in-browser.mjs`, `run-audit.mjs`, `run-partner-migrations-supabase.sql`)
- **`/tools/content_audit`** – Optional Python E-E-A-T/content-audit tool (see [tools/content_audit/README.md](tools/content_audit/README.md))
- **`/docs`** – Documentation: [docs/README.md](docs/README.md) (architecture, dashboard, integrations, partner, blog, audits, planning, revamp)

## Sitemap

- **URL:** `https://<your-domain>/sitemap.xml` (or `http://localhost:3000/sitemap.xml` in dev)
- **Format:** Sitemap index (Google-style). Root lists child sitemaps; each child is a standard `<urlset>`.
- **Child sitemaps:** `/sitemap/static`, `/sitemap/posts`, `/sitemap/categories`, `/sitemap/tags`
- **Implementation:** `src/app/sitemap/route.ts` (index) + `src/app/sitemap/*/route.ts` (children); shared logic in `src/lib/sitemap/`
- **Standards:** [sitemaps.org](https://www.sitemaps.org/protocol.html) (UTF-8, entity escaping, &lt;loc&gt; &lt; 2048 chars, schemaLocation for validation)
- **robots.txt** references `Sitemap: <SITE_URL>/sitemap.xml`

## Architecture

- **Env:** All public config via `NEXT_PUBLIC_*`; secrets stay server-side (see [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md)).
- **WordPress:** Blog data from WPGraphQL when `NEXT_PUBLIC_WP_GRAPHQL_URL` is set; fallback to sample data when unset or on error. Paginated slug fetcher for 1000+ posts.
- **Caching:** Security headers in middleware; blog and sitemap data cached with `unstable_cache` (60s revalidate); ISR on blog pages; sitemap/RSS responses cached 1h.
- **Rate limiting:** Per-route rate limits on auth, lead, and AI tool endpoints (`src/lib/rate-limit/`).
- **Bundle analysis:** See [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) for running `ANALYZE=true npm run build` with `@next/bundle-analyzer`.

## Documentation

- **[SETUP.md](SETUP.md)** – Full setup, env vars, database, GSC, sitemap, deployment
- **[SECURITY.md](SECURITY.md)** – Never commit API keys or secrets; what's gitignored
- **[docs/README.md](docs/README.md)** – Doc index: architecture, dashboard, integrations, partner, blog, audits, planning, content audit
- **[docs/BUILDING_APPS_GUIDE.md](docs/BUILDING_APPS_GUIDE.md)** – Conventions for adding new tools/pages
- **[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)** – Design tokens, components, and UI patterns

## Features

- **Site:** Mobile-first responsive design; SEO (metadata, JSON-LD, sitemap, FAQ schema); headless WordPress blog with ISR and paginated slugs
- **Security:** Security headers (CSP, X-Frame-Options, etc.), HTML sanitization for post content; Core Web Vitals; skip-to-main link and jsx-a11y
- **Free tools:** Speed/SEO audit, AI bio generator, AI email generator (15 types, 3 variants), XML sitemap generator (crawls a URL), AI slogan generator, motto generator
- **Markdown toolkit:** Live editor, formatter, table generator, Markdown→HTML, Markdown→PDF, plus reference pages for syntax, extended syntax, hacks, GitHub/Slack/Discord flavors
- **YAML toolkit:** Editor, formatter, validator, diff viewer, YAML↔JSON converters, plus tutorial pages (anchors, lists, multiline strings, comments, Docker Compose, Kubernetes, Python, syntax)
- **Partner program:** Partner portal (`/partner`) with apply, login, dashboard, set-password, forgot-password; Supabase auth; referral links; partner terms
- **Dashboard:** Owner dashboard (Overview, Leads, Content Writer, Recent, Content Maintenance, Partners); login with rate limiting; optional Supabase for Blog Maker "Recent" history
- **Content Writer (Blog Maker):** AI pipeline (Serper/Jina/Gemini, OpenAI brief, Claude draft, humanize, SEO audit, fact check); publishable = 75%+ score and no Level 1 fails
- **Content audit:** In-app SEO article audit (`src/lib/seo/article-audit.ts`); optional Python E-E-A-T tool in `tools/content_audit/`; API route `/api/content-audit/quality`
- **Scalable:** Multiple verticals (e.g. medical-spas, industries); legal pages (privacy, terms, disclaimer, cookies)

## License

Proprietary – All Rights Reserved. See [LICENSE](LICENSE).
