# Codebase: Used vs Unused (Safe to Delete)

**Summary:** What is used in the app vs what is never imported and can be removed without affecting behavior.

---

## Totals

| Metric | Count |
|--------|--------|
| **TS/TSX files (src)** | 64 |
| **Total lines (TS/TSX)** | ~6,098 |
| **Unused whole files** | 3 |
| **Lines in unused files** | ~170 |

---

## 1. Unused files (safe to delete)

These files are **never imported** anywhere. Deleting them has **no effect** on the app.

| File | What it does | Action |
|------|--------------|--------|
| `src/lib/seo/canonical.ts` | `getCanonicalUrl(path)` helper | **Delete** – metadata uses inline `SITE_URL + path` instead. |
| `src/components/layout/CTAStrip.tsx` | CTA strip (title, description, button) | **Delete** – not used in layout or any page. |
| `src/components/ui/sheet.tsx` | Sheet/SheetContent/SheetHeader/SheetTitle (slide-over) | **Delete** – not used (e.g. mobile nav uses different pattern). |

**To remove all three:**

```bash
rm src/lib/seo/canonical.ts
rm src/components/layout/CTAStrip.tsx
rm src/components/ui/sheet.tsx
```

---

## 2. Unused exports (optional cleanup)

These **files are used**, but some **exports** inside them are never imported. Removing these exports only shrinks the files; behavior stays the same.

| File | Unused export(s) | Action |
|------|-------------------|--------|
| `src/lib/blog/sample-posts.ts` | `getSamplePostBySlug(slug)` | Remove function (blog uses `getPostBySlug` from `data.ts`). |
| `src/lib/graphql/queries.ts` | `GET_CATEGORIES`, `GET_TAGS`, `GET_TAG_BY_SLUG`, `GET_ALL_POST_SLUGS` | Remove if you won’t add features that need them. |
| `src/lib/graphql/types.ts` | `CategoriesResponse`, `TagsResponse`, `TagBySlugResponse` | Remove or keep for future typed requests. |
| `src/lib/seo/jsonld/faq.ts` | `FAQItem` (interface) | Remove export or keep internal. |
| `src/components/blog/BlogContent.tsx` | `BlogCategory` (type) | Make non-exported if only used in this file. |
| `src/components/ui/card.tsx` | `CardFooter` | Remove from exports or keep for future use. |
| `src/components/ui/button.tsx` | `buttonVariants` | Optional; often kept for custom components. |
| `src/lib/blog/utils.ts` | `extractHeadings`, `addHeadingIds` | Used only inside file; can remove export. |
| `src/lib/seo/rank-math-parser.ts` | `ParsedRankMathHead` | Remove export or keep for typing. |

---

## 3. Used code (do not delete)

- **Pages:** All under `src/app/` (layout, pages, blog, sitemap, api, etc.) are used.
- **Components:** `Header`, `Footer`, `MobileNav`, `Hero`, `CTA`, `Benefits`, `Process`, `Testimonials`, `FAQ`, `BlogContent`, `BlogPostTOC`, `BlogSubscribe`, `ShareButtons`, `TypeformEmbed`, `ThemeProvider`, `ThemeToggle`, `button`, `card`, `input`, `textarea` – all imported and used.
- **Lib:** `constants`, `utils`, `blog/data`, `blog/sample-posts` (SAMPLE_POSTS used), `blog/utils`, `graphql/client`, `graphql/queries` (used queries), `graphql/types` (used types), `seo/metadata`, `seo/rank-math-parser`, `seo/jsonld/*`, `sitemap-index` – all used.
- **Middleware, types, globals.css** – used.

---

## 4. Quick reference

| Type | Count | Safe to delete? |
|------|--------|------------------|
| Unused **files** | 3 | Yes – no imports. |
| Unused **exports** | 12+ | Optional – only reduces dead code. |

**Low-risk cleanup:** Delete the 3 unused files above. Optionally remove the unused exports listed in §2 for a leaner codebase.
