# Full Audit: SEO, Security, WordPress Headless & Related Factors

**Date:** February 3, 2026  
**Scope:** Kolavi Studio Next.js site — SEO, security, WordPress headless integration, performance, and operational factors.

---

## Executive Summary

| Area | Score | Grade | Status |
|------|-------|-------|--------|
| **SEO** | 86/100 | B+ | Strong; a few fixes to reach A |
| **Security** | 82/100 | B | Solid headers & secrets; CSP and API gaps |
| **WordPress Headless** | 85/100 | B | Data layer ready; GraphQL client edge case |
| **Other (Performance, A11y, Ops)** | 80/100 | B | Good foundations; Tally/Google Forms CSP, rate limits |

**Overall: 83/100 (B)** — Production-ready with targeted improvements recommended below.

---

## 1. SEO Audit

### 1.1 Strengths

| Item | Status |
|------|--------|
| **Metadata** | `getPageMetadata()` used site-wide with title, description, canonical, keywords |
| **Canonical URLs** | `alternates.canonical` set via `SITE_URL` for all pages |
| **Open Graph** | OG title, description, image, type (website/article), url, siteName |
| **Twitter Cards** | `summary_large_image`, title, description, images |
| **Robots** | Default `index: true`, `follow: true`; `noIndex` override where needed |
| **Structured data** | BreadcrumbList, Blog, Article, CollectionPage, Organization, FAQ |
| **RSS** | `/blog/rss.xml` (rewrite from `/blog/rss`), valid RSS 2.0 with Atom self link |
| **Sitemap** | Index at `/sitemap.xml` with static, posts, categories, tags child sitemaps |
| **Semantic HTML** | `<main>`, `<article>`, `<nav aria-label="Breadcrumb">`, `<time dateTime>` |
| **Single H1** | One H1 per page |
| **Image alt** | Featured images use `altText` or post title fallback |
| **External links** | `rel="noopener noreferrer"` on share/social links |
| **ISR** | `revalidate: 60` on blog routes; sitemap/RSS cache headers |

### 1.2 Issues & Recommendations

| Issue | Impact | Recommendation |
|-------|--------|----------------|
| **Article schema author** | Google prefers `@type: Person` for article author | In `src/lib/seo/jsonld/article.ts`, use `Person` when author is an individual (e.g. when `authorName` is not the site name); keep `Organization` for brand-authored posts |
| **Featured image figcaption** | Accessibility/SEO | Add `<figcaption>` to the featured image `<figure>` on `/blog/[slug]` (e.g. alt text or post title) |
| **RSS self link** | Some readers expect `.xml` in self URL | In `src/app/blog/rss/route.ts`, set `atom:link href` to `${SITE_URL}/blog/rss.xml` (matches rewrite) |
| **Category page `<main>`** | Consistency & landmarks | Ensure category page has explicit `<main>` (or is inside layout’s main) for consistency with tag page |
| **Meta description length** | Truncation in SERPs | Keep blog index description ≤155 characters where possible |

### 1.3 Sitemap & Data Consistency

- **Posts sitemap:** Uses `getPostEntries()` from `sitemap-index.ts`, which calls `getPosts()` or `fetchAllPostSlugs()` from `lib/blog/data.ts`. ✅ Aligned with blog data source (WP when set, else sample).
- **Categories/tags sitemap:** When WP is set, categories/tags use direct GraphQL `request()` in sitemap-index; when unset, use `getAllCategorySlugs()` and `getTagsFromPosts(getPosts())`. ✅ No mismatch.

---

## 2. Security Audit

### 2.1 Strengths

| Item | Status |
|------|--------|
| **Secrets** | No API keys/tokens in repo; `.env.example` placeholders only; `.env` / `.env.local` gitignored |
| **Env usage** | Config from `process.env.NEXT_PUBLIC_*` only; no server secrets in client bundle |
| **Security headers** | Middleware sets `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`, `frame-ancestors 'none'`, `upgrade-insecure-requests` |
| **Revalidate API** | `/api/revalidate` protected by `Authorization: Bearer <REVALIDATE_SECRET>`; 501 when secret unset |
| **Rank Math parser** | Input length cap (100k), value length cap (2k), try/catch; mitigates DoS and oversized output |
| **XML output** | Sitemap/RSS use escaped output (`escapeXml`) to avoid injection |

### 2.2 Issues & Recommendations

| Issue | Impact | Recommendation |
|-------|--------|----------------|
| **CSP `script-src 'unsafe-inline'`** | Required for Next.js and GA today; weakens CSP | Document as accepted risk; plan for nonce/hash-based CSP when moving to stricter policy |
| **CSP and Tally / Google Forms** | If `NEXT_PUBLIC_TALLY_FORM_EMBED_URL` or `NEXT_PUBLIC_GOOGLE_FORM_EMBED_URL` is set, embeds may be blocked | Add to CSP: for Tally — `script-src`/`frame-src`/`connect-src` for `https://tally.so`; for Google Forms — `frame-src https://docs.google.com` |
| **Revalidate endpoint** | No rate limiting; brute-force on secret possible | Add rate limiting (e.g. by IP or by API key) or ensure secret is long and random; consider Vercel/serverless rate limits |
| **GraphQL client with empty URL** | `client.ts` creates `GraphQLClient(WP_GRAPHQL_URL)` at load; when `WP_GRAPHQL_URL` is `""`, client is still created | Guard: only call `request()` when `WP_GRAPHQL_URL?.trim()` is set, or lazy-initialize client when URL is non-empty (blog-data already avoids calling when unset; sitemap-index only calls when WP is set — so low risk but clearer to guard in client) |

### 2.3 Dependency & Build Security

- Use `npm audit` / `npm ci` in CI; keep Next and dependencies updated.
- Ensure production builds do not expose `NEXT_PUBLIC_*` for internal or staging URLs in production.

---

## 3. WordPress Headless Audit

### 3.1 Strengths

| Item | Status |
|------|--------|
| **Data layer** | Single `lib/blog/data.ts`: `getPosts`, `getPostBySlug`, `getCategoryBySlug`, `getAllCategorySlugs`, `fetchAllPostSlugs`, `getCategoriesFromPosts`, `getTagsFromPosts` |
| **WP types** | `WPPost`, `WPCategory`, `WPTag`, `WPFeaturedImage`, `WPAuthor` align with WPGraphQL |
| **Fallback** | When `NEXT_PUBLIC_WP_GRAPHQL_URL` is unset, sample data used; site works without WP |
| **GraphQL** | Queries in `queries.ts`; timeout (10s) and retries (2) with backoff in `client.ts` |
| **Caching** | `unstable_cache` (60s revalidate) and cache tags for blog/sitemap; ISR on blog routes |
| **Rank Math** | Post metadata parsed from `seo.fullHead` and merged with Next metadata |
| **URL structure** | `/blog/[slug]`, `/blog/category/[slug]`, `/blog/tag/[slug]` match common WP patterns |
| **Pagination at scale** | `fetchAllPostSlugs()` paginates (100 per page, MAX_PAGES 500) for sitemap and `generateStaticParams` |

### 3.2 Issues & Recommendations

| Issue | Impact | Recommendation |
|-------|--------|----------------|
| **GraphQL client instantiation** | Client created with empty URL when env unset (no runtime error because request not called) | Lazy-initialize client or add guard in `request()`: if `!WP_GRAPHQL_URL?.trim()`, throw clear error or return early |
| **Blog index pagination** | `getPosts()` uses `first: 100`; no UI pagination on `/blog` | For 100+ posts, add cursor-based pagination or “Load more” using `pageInfo` |
| **Author in schema** | Article JSON-LD uses `Organization` for author | Use `Person` when author is an individual (see SEO section) |

### 3.3 WPGraphQL Lockdown (Future)

- Docs note auth/headers can be added in `client.ts` if WP is locked down.
- When locking down: use env-based secret (e.g. `WP_GRAPHQL_SECRET`) and set `Authorization: Bearer …` or custom header in `client.ts`; keep secret server-only (no `NEXT_PUBLIC_`).

---

## 4. Other Factors

### 4.1 Performance

| Item | Status |
|------|--------|
| **Images** | Next.js `Image` with `sizes`; `priority` on post featured image |
| **Fonts** | `next/font` (Inter) with `display: swap` |
| **Caching** | ISR 60s; sitemap/RSS `Cache-Control: max-age=3600` |
| **Data** | `unstable_cache` for blog and sitemap entries |

**Recommendation:** Run Lighthouse (performance, LCP, CLS) on key routes; add bundle analyzer in CI if not already.

### 4.2 Accessibility

| Item | Status |
|------|--------|
| **Skip link** | “Skip to main content” in layout |
| **Landmarks** | `<main id="main-content">`, `<nav aria-label="Breadcrumb">` |
| **Semantic HTML** | Headings, `<article>`, `<time dateTime>` |

**Recommendation:** Add `<figcaption>` for featured image; run axe or Lighthouse a11y on blog and contact.

### 4.3 Operations & Reliability

| Item | Status |
|------|--------|
| **Error handling** | Root `error.tsx`; `not-found.tsx`; GraphQL errors fall back to sample or null |
| **Revalidation** | Optional `REVALIDATE_SECRET` for on-demand cache invalidation |
| **Env docs** | INTEGRATIONS.md and .env.example document variables |

**Recommendation:** If using Tally or Google Forms, update CSP (see Security). Consider health check route (e.g. `/api/health`) that verifies WP connectivity when configured.

### 4.4 Content Security (XSS)

| Item | Status |
|------|--------|
| **Blog content** | Post body rendered with `dangerouslySetInnerHTML` (required for HTML from WP) |
| **JSON-LD** | All schema uses `JSON.stringify(...)` (no user input in schema object) — safe |
| **Rank Math** | Parser extracts meta only; no raw fullHead injected into DOM |

**Recommendation:** Ensure WordPress is kept updated and only trusted users can publish; consider sanitizing post HTML (e.g. DOMPurify) server-side if risk profile requires it.

---

## 5. Priority Action List

### High

1. **SEO:** Use `@type: Person` in Article schema when author is an individual.
2. **Security:** If using Tally or Google Forms, add their domains to CSP in `middleware.ts`.
3. **Security:** Harden `/api/revalidate` (rate limit or long random secret).

### Medium

4. **SEO:** Add `<figcaption>` to featured image on post page.
5. **SEO:** Set RSS `atom:link` self href to `/blog/rss.xml`.
6. **WordPress:** Guard or lazy-initialize GraphQL client when `WP_GRAPHQL_URL` is empty.

### Low

7. **SEO:** Add explicit `<main>` on category page if missing.
8. **WordPress:** Add pagination (or “Load more”) on blog index when post count grows.
9. **Ops:** Add `/api/health` that checks WP when `NEXT_PUBLIC_WP_GRAPHQL_URL` is set.

---

## 6. References

- [docs/seo/BLOG_SEO_ANALYSIS_2026.md](seo/BLOG_SEO_ANALYSIS_2026.md) — Blog SEO and WP headless compliance.
- [docs/SECURITY.md](SECURITY.md) — Secrets and env.
- [docs/integrations/INTEGRATIONS.md](integrations/INTEGRATIONS.md) — Env vars and third-party integrations.
- [docs/architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md) — Caching, WP, and runbooks.
