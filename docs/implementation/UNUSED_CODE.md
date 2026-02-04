# Unused Code Audit

Findings from a static usage search. Safe to remove or refactor as noted.

---

## Line counts (used / unused)

| Scope | Total | Used | Unused |
|-------|-------|------|--------|
| **TS + TSX** (src) | 5,667 | 5,497 | 170 |
| **Entire unused files** | — | — | 170 |
| **Unused exports** (in used files) | — | — | ~100 |
| **CSS** (globals.css) | 107 | 107 | 0 |
| **Total source** | **5,774** | **~5,604** | **~170** |

- **Used:** All code in files that are imported or run (routes, layout, etc.), minus the 3 entire unused files.
- **Unused (whole files):** 13 + 34 + 123 = **170 lines** in `canonical.ts`, `CTAStrip.tsx`, `sheet.tsx`. *(StickyShareBar.tsx removed.)*
- **Unused (exports only):** ~100 lines of removable dead code in used files (unused GraphQL queries, types, `getSamplePostBySlug`, etc.). Removing these does not change line count of “used” files; it just shrinks those files.

---

## 1. Entire files never imported

| File | Contents | Action |
|------|----------|--------|
| `src/lib/seo/canonical.ts` | `getCanonicalUrl(path)` | **Remove file** or use it in metadata (e.g. `metadata.ts` uses `SITE_URL + path` inline; could switch to this helper). |
| `src/components/layout/CTAStrip.tsx` | `CTAStrip` – CTA strip with title, description, button | **Remove file** if you don’t plan to use it; or add to a page (e.g. footer/layout). |
| `src/components/ui/sheet.tsx` | `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` (shadcn) | **Remove file** if you don’t need slide-over panels; or use for mobile nav / modals. |
| ~~`src/components/blog/StickyShareBar.tsx`~~ | ~~`StickyShareBar`~~ | **Removed.** |

---

## 2. Unused exports (file is used elsewhere)

### `src/lib/blog/sample-posts.ts`
- **`getSamplePostBySlug(slug)`** – never imported.  
  Blog uses `getPostBySlug()` from `lib/blog/data.ts`, which uses `SAMPLE_POSTS` directly when WP is unset (no call to `getSamplePostBySlug`).  
  **Action:** Remove `getSamplePostBySlug` (or keep only if you want a public API for sample data). Reviewers: see `getSamplePostBySlug`, `getPostBySlug`, and `SAMPLE_POSTS` in this module.

### `src/lib/graphql/queries.ts`
- **`GET_CATEGORIES`** – full categories query; never used (category slugs come from `GET_ALL_CATEGORY_SLUGS` or posts).
- **`GET_TAGS`** – full tags query; never used (tag slugs from `GET_ALL_TAG_SLUGS` or posts).
- **`GET_TAG_BY_SLUG`** – single tag by slug; never used (tag pages use `getTagsFromPosts` / filter posts).
- **`GET_ALL_POST_SLUGS`** – non-paginated 1000-post slug query; never used (code uses `GET_POST_SLUGS_PAGE` + pagination).  

**Action:** Remove these four constants if you’re sure you won’t add features that need them (e.g. a dedicated tag-by-slug API).

### `src/lib/graphql/types.ts`
- **`CategoriesResponse`** – never imported (sitemap uses inline `{ categories: { nodes: ... } }`).
- **`TagsResponse`** – never imported (same).
- **`TagBySlugResponse`** – never imported (tag pages don’t call WP for a single tag).  

**Action:** Remove these three interfaces, or keep for future typed `request<TagsResponse>(GET_TAGS)` etc.

### `src/lib/seo/jsonld/faq.ts`
- **`FAQItem`** – exported interface never imported; `getFAQSchema` is used (e.g. contact page) with inline data.  
**Action:** Remove export (keep interface internal) or leave for typing FAQ data elsewhere.

### `src/app/blog/BlogContent.tsx`
- **`BlogCategory`** – exported type; only used as the prop type inside `BlogContent`. No other file imports it.  
**Action:** Make it a non-exported interface if you don’t need it from outside.

### `src/components/ui/card.tsx`
- **`CardFooter`** – never imported (tag/portfolio/services/Testimonials use Card, CardHeader, CardTitle, CardContent, CardDescription only).  
**Action:** Remove from barrel export if you want a leaner API; or keep for future use (shadcn pattern).

### `src/components/ui/button.tsx`
- **`buttonVariants`** – never imported. Used only inside the file for `<Button>`.  
**Action:** Often kept in shadcn projects for custom components that need the same variants; optional to remove export.

### `src/lib/blog-utils.ts`
- **`extractHeadings(html)`** – only used inside `processContentForToc` in the same file.
- **`addHeadingIds(html, headings)`** – same.  
**Action:** Remove exports and keep as module-private helpers, or leave exported for tests/tooling.

### `src/lib/seo/rank-math-parser.ts`
- **`ParsedRankMathHead`** – return type of `parseRankMathFullHead`; no file imports this type.  
**Action:** Remove export or keep for consumers that want to type the parsed result.

---

## 3. Unused props / variants

### `src/app/blog/BlogSubscribe.tsx`
- **`variant`** – component accepts `variant?: "default" | "dark"` but all call sites use `<BlogSubscribe />` (default).  
**Action:** Remove `variant` and any "dark" styling, or use it on a specific page (e.g. dark section).

---

## 4. Summary

| Type | Count | Suggested action |
|------|--------|-------------------|
| Unused files | 3 | Delete or start using (canonical.ts, CTAStrip, sheet). |
| Unused exports | 12+ | Remove or make internal (queries, types, helpers, UI exports). |
| Unused prop/variant | 1 | Remove or use (BlogSubscribe `variant`). |

**Low-risk clean-up:** Remove `getSamplePostBySlug`, the four unused GraphQL queries, `CategoriesResponse` / `TagsResponse` / `TagBySlugResponse`, and the four unused files if you don’t plan to use them.  
**Optional:** Keep shadcn re-exports (`buttonVariants`, `CardFooter`, `Sheet`) if you prefer API consistency or future use.
