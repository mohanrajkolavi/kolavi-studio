# Codebase Audit – Kolavi Studio

**Date:** February 3, 2026  
**Scope:** Next.js 15 App Router site, headless WordPress blog, SEO, security, and DX.

---

## Executive Summary

The Kolavi Studio codebase is **well-structured**, **documented**, and **production-oriented**. Architecture is clear (blog data layer, GraphQL client, SEO utilities), security and SEO are considered (CSP, sanitization, metadata, sitemap), and the project builds and lints successfully. Main gaps: **no automated tests**, **lockfile/version warnings**, and a few **hardening opportunities** (GraphQL client with empty URL, env-driven image hosts).

---

## 1. Architecture & Structure

| Area | Status | Notes |
|------|--------|--------|
| App Router | ✅ | Consistent use of `app/` routes, `generateMetadata`, `generateStaticParams`, `revalidate`. |
| Data layer | ✅ | Single blog entry point in `src/lib/blog/data.ts`; WP vs sample data and caching are centralized. |
| Lib organization | ✅ | `graphql/` (client, queries, types), `seo/` (metadata, JSON-LD, canonical, rank-math), `blog-utils` (sanitize, TOC). |
| Constants | ✅ | `src/lib/constants.ts` for site name, URL, nav; env via `NEXT_PUBLIC_*` only. |

**Recommendation:** Keep the current separation. Consider moving `BlogContent.tsx` from `app/blog/` to `components/blog/` if it’s purely presentational (it’s a client component with no route-specific logic).

---

## 2. Security

| Area | Status | Notes |
|------|--------|--------|
| Headers | ✅ | `middleware.ts` sets X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP. |
| CSP | ⚠️ | Uses `'unsafe-inline'` for scripts (documented for Next/GA). Consider moving to nonce-based CSP when feasible. |
| Secrets | ✅ | No secrets in repo; `.env.example` placeholders only; `REVALIDATE_SECRET` for on-demand revalidation. |
| API revalidate | ✅ | Bearer token check; 501 if secret unset, 401 on invalid/missing. |
| HTML content | ✅ | Post body sanitized via `isomorphic-dompurify` in `blog-utils.ts` (allowlist tags/attrs). |
| Env | ✅ | Only `NEXT_PUBLIC_*` used; docs and `.gitignore` align with SECURITY.md. |

**Recommendations:**

- Plan a path to CSP without `'unsafe-inline'` (e.g. nonces for Next.js and GA).
- Keep `REVALIDATE_SECRET` strong and rotated if ever exposed.

---

## 3. SEO & Metadata

| Area | Status | Notes |
|------|--------|--------|
| Metadata | ✅ | `getBaseMetadata()` / `getPageMetadata()` with canonical, OG, Twitter, robots. |
| JSON-LD | ✅ | Organization (layout), Article, Breadcrumb, CollectionPage (tags); FAQ where used. |
| Sitemap | ✅ | Index + static, posts, categories, tags; `unstable_cache`; protocol-aware (loc length, escaping). |
| RSS | ✅ | `/blog/rss` with Cache-Control. |
| Rank Math | ✅ | `rank-math-parser.ts` parses WordPress fullHead for meta/OG/twitter overrides. |

No issues identified; implementation matches docs and common best practices.

---

## 4. Data & WordPress

| Area | Status | Notes |
|------|--------|--------|
| GraphQL client | ✅ | Timeout, retries, backoff in `src/lib/graphql/client.ts`. |
| Empty WP URL | ⚠️ | `GraphQLClient` is built with `WP_GRAPHQL_URL` (can be `""`). All callers guard with `WP_GRAPHQL_URL?.trim()`, so `request()` is never called with empty URL. Low risk; optional hardening: lazy-init client only when URL is set. |
| Caching | ✅ | `unstable_cache` (60s) for posts, post-by-slug, category, category-slugs; tags derived from posts. |
| Pagination | ✅ | `fetchAllPostSlugs()` paginates (100 per page, MAX_PAGES 500) for sitemap/static params. |
| Fallback | ✅ | On GraphQL errors, blog data falls back to sample posts; category/tag to null or derived from posts. |

**Recommendation:** Optionally lazy-create the GraphQL client so it’s only instantiated when `WP_GRAPHQL_URL` is non-empty.

---

## 5. Configuration & Tooling

| Area | Status | Notes |
|------|--------|--------|
| TypeScript | ✅ | `strict: true`, path alias `@/*`. |
| ESLint | ✅ | `next/core-web-vitals`, `jsx-a11y`; no lint errors. |
| Next lint | ⚠️ | Deprecation warning: “next lint” removed in Next 16; migrate to ESLint CLI (see Next.js codemod). |
| Lockfiles | ⚠️ | Both `package-lock.json` and `pnpm-lock.yaml` detected; Next infers root and warns. Prefer a single package manager and remove the other lockfile, or set `outputFileTracingRoot` in `next.config.ts`. |
| @next/swc | ⚠️ | Version mismatch (15.5.7 vs 15.5.11). Run `npm update` or align versions to clear warning. |
| next.config | ✅ | Rewrites for sitemap/RSS; `images.remotePatterns` with explicit hostnames. |
| Image hosts | ⚠️ | `kolavistudio.com`, `www.kolavistudio.com`, `cms.kolavistudio.com`, `localhost` are hardcoded. For portability, consider driving allowed hosts from env (e.g. `NEXT_PUBLIC_IMAGE_DOMAINS`). |

**Recommendations:**

- Resolve lockfile strategy and set `outputFileTracingRoot` if keeping multiple roots.
- Run `npm update` (or equivalent) so `@next/swc` matches Next.js.
- Migrate off `next lint` to the ESLint CLI before Next 16.
- Consider env-based image host allowlist for different environments.

---

## 6. Accessibility & UX

| Area | Status | Notes |
|------|--------|--------|
| Skip link | ✅ | “Skip to main content” in root layout with focus styles. |
| Landmarks | ✅ | `<main id="main-content">`, semantic `<article>`, `<nav aria-label="Breadcrumb">`. |
| jsx-a11y | ✅ | ESLint plugin enabled. |
| Focus | ✅ | Skip link and buttons are keyboard reachable. |

No critical a11y issues observed.

---

## 7. Error Handling & Resilience

| Area | Status | Notes |
|------|--------|--------|
| Error boundary | ✅ | `error.tsx` with “Try again”, “Go home”, “Blog”. |
| 404 | ✅ | `not-found.tsx` with links. |
| GraphQL | ✅ | Try/catch in lib/blog/data.ts with fallback to sample data or null; console.error for debugging. |
| Revalidate API | ✅ | Try/catch; 500 with message on failure. |

Handling is consistent and user-friendly.

---

## 8. Gaps & Recommendations

### High priority

1. **Tests**  
   - No unit or integration tests found.  
   - Add tests for: `blog-utils` (sanitize, TOC, stripHtml), `rank-math-parser`, `sitemap-index` XML builders, and critical `lib/blog/data.ts` paths (e.g. fallback when WP fails).  
   - Consider Playwright or Cypress for critical routes (home, blog index, one post, one category).

### Medium priority

2. **Lockfile & Next.js root**  
   - Use one package manager and remove the other lockfile, or set `outputFileTracingRoot` and document the choice.

3. **Dependency alignment**  
   - Align `@next/swc` with Next.js (e.g. 15.5.11) via `npm update` or pinned versions.

4. **Lint migration**  
   - Run `npx @next/codemod@canary next-lint-to-eslint-cli` and switch to ESLint CLI.

### Low priority

5. **GraphQL client**  
   - Lazy-initialize the client only when `WP_GRAPHQL_URL?.trim()` is set to avoid constructing with an empty URL.

6. **Image remotePatterns**  
   - Make allowed hosts configurable via env for staging and multi-domain setups.

7. **CSP**  
   - When feasible, move to nonce-based script CSP and remove `'unsafe-inline'`.

---

## 9. Build & Lint Results

- **Lint:** Passes (no ESLint errors/warnings).
- **Build:** Succeeds; 28 static/dynamic routes generated; ISR and sitemap routes behave as expected.
- **Warnings:** Next lint deprecation, lockfile root inference, @next/swc version mismatch (see §5).

---

## 10. Summary Table

| Category        | Grade | Summary |
|----------------|-------|--------|
| Architecture   | A     | Clear layers, single blog data entry point, good separation. |
| Security       | A-    | Strong headers and secrets; CSP uses unsafe-inline (documented). |
| SEO            | A     | Metadata, JSON-LD, sitemap, RSS, Rank Math parsing. |
| Data/Resilience| A     | Caching, fallbacks, pagination, error handling. |
| Config/DX      | B+    | TypeScript and ESLint solid; lockfile and version warnings. |
| A11y           | A     | Skip link, landmarks, jsx-a11y. |
| Testing        | F     | No automated tests; highest-impact improvement. |

Overall the codebase is in good shape for production. Addressing tests, lockfile/version warnings, and the small hardening items above will further improve maintainability and safety.
