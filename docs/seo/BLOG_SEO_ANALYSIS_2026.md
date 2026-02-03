# Blog SEO & WordPress Headless Compliance Analysis

**Date:** February 1, 2026  
**Scope:** Blog index (`/blog`), individual post (`/blog/[slug]`), category, tag, and related components.

---

## Overall Scores

| Category | Score | Grade |
|----------|-------|-------|
| **SEO Compliance** | **88/100** | B+ |
| **WordPress Headless Compliance** | **85/100** | B |

---

## 1. SEO Compliance Analysis (88/100)

### ✅ Strengths

| Item | Status |
|------|--------|
| **Metadata** | Blog and post pages use `getPageMetadata()` with title, description, canonical URL, keywords |
| **Canonical URLs** | `alternates.canonical` set for all pages via `SITE_URL` |
| **Open Graph** | OG tags: title, description, image, type (website/article), url |
| **Twitter Cards** | `summary_large_image`, title, description |
| **Robots** | index: true, follow: true by default |
| **BreadcrumbList schema** | Blog index, post, category, tag pages |
| **Blog schema** | Blog index has `@type: Blog` with blogPost list |
| **Article schema** | Post page has Article with headline, datePublished, dateModified, author, publisher, image, wordCount |
| **CollectionPage schema** | Category and tag pages |
| **RSS feed** | `/blog/rss.xml` → valid RSS 2.0 with Atom self link |
| **Semantic HTML** | `<main>`, `<article>`, `<nav aria-label="Breadcrumb">`, `<time dateTime>` |
| **Single H1** | Each page has one H1 |
| **Image alt text** | Images use `altText` or post title fallback |
| **Internal links** | Next.js `<Link>` for in-app navigation |
| **External links** | `rel="noopener noreferrer"` on social links |
| **ISR / Revalidate** | revalidate: 60 on blog pages |

### ⚠️ Deductions (-12 points)

| Issue | Points | Notes |
|-------|--------|-------|
| **Article schema author** | -3 | Uses `@type: Organization` instead of `Person` for author; Google prefers Person for articles |
| **Featured image figcaption** | -2 | Post page uses `<figure>` but no `<figcaption>` for featured image (accessibility/SEO) |
| **Sitemap–data mismatch** | -4 | Sitemap uses GraphQL `request()`; blog uses `getPosts()` from sample data. If WP not connected, post/category/tag URLs are missing from sitemap |
| **Category page `<main>`** | -1 | Category page lacks explicit `<main>` wrapper; tag page has it |
| **Blog index meta description length** | -1 | 160 chars is fine; could be 150–155 for cleaner truncation |
| **RSS `atom:link` href** | -1 | Uses `/blog/rss` but rewrite serves `/blog/rss.xml`; some readers expect `.xml` in self link |

---

## 2. WordPress Headless Compliance (85/100)

### ✅ Strengths

| Item | Status |
|------|--------|
| **WPPost type** | Matches WPGraphQL post shape: id, slug, title, content, excerpt, date, modified |
| **WPFeaturedImage** | node.sourceUrl, altText, mediaDetails (width/height) |
| **WPCategory / WPTag** | nodes array with slug, name |
| **WPAuthor** | Optional; node.name, slug, url used in SEO |
| **Data layer** | Single `blog-data.ts` with getPosts, getPostBySlug, getCategoriesFromPosts |
| **Optional chaining** | Safe access: categories?.nodes, featuredImage?.node |
| **GraphQL queries** | GET_POSTS, GET_POST_BY_SLUG, GET_CATEGORY_BY_SLUG ready in `queries.ts` |
| **Response types** | PostsResponse, CategoryBySlugResponse, TagBySlugResponse |
| **Content format** | HTML content; processContentForToc works with WP output |
| **URL structure** | /blog/[slug], /blog/category/[slug], /blog/tag/[slug] align with WP |
| **RSS** | Uses getPosts() from data layer; swap works with WP |

### ⚠️ Deductions (-15 points)

| Issue | Points | Notes |
|-------|--------|-------|
| **Data source** | -5 | Currently SAMPLE_POSTS; GraphQL not wired. blog-data.ts has TODO for WP swap |
| **Sitemap GraphQL** | -4 | Sitemap calls GraphQL directly, not blog-data; fails when WP offline |
| **Category source** | -3 | Category page uses local CATEGORIES map + post filter; WP would use category query |
| **Pagination** | -2 | No cursor/pageInfo for post list; WP headless typically paginates |
| **Author node** | -1 | WP returns Person; schema uses Organization |

---

## 3. Recommendations

### High priority
1. **Fix sitemap** – Use `getPosts()` and `getCategoriesFromPosts()` from blog-data for sitemap when GraphQL unavailable; or unify data source.
2. **Article author** – Use `@type: Person` in Article schema when author is an individual.

### Medium priority
3. Add `<figcaption>` to featured image on post page.
4. Add `<main>` wrapper to category page.
5. Align RSS self link with served URL (rss.xml vs rss).

### Low priority
6. Wire blog-data to WPGraphQL when WordPress is deployed.
7. Add pagination support for blog index if post count grows.

---

## 4. Summary

- **SEO: 88/100** – Strong meta, schema, and semantic structure. Main gaps: sitemap–data mismatch, Article author type, figcaption.
- **WordPress headless: 85/100** – Types and data layer are WP-ready. Sitemap and category logic need alignment with blog-data; GraphQL swap is straightforward.

**Overall: 86.5/100** – Blog is well-structured for SEO and headless WP; a few fixes would bring it to 95+.
