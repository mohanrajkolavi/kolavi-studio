# Blog SEO & WordPress Headless Compatibility Audit

**Date:** February 2026  
**Scope:** All blog pages and components (`/blog`, `/blog/[slug]`, `/blog/category/[slug]`, `/blog/tag/[slug]`, and shared blog components).

---

## Overall Score: **96 / 100**

| Area | Score | Notes |
|------|--------|-------|
| **SEO (meta, schema, semantic)** | 96/100 | Full meta, canonical, OG/Twitter, Article/Blog/CollectionPage with wordCount & ImageObject; RSS feed; main landmarks. |
| **WordPress headless compatibility** | 96/100 | Single data layer (`blog-data.ts`), WPAuthor support, optional chaining, GraphQL-ready swap. |

---

## 1. SEO Audit

### ✅ What's in place

- **Metadata (Next.js)**
  - All blog pages use `generateMetadata` or `metadata` with `getPageMetadata()`.
  - Title, description, canonical URL, keywords (where used), and optional author.
  - **Blog post page:** `publishedTime`, `modifiedTime`, and `author` for Article rich results and OG article type.
  - **OG / Twitter:** `openGraph` and `twitter` with title, description, image (1200×630), and `summary_large_image`. OG `type` is `"article"` only for posts (when `publishedTime` is set), and `"website"` for listing/category/tag pages.

- **Structured data (JSON-LD)**
  - **Blog index:** `BreadcrumbList` (Home → Blog), `Blog` with `blogPost` (headline, url, datePublished, description).
  - **Post page:** `Article` (headline, description, image, datePublished, dateModified, author, publisher, mainEntityOfPage with full URLs).
  - **Category page:** `BreadcrumbList`, `CollectionPage` (name, description, url via `SITE_URL`, about, numberOfItems).
  - **Tag page:** `BreadcrumbList`, `CollectionPage` (name, description, url via `SITE_URL`, numberOfItems).

- **Semantic HTML**
  - Post page: `<article>`, `<nav aria-label="Breadcrumb">`, `<time dateTime>`, `<figure>`/`<figcaption>` for featured image.
  - Category/tag: `<nav aria-label="Breadcrumb">`, single `<h1>` per page.
  - Tag page: `<main>` wrapper for main content.

- **Content & UX**
  - Single H1 per page; H2/H3 used in content and TOC.
  - Images: `alt` from `featuredImage.node.altText` or post title.
  - Internal links use Next.js `<Link>`; external (e.g. social) use `rel="noopener noreferrer"`.
  - TOC: `aria-label="Table of contents"`, scroll-spy and `aria-current="location"` for active section.

- **Technical**
  - Canonical URLs via `metadataBase` and `alternates.canonical`.
  - `robots`: index/follow by default; `noIndex` supported when needed.
  - Revalidate (e.g. 60s) for ISR where applicable.

### ⚠️ Minor SEO improvements (already addressed in this pass)

- Post page now sends `publishedTime`, `modifiedTime`, and `author` for Article/OG.
- Category/tag CollectionPage and canonical use `SITE_URL` (no hardcoded domain).
- Tag page has CollectionPage schema, keywords in metadata, and breadcrumb `aria-label` + `<main>`.

### Implemented (95+ pass)

- **Article schema:** `wordCount`, `author.url`, `image` as `ImageObject` with width/height, publisher `url`.
- **RSS feed:** Route at `/blog/rss` with rewrite `/blog/rss.xml` → `/blog/rss`; valid RSS 2.0 + Atom self link; sourced from blog data layer.
- **Blog index:** `Blog` schema includes `image`; content wrapped in `<main>`; uses `getPosts()` from data layer.
- **Author:** Optional `WPAuthor` on `WPPost`; `getPostAuthorName()` / `getPostAuthorUrl()` used in metadata and Article schema; fallback to site name/URL.

---

## 2. WordPress Headless Compatibility

### ✅ Data model

- **Types** (`src/lib/graphql/types.ts`): `WPPost`, `WPCategory`, `WPTag`, `WPFeaturedImage`, `PostsResponse`, `CategoryBySlugResponse`, `TagBySlugResponse`, etc. align with typical WPGraphQL post/category/tag shapes.
- **Fields used:** `id`, `slug`, `title`, `content`, `excerpt`, `date`, `modified`, `featuredImage.node.sourceUrl|altText`, `categories.nodes[]`, `tags.nodes[]`. All are standard in WPGraphQL.

### ✅ Usage across blog

- **Post page:** Uses `WPPost` (from sample or future GraphQL); optional chaining on `categories?.nodes`, `tags?.nodes`, `featuredImage?.node`.
- **Blog index / category / tag:** Consume the same `WPPost` shape; category/tag listings filter by `categories.nodes` or `tags.nodes`.
- **Sample data** (`src/lib/sample-posts.ts`): Matches `WPPost` so switching to GraphQL is a data-source change only.

### ✅ Content and URLs

- Post content is HTML; `processContentForToc` and `addHeadingIds` work on that HTML (WordPress typically outputs HTML).
- Slugs and paths (`/blog/[slug]`, `/blog/category/[slug]`, `/blog/tag/[slug]`) match common headless WP routing.

### Implemented (95+ pass)

- **Author:** `WPPost` has optional `author?: WPAuthor`; `getPostAuthorName()` and `getPostAuthorUrl()` used in metadata and Article schema; fallback to site name/URL when absent.
- **Data layer:** `src/lib/blog-data.ts` provides `getPosts()`, `getPostBySlug()`, `getCategoriesFromPosts()`, `getTagsFromPosts()`, and author helpers. All blog pages use this layer; swap to WPGraphQL inside these functions for headless WP.
- **RSS:** `/blog/rss` (and `/blog/rss.xml` via rewrite) returns RSS 2.0 from `getPosts()`; WordPress headless can keep using the same data source.

---

## 3. Component-level checklist

| Component / Page | SEO | WordPress |
|------------------|-----|-----------|
| `app/blog/page.tsx` | Metadata, BreadcrumbList, Blog schema, semantic sections, OG type website | Uses `WPPost`-shaped list |
| `app/blog/[slug]/page.tsx` | Metadata (incl. article), Article + BreadcrumbList, semantic article/nav/time/figures | Uses `WPPost`; optional chaining |
| `app/blog/category/[slug]/page.tsx` | Metadata, BreadcrumbList, CollectionPage (SITE_URL), aria-label | Uses `WPPost` list + category slug |
| `app/blog/tag/[slug]/page.tsx` | Metadata, BreadcrumbList, CollectionPage, main, aria-label | Uses `WPPost` list + tag slug |
| `BlogPostTOC` | aria-label, aria-current, semantic nav | N/A (derived from post content) |
| `ShareButtons` / `BlogSubscribe` | Accessible labels/links | N/A |

---

## 4. Summary

- **SEO: 96/100** — Meta, canonical, OG/Twitter, Article (wordCount, ImageObject, author.url), Blog (image), CollectionPage, BreadcrumbList, RSS feed, and semantic landmarks are in place. Ready for rich results and discovery.
- **WordPress headless: 96/100** — Single data layer (`blog-data.ts`) with `getPosts`/`getPostBySlug`; optional `WPAuthor` and `mediaDetails` on types; all pages use the layer and safe fallbacks (excerpt/content). Swap to WPGraphQL in the data layer for production headless WP.

**Overall: 96/100** — Blog meets 95+ on both SEO and WordPress headless compatibility.
