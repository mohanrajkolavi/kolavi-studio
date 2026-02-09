# Kolavi Studio - Setup Guide

## Project Overview

This is a production-ready Next.js website for Kolavi Studio, featuring:

- **Mobile-first design** with responsive layouts
- **SEO-first architecture** with metadata, JSON-LD schemas, and sitemap
- **Headless WordPress** integration via WPGraphQL
- **ISR (Incremental Static Regeneration)** for blog content
- **High performance** optimized for Core Web Vitals

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- WPGraphQL for WordPress content
- graphql-request for API calls

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Update `.env.local` with your settings (see `.env.example` for reference):

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_WP_GRAPHQL_URL=https://your-wordpress-site.com/graphql
# Optional: Google Analytics 4 Measurement ID (e.g. G-XXXXXXXXXX). When set, GA4 loads on every page.
# NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Important:** Replace the WordPress GraphQL URL with your actual WordPress installation that has WPGraphQL plugin installed.

### 3. WordPress Setup

On your WordPress site, install and activate:

1. **WPGraphQL** plugin (required)
2. Configure WPGraphQL settings to allow public access to posts, categories, and tags

### 4. Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### 5. Build for Production

```bash
npm run build
npm start
```

### 6. Database schema (dashboard & contact form)

If you use the **dashboard** (login, leads, content maintenance) or the **contact form** with DB-backed rate limiting, run the schema in your Postgres database once.

Full schema: `src/lib/db/schema.sql`. To add only the **contact form rate limit** table (e.g. after an audit update), run:

**Option A – Vercel Postgres**

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → your project → **Storage** → your Postgres database.
2. Open the **Query** tab (or **.env.local** to get the connection string and use a SQL client).
3. Paste and run:

```sql
CREATE TABLE IF NOT EXISTS contact_rate_limit (
  ip_hash VARCHAR(64) PRIMARY KEY,
  request_count INT NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contact_rate_limit_reset_at ON contact_rate_limit(reset_at);
```

**Option B – Supabase**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. New query → paste the same SQL as above → **Run**.

**Option C – Command line (psql)**

If you have `psql` and `DATABASE_URL` in `.env.local`:

```bash
psql "$DATABASE_URL" -f src/lib/db/schema.sql
```

Or run only the contact_rate_limit part:

```bash
psql "$DATABASE_URL" -c "
CREATE TABLE IF NOT EXISTS contact_rate_limit (
  ip_hash VARCHAR(64) PRIMARY KEY,
  request_count INT NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contact_rate_limit_reset_at ON contact_rate_limit(reset_at);
"
```

`CREATE TABLE IF NOT EXISTS` is safe to run multiple times; it will not overwrite existing tables.

### Blog Maker history (Supabase only)

If you use **Supabase** and want the Blog Maker "Recent" (last 5 posts) feature, add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`, then run this in Supabase Dashboard → SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS blog_generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  focus_keyword TEXT,
  title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  outline JSONB NOT NULL DEFAULT '[]',
  content TEXT NOT NULL,
  suggested_slug TEXT,
  suggested_categories JSONB,
  suggested_tags JSONB
);
CREATE INDEX IF NOT EXISTS idx_blog_generation_history_created_at ON blog_generation_history(created_at DESC);

-- If the table already exists, add the column (run once):
-- ALTER TABLE blog_generation_history ADD COLUMN IF NOT EXISTS focus_keyword TEXT;

-- Add generation time column for the Recent page (run once):
-- ALTER TABLE blog_generation_history ADD COLUMN IF NOT EXISTS generation_time_ms INTEGER;
```

### Content Audit (optional)

- **In-app:** SEO article audit runs in the dashboard (Content Writer) and is implemented in `src/lib/seo/article-audit.ts`. The API route `POST /api/content-audit/quality` can audit HTML/metadata for quality and E-E-A-T–related signals.
- **Python tool:** The `content_audit/` folder contains an optional Python-based E-E-A-T and “Helpful Content” auditor. See [content_audit/README.md](content_audit/README.md) for setup and usage. It can be run standalone or integrated via scripts.

## Project Structure

```
src/
├── app/                              # Next.js App Router
│   ├── layout.tsx, page.tsx          # Root layout, home
│   ├── about/, contact/, services/, portfolio/, industries/
│   ├── medical-spas/                 # Vertical landing
│   ├── privacy/, terms/, disclaimer/, cookies/   # Legal
│   ├── blog/                         # Blog: index, [slug], category/[slug], tag/[slug], rss
│   ├── dashboard/                    # Owner dashboard
│   │   ├── layout.tsx, login/
│   │   └── (main)/                   # Overview, leads, blog (Content Writer), recent, content-maintenance
│   ├── api/                          # API routes
│   │   ├── auth/login, auth/logout
│   │   ├── blog/generate, blog/history, blog/humanize, blog/publish-record
│   │   ├── contact/, leads/, revalidate/
│   │   ├── content-audit/quality/    # Content quality audit API
│   │   └── content-maintenance/
│   ├── sitemap/                      # Sitemap index + static, posts, categories, tags
│   └── robots.ts
├── components/
│   ├── layout/       # Header, Footer, MobileNav, CTAStrip, LayoutShell, Logo
│   ├── sections/     # Hero, Benefits, Process, Testimonials, FAQ, CTA
│   ├── blog/         # BlogContent, BlogPostTOC, BlogSubscribe, ShareButtons
│   ├── contact/      # ContactForm, TypeformEmbed
│   ├── dashboard/    # BlogGenerationProvider, DashboardNavStrip, LoginForm, etc.
│   ├── legal/        # LegalPageLayout
│   └── ui/           # shadcn/ui (button, card, input, sheet, textarea)
├── lib/
│   ├── auth/         # login-rate-limit, auth
│   ├── blog/         # data, generation-types, sample-posts, utils
│   ├── graphql/      # client, queries, types (WordPress)
│   ├── seo/          # metadata, canonical, article-audit, jsonld/*, rank-math-parser
│   ├── pipeline/     # orchestrator, types (Content Writer pipeline)
│   ├── claude/, gemini/, openai/   # AI clients
│   ├── jina/, serper/              # Reader, search
│   ├── supabase/, db/              # Supabase, Postgres (schema in db/schema.sql)
│   ├── constants/                   # Site constants + banned-phrases
│   └── utils.ts, sitemap-index.ts
└── types/
    └── global.d.ts

content_audit/        # Optional Python E-E-A-T audit (see content_audit/README.md)
scripts/              # check-secrets.sh, run-audit.mjs, open-app-in-browser.mjs
docs/                 # architecture, dashboard, integrations, blog
```

## Key Features

### Mobile-First Design

- All layouts start at 360-430px width
- Single-column layout by default
- Multi-column at `md:` breakpoint and above
- Hamburger menu with big tap targets (44px minimum)
- No horizontal scrolling at any breakpoint

### SEO Implementation

✅ **Metadata**
- Unique title and description per page
- Open Graph and Twitter Card meta tags
- Canonical URLs on all pages

✅ **JSON-LD Schemas**
- Organization schema (site-wide)
- Breadcrumb schema (blog pages)
- Article schema (blog posts)
- FAQ schema (pages with FAQs)

✅ **Sitemap & Robots**
- Dynamic sitemap including all static and blog routes
- Robots.txt with sitemap reference

✅ **Semantic HTML**
- One H1 per page
- Logical heading hierarchy (H2-H4)
- Proper semantic elements

### Blog with ISR

- **Revalidation:** 60 seconds (configurable)
- **Static Generation:** Top posts pre-rendered at build time
- **On-Demand:** Other posts generated on first request
- **Error Handling:** 404 for missing slugs

### Performance Optimizations

- Server components by default
- `next/image` for all images with lazy loading
- Minimal JavaScript bundle
- No unnecessary client-side state
- ISR for blog content

## Customization

### Adding New Pages

1. Create a new file in `src/app/[page-name]/page.tsx`
2. Export metadata using `getPageMetadata()`
3. Add the route to `NAV_LINKS` in `src/lib/constants.ts`
4. Add static routes in `src/lib/sitemap-index.ts` (STATIC_ROUTES) if needed

### Styling

- Modify `src/app/globals.css` for global styles
- Update `tailwind.config.ts` for theme customization
- Use shadcn/ui components from `src/components/ui/`

### Content

- Update copy in page components
- Replace placeholder images in `public/` folder:
  - `logo.png` - Your logo
  - `og-image.jpg` - Open Graph image (1200x630)
  - `favicon.ico` - Favicon

### Adding Future Verticals

When ready to add dental or law firm verticals:

1. Create new route: `src/app/dental/page.tsx` or `src/app/law-firms/page.tsx`
2. Follow the same pattern as `medical-spas/page.tsx`
3. Add to navigation in `src/lib/constants.ts`
4. Create corresponding blog categories in WordPress

## WordPress Content Requirements

### Required Fields

Your WordPress posts should include:
- Title
- Content
- Excerpt
- Featured Image
- Categories
- Tags (optional)
- Published Date
- Modified Date

### Recommended Categories

For medical spas vertical:
- Medical Spa Marketing
- SEO for Spas
- Web Design
- Social Media Marketing

## Google Search Console

1. **Verify your property** at [Google Search Console](https://search.google.com/search-console) for your public domain (e.g. `https://kolavistudio.com`).
   - **Option A — HTML tag:** In GSC, choose “HTML tag” and copy the meta tag. Add it to your site’s `<head>` (e.g. in `src/app/layout.tsx` via a literal `<meta>` or via `metadata.other`). Redeploy, then click “Verify” in GSC.
   - **Option B — DNS:** Verify using the TXT record in your domain’s DNS (no code change).
2. **Submit sitemap:** After verification, go to **Indexing → Sitemaps** and add `https://<your-domain>/sitemap.xml` (e.g. `https://kolavistudio.com/sitemap.xml`). The sitemap index is served at `/sitemap.xml` (see README **Sitemap** section).

## Ongoing SEO & Analytics Monitoring

- **Google Search Console:** Check Coverage, Core Web Vitals, and search performance; fix any indexing or crawl issues.
- **Google Analytics 4:** Review traffic and events (when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set).
- **Content:** Use Rank Math in WordPress for focus keyword, SEO title, and meta description; refresh older posts periodically.

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Compatible with any platform supporting Next.js:
- Netlify
- AWS Amplify
- Digital Ocean App Platform
- Self-hosted with Node.js

## Troubleshooting

### Blog Pages Not Loading

- Verify `NEXT_PUBLIC_WP_GRAPHQL_URL` is correct
- Check WPGraphQL plugin is active
- Ensure WordPress posts are published (not draft)
- Check browser console for GraphQL errors

### Images Not Displaying

- Verify WordPress media URLs are accessible
- Check `next.config.ts` has correct image domains
- Ensure images exist in WordPress media library

### Build Errors

- Run `npm install` to ensure all dependencies are installed
- Check for TypeScript errors: `npm run build`
- Verify environment variables are set

## Next Steps

1. **Replace Placeholder Content**
   - Update copy on all pages
   - Add real images and logos
   - Customize testimonials and portfolio items

2. **Configure WordPress**
   - Set up WPGraphQL
   - Create initial blog posts
   - Set up categories and tags

3. **SEO & Analytics**
   - **Google Analytics 4:** Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in `.env.local` (and in Vercel/host env). GA4 scripts load on every page when set.
   - **Google Search Console:** Verify your property, then submit your sitemap. See [Google Search Console](#google-search-console) above.
   - Configure meta descriptions (e.g. via Rank Math in WordPress for blog posts).

4. **Performance Testing**
   - Run Lighthouse audit
   - Test Core Web Vitals
   - Optimize images if needed

5. **Launch Checklist**
   - Update environment variables for production
   - Test all forms and links
   - Verify mobile responsiveness
   - Check all pages load correctly
   - Test blog functionality with real WordPress data

## Support

For questions or issues, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [WPGraphQL Documentation](https://www.wpgraphql.com/docs/introduction)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
