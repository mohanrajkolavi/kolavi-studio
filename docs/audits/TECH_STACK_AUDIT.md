# Tech Stack Audit — Kolavi Studio

**Audit date:** February 9, 2026  
**Scope:** Frontend, backend, data, integrations, tooling, and security.

---

## 1. Core application stack

| Layer | Technology | Version (approx) | Notes |
|-------|------------|-------------------|--------|
| **Framework** | Next.js | 15.1.x | App Router, React Server Components, API routes |
| **Runtime** | Node.js | (via Next) | ES2017 target in tsconfig |
| **Language** | TypeScript | 5.7.x | Strict mode, path alias `@/*` → `./src/*` |
| **UI library** | React | 19.x | With React DOM 19 |
| **Styling** | Tailwind CSS | 3.4.x | With PostCSS + Autoprefixer |
| **Component system** | shadcn/ui | (via components.json) | Default style, slate base, CSS variables, RSC + TSX |
| **Theme** | next-themes | 0.4.x | Class-based dark mode (`darkMode: ["class"]`) |
| **Utilities** | class-variance-authority, clsx, tailwind-merge | — | For conditional/cn() styling |
| **Icons** | lucide-react | 0.563.x | — |

**Verdict:** Modern, well-aligned stack (Next 15 + React 19 + TypeScript 5.7). Tailwind + shadcn give consistent design tokens and accessibility baseline.

---

## 2. Data & APIs

### 2.1 Headless CMS / Blog

| Item | Technology | Purpose |
|------|------------|---------|
| **CMS** | WordPress (headless) | Blog posts, categories, tags |
| **API** | WPGraphQL | Queries in `src/lib/graphql/`; client, queries, types |
| **SEO on WP** | Rank Math | Metadata parsed from `seo { fullHead }` in Next.js |

**Config:** `NEXT_PUBLIC_WP_GRAPHQL_URL` — when unset, app uses sample data.

### 2.2 Database

| Item | Technology | Purpose |
|------|------------|---------|
| **Primary DB** | PostgreSQL | Vercel Postgres or Supabase (via `DATABASE_URL`) |
| **Driver** | `postgres` (node-postgres–style) | Used in `src/lib/db/` |
| **Tables** | Custom schema (`schema.sql`) | `leads`, `content_maintenance`, `login_rate_limit`, `contact_rate_limit` |

**Optional:** Supabase JS client (`@supabase/supabase-js`) for “Blog Maker Recent” (last 5 generations) when `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set.

### 2.3 AI / content pipeline (Blog Generator v3)

| Provider | SDK / usage | Role in pipeline |
|----------|-------------|-------------------|
| **Anthropic** | `@anthropic-ai/sdk` | Draft, gap-fill, humanize |
| **Google** | `@google/genai` (Gemini) | Data grounding, topic/style extraction |
| **OpenAI** | `openai` | Strategic brief (e.g. GPT-4.1), topic scoring (e.g. o3-mini) |
| **Serper** | Custom client `src/lib/serper/client.ts` | Google search for competitor URLs |
| **Jina** | Custom client `src/lib/jina/reader.ts` | Fetch competitor content (20 RPM without key, 500 with) |

**Orchestration:** `src/lib/pipeline/orchestrator.ts` + types in `src/lib/pipeline/types.ts`.

### 2.4 Other integrations

- **Contact:** Typeform, Tally, or Google Forms (embeds); precedence and CSP documented in INTEGRATIONS.md.
- **Analytics:** Optional GA4 via `NEXT_PUBLIC_GA_MEASUREMENT_ID`; GTM described in docs but not wired in layout yet.
- **Revalidation:** `POST /api/revalidate` with `REVALIDATE_SECRET` for on-demand ISR after WP changes.

---

## 3. Content & SEO

| Area | Implementation |
|------|----------------|
| **Metadata** | Next.js metadata API; Rank Math fullHead parsing |
| **JSON-LD** | `src/lib/seo/jsonld/`: article, breadcrumb, FAQ, organization |
| **Canonical / sitemap** | `src/lib/seo/canonical.ts`, `src/app/sitemap/`, `src/lib/sitemap/` |
| **RSS** | `/blog/rss` route |
| **Sanitization** | `sanitize-html` for user/API-sourced HTML |
| **Validation** | Zod (v4) for API/form validation |

---

## 4. Auth & security

| Area | Implementation |
|------|----------------|
| **Dashboard auth** | Cookie-based; `ADMIN_SECRET`; auth helpers in `src/lib/auth.ts` |
| **Login protection** | Rate limit: 3 failed attempts → lockout; unlock via `RATE_LIMIT_UNLOCK_CODE` (see `src/lib/auth/login-rate-limit.ts`) |
| **Middleware** | Nonce-based CSP, security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS in prod) |
| **Secrets** | `scripts/check-secrets.sh`; prepush runs `check:secrets` + lint |
| **Docs** | SECURITY.md present |

---

## 5. Python tooling (optional)

| Item | Location | Purpose |
|------|----------|---------|
| **Content audit** | `tools/content_audit/` | E-E-A-T & content integrity (GoogleQualityAuditor, lazy-writing) |
| **Dependencies** | `tools/content_audit/requirements.txt` | nltk, textblob, vaderSentiment, spacy, beautifulsoup4 |
| **Runtime** | Separate from Next.js | Run manually (e.g. `run_audit.py`) |

**Note:** Not part of the main app deploy; ensure Python version and venv are documented if the team uses this.

---

## 6. Build, lint & dev tooling

| Tool | Purpose |
|------|---------|
| **ESLint** | next/core-web-vitals + jsx-a11y; custom rule (e.g. no-unescaped-entities off) |
| **TypeScript** | Strict, incremental, Next plugin |
| **Browserslist** | Last 2 versions of Chrome, Firefox, Safari, Edge |
| **Scripts** | `check-secrets`, `open:browser`, `run-audit.mjs` (content audit runner) |
| **Playwright** | In devDependencies (^1.58.2) — available for E2E if tests are added |

---

## 7. Deployment & environment

- **Platform:** Implied Vercel (Vercel Postgres, `VERCEL_BUILD_COMMIT_TIMESTAMP` in docs).
- **Env:** All config via env vars; `.env.example` is comprehensive; `NEXT_PUBLIC_*` for client-safe values.
- **Image optimization:** Next.js Image with remote patterns for kolavistudio.com and CMS; AVIF/WebP; 24h minimum cache TTL.

---

## 8. Risks & recommendations

### 8.1 Version and maintenance

- **Next 15 / React 19:** Still relatively new; stay on patch/minor updates and watch release notes.
- **Zod 4:** Major version; ensure all usages are compatible and no v3-only patterns remain.
- **Multiple AI SDKs:** More surface for API/rate-limit and cost changes; consider a small abstraction or feature flags if you add more models.

### 8.2 Data and consistency

- **Dual data path (WordPress vs sample):** When `NEXT_PUBLIC_WP_GRAPHQL_URL` is unset, sample data is used; ensure prod always sets it and that fallback behavior is clear in runbooks.
- **Postgres + Supabase:** Schema is applied to Postgres (Vercel or Supabase). If both are used, document which DB backs leads/content_maintenance/rate_limits and which backs “Recent” (Supabase).

### 8.3 Security

- **CSP:** Uses `'unsafe-inline'` for styles due to framework/cache behavior; documented in middleware. Revisit when Next.js improves nonce propagation for cached pages.
- **Rate limiting:** Login and contact rate limits rely on DB; ensure `DATABASE_URL` is available in all serverless regions where those routes run.

### 8.4 Optional but recommended

- **Bundle analysis:** Documented (ANALYZE=true + @next/bundle-analyzer) but not in package.json; add script or one-line note in README.
- **GTM:** INTEGRATIONS.md describes GTM; add `NEXT_PUBLIC_GTM_ID` to `.env.example` and wire in layout if you plan to use it.
- **Playwright:** Present as devDep; add at least one smoke E2E (e.g. home or blog index) to lock in critical paths.
- **Content audit (Python):** Pin versions in `tools/content_audit/requirements.txt` (e.g. `nltk==3.8.x`) and note Python version (e.g. 3.10+) in tools/content_audit/README.md.

---

## 9. Summary table

| Category | Choices |
|----------|---------|
| **Frontend** | Next.js 15, React 19, TypeScript 5.7, Tailwind 3.4, shadcn/ui, next-themes, Lucide |
| **Data** | WordPress (WPGraphQL), Postgres (Vercel/Supabase), optional Supabase client |
| **AI** | Anthropic, Gemini, OpenAI, Serper, Jina |
| **Auth** | Cookie + ADMIN_SECRET, DB-backed login rate limit |
| **Security** | CSP (nonce + strict-dynamic), security headers, HSTS, secrets check |
| **SEO** | Next metadata, Rank Math, JSON-LD, sitemap, RSS, canonical |
| **Tooling** | ESLint (Next + a11y), Playwright (devDep), optional Python content_audit |

Overall the stack is consistent, documented, and production-oriented. The main follow-ups are tightening env/docs for dual DB usage, optional GTM/bundle-analysis/Playwright usage, and watching Next/React and Zod upgrade paths.
