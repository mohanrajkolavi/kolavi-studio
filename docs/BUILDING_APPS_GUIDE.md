# Building Apps: A Complete Guide (1 → ∞)

> A structured, step-by-step guide for building robust applications—whether you're new to Cursor or an experienced developer. Covers design, UX, security, performance, AI/ML, stability, and ongoing maintenance. **Detailed explanations, tips, and best practices included.**

---

## Table of Contents

1. [How to Use This Guide](#how-to-use-this-guide)
2. [Phase 1: Foundation](#phase-1-foundation-steps-1-10)
3. [Phase 2: Design & UX](#phase-2-design--ux-steps-11-20)
4. [Phase 3: Security](#phase-3-security-steps-21-30)
5. [Phase 4: Performance](#phase-4-performance-steps-31-40)
6. [Phase 5: AI & ML](#phase-5-ai--ml-steps-41-50)
7. [Phase 6: Stability & Reliability](#phase-6-stability--reliability-steps-51-60)
8. [Phase 7: Testing](#phase-7-testing-steps-61-70)
9. [Phase 8: Deployment & DevOps](#phase-8-deployment--devops-steps-71-80)
10. [Phase 9: Monitoring & Observability](#phase-9-monitoring--observability-steps-81-90)
11. [Phase 10: Growth & Scale](#phase-10-growth--scale-steps-91-100)
12. [Phase ∞: Ongoing](#phase--ongoing-steps-101)
13. [Cursor-Specific Tips](#cursor-specific-tips)
14. [Quick Reference](#quick-reference)

---

## How to Use This Guide

### Who Is This For?

| Audience | Suggested Path | Estimated Time |
|----------|----------------|----------------|
| **New to Cursor** | Start at Phase 1; use Cursor's chat to implement each step | 2–4 weeks |
| **New to building apps** | Phases 1–2 (Foundation + Design) | 3–4 weeks |
| **Experienced dev** | Skim 1–2; focus on Phases 3–5 (Security, Performance, AI) | 1–2 weeks |
| **Preparing for production** | Phases 6–9 (Stability, Testing, Deployment, Monitoring) | 2–3 weeks |
| **Scaling an existing app** | Phases 10 and ∞ | Ongoing |

### Core Principles

- **Incremental** — Each step builds on the previous; you don't need everything at once.
- **Prioritized** — Security and core UX come before advanced features.
- **Practical** — Focus on what you can implement and ship.
- **Iterative** — Ship small, learn, improve.

### Document Conventions

- **What** — Definition of the concept or task
- **Why** — Reason it matters
- **How** — Step-by-step implementation
- **Tip** — Practical advice from experience
- **Warning** — Common pitfalls to avoid
- **Example** — Code or scenario illustration

---

## Phase 1: Foundation (Steps 1–10)

### Step 1: Define the Problem

**What:** Clearly articulate the problem your app solves and for whom.

**Why:** Without a clear problem statement, you'll build features nobody needs, scope will creep, and the team will drift. A well-defined problem keeps everyone aligned and makes prioritization easier.

**How:**

1. **Write a one-paragraph problem statement:**
   - Who has the problem?
   - What is the problem?
   - Why does it matter?
   - What would success look like?

2. **Define 3–5 user personas:**
   - Demographics, goals, pain points
   - Technical comfort level
   - Where they spend time (devices, channels)

3. **Set success metrics:**
   - Quantitative: signups, conversions, retention
   - Qualitative: user feedback, support tickets

**Example Problem Statement:**
> "Small business owners spend 5+ hours/week on repetitive marketing tasks. They lack design skills and budget for agencies. Our app will automate 80% of these tasks with AI, letting them focus on running their business. Success = 1,000 active users in 6 months with 40% weekly retention."

**Tip:** Use the format: *"As a [user], I want [goal] so that [benefit]."*

**Warning:** Don't skip this step. "We'll figure it out as we build" leads to wasted effort.

---

### Step 2: Scope the MVP

**What:** Decide the minimum set of features for the first release.

**Why:** Shipping small and iterating is faster and less risky than building everything upfront. An MVP validates assumptions with real users and generates feedback for the next iteration.

**How:**

1. **List all potential features** — Brainstorm everything the app could do.
2. **Categorize:**
   - **Must-have (v1):** Core value; app is useless without it
   - **Should-have (v1.1):** Important but not blocking
   - **Nice-to-have (backlog):** Can wait

3. **Apply the "one-week test":** If you had one week to ship, what would you build? That's your MVP.

4. **Write user stories** for each must-have feature.

**Example MVP Scope (E-commerce):**
- Must-have: Browse products, add to cart, checkout, basic auth
- Should-have: Search, filters, order history
- Nice-to-have: Reviews, wishlist, recommendations

**Tip:** If you can't explain why a feature is in v1 in one sentence, it probably isn't essential.

**Warning:** Resist the urge to add "just one more" feature. Each addition delays launch and increases complexity.

---

### Step 3: Choose Your Tech Stack

**What:** Select frameworks, languages, and services for the project.

**Why:** Consistency and familiarity speed up development. The right stack reduces friction and lets you focus on product, not infrastructure.

**Detailed Stack Guide:**

| Layer | Options | Pros | Cons | When to Use |
|-------|---------|------|------|-------------|
| **Frontend** | Next.js | Full-stack, SSR, great DX | Opinionated | Most React apps |
| | Remix | Data loading, nested routes | Smaller ecosystem | Data-heavy apps |
| | Nuxt | Vue ecosystem, SSR | Vue-specific | Vue teams |
| | SvelteKit | Small bundle, fast | Smaller ecosystem | Performance-critical |
| **Backend** | Next.js API routes | Same repo, serverless | Tied to Next | Next.js projects |
| | Express/Fastify | Flexible, mature | More setup | Standalone APIs |
| | FastAPI | Async, Python, OpenAPI | Python ecosystem | ML/AI-heavy, Python teams |
| **Database** | Postgres (Supabase) | Auth, realtime, SQL | Vendor lock-in | Rapid development |
| | Postgres (Neon/Vercel) | Serverless, branching | Newer | Next.js on Vercel |
| | SQLite (Turso) | Simple, edge-ready | Scale limits | Small apps, edge |
| **Auth** | Supabase Auth | Built-in, social logins | Supabase dependency | Supabase projects |
| | NextAuth | Flexible, many providers | More config | Next.js, multi-provider |
| | Clerk | Polished UX, easy | Cost at scale | B2B, polished auth |
| **Hosting** | Vercel | Zero-config, edge | Vendor lock-in | Next.js, JAMstack |
| | Railway | Simple, DB included | Less control | Full-stack, quick deploy |
| | Fly.io | Global, containers | More ops | Multi-region, Docker |

**Decision Framework:**
1. What does your team know? Prefer familiarity for speed.
2. What's your scale? Start simple; optimize later.
3. What's your budget? Managed services cost more but save time.
4. What are your constraints? Compliance, latency, region?

**Tip:** Prefer managed services (Supabase, Vercel) early; optimize later if needed. Don't over-engineer for scale you don't have.

**Example Stack (SaaS Dashboard):**
- Next.js 15 (App Router) + React 19
- Supabase (Postgres + Auth)
- Vercel (hosting)
- Tailwind + shadcn/ui

---

### Step 4: Project Setup

**What:** Initialize the repo, tooling, and basic configuration.

**Why:** A clean setup prevents "works on my machine" issues, makes collaboration easier, and ensures consistent environments.

**Detailed Checklist:**

1. **Create Git repository:**
   ```bash
   git init
   git remote add origin <url>
   ```

2. **Initialize project:**
   ```bash
   npx create-next-app@latest my-app --typescript --tailwind --eslint --app
   ```

3. **Configure `.gitignore`:**
   - `.env`, `.env.local`, `.env.*`
   - `node_modules/`, `.next/`, `dist/`
   - IDE files, OS files

4. **Create `.env.example`:**
   - List every env var with placeholder values
   - Add comments explaining each
   - No real secrets

5. **Add `README.md`:**
   - Project description
   - Prerequisites
   - Setup instructions (`npm install`, `cp .env.example .env.local`)
   - How to run dev server
   - How to run tests

6. **Pre-push hook (optional but recommended):**
   - Block commits that include `.env` or `.env.local`
   - Run linter before push

**Example `.env.example`:**
```env
# Database (required for API routes)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Supabase (required for auth)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Admin dashboard (required for /dashboard)
ADMIN_SECRET=your-secret-here
```

**Tip:** Never commit `.env` or `.env.local`. Use a pre-push hook to block them. See `scripts/check-secrets.sh` in this project for an example.

**Warning:** Double-check `.gitignore` before first commit. Once secrets are pushed, consider them compromised.

---

### Step 5: Project Structure

**What:** Organize folders and files in a predictable, scalable way.

**Why:** Good structure makes navigation easy, refactors safer, and onboarding faster. Poor structure leads to circular imports and "where does this go?" confusion.

**Recommended Structure (Next.js App Router):**

```
src/
├── app/                    # Routes, layouts, pages
│   ├── (auth)/             # Auth group: login, signup
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/        # Protected dashboard group
│   │   └── dashboard/
│   ├── api/                # API routes
│   │   ├── auth/
│   │   ├── leads/
│   │   └── ...
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home
│   └── error.tsx           # Error boundary
├── components/
│   ├── ui/                 # Primitives (Button, Input, Card)
│   ├── layout/             # Header, Footer, Sidebar
│   └── features/           # Feature-specific (ContactForm, etc.)
├── lib/                    # Utilities, DB, auth, API clients
│   ├── db/
│   ├── auth.ts
│   └── utils.ts
├── types/                  # TypeScript types/interfaces
└── styles/
    └── globals.css
```

**Conventions:**
- `lib/` = pure logic, no UI
- `components/` = React components only
- `app/api/` = one folder per resource
- Colocate related files (e.g., `page.tsx` + `layout.tsx` in same folder)

**Tip:** Keep `lib/` for logic; keep `components/` for UI. Avoid mixing them. If a component needs business logic, extract it to `lib/` and import.

**Warning:** Avoid deep nesting (more than 4 levels). Prefer flat structure with clear naming.

---

### Step 6: Environment & Configuration

**What:** Manage environment variables and configuration for each environment (dev, staging, prod).

**Why:** Secrets must never be in code. Different environments need different configs. Failing fast on missing config prevents cryptic runtime errors.

**Detailed Checklist:**

1. **Document every env var in `.env.example`:**
   - Variable name
   - Description
   - Example value (fake)
   - Required vs optional

2. **Naming conventions:**
   - `NEXT_PUBLIC_*` = exposed to browser (URLs, public keys)
   - No prefix = server-only (secrets, DB URLs)

3. **Validation at startup:**
   ```typescript
   // lib/env.ts
   const required = ['DATABASE_URL', 'ADMIN_SECRET'] as const;
   for (const key of required) {
     if (!process.env[key]) throw new Error(`${key} is required`);
   }
   ```

4. **Environment-specific config:**
   - Dev: relaxed CORS, verbose logging
   - Prod: strict CORS, minimal logging

**Tip:** Fail fast if required env vars are missing. Don't let the app start and fail later in a random route.

**Warning:** Never log env vars. Never pass secrets to client components. Never commit `.env.local`.

---

### Step 7: Database Schema

**What:** Design tables, relationships, indexes, and constraints.

**Why:** A good schema supports efficient queries, enforces data integrity, and makes migrations easier. A bad schema leads to N+1 queries, duplicate data, and migration nightmares.

**Design Process:**

1. **Identify entities:** Users, Orders, Products, etc.
2. **Define relationships:** One-to-many, many-to-many
3. **Add columns:** Include `id`, `created_at`, `updated_at` for audit
4. **Add indexes:** For columns in `WHERE`, `ORDER BY`, `JOIN`
5. **Add constraints:** `NOT NULL`, `UNIQUE`, `FOREIGN KEY`, `CHECK`

**Index Guidelines:**
- Index columns used in `WHERE` clauses
- Index columns used in `ORDER BY`
- Index foreign keys
- Composite indexes for multi-column queries (order matters)
- Don't over-index: each index slows writes

**Example Schema (Leads + Rate Limit):**
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

CREATE TABLE contact_rate_limit (
  ip_hash VARCHAR(64) PRIMARY KEY,
  request_count INT NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL
);
```

**Tip:** Index columns used in `WHERE`, `ORDER BY`, and `JOIN` clauses. Use `EXPLAIN ANALYZE` to verify query plans.

**Warning:** Don't add indexes "just in case." Each index has a cost. Add based on actual query patterns.

---

### Step 8: Authentication (If Needed)

**What:** Implement signup, login, session handling, and password reset.

**Why:** Most apps need to identify users. Auth protects data and enables personalization. Doing it wrong leads to security vulnerabilities.

**Checklist:**

1. **Session storage:**
   - Prefer httpOnly cookies (not localStorage)
   - Set `secure`, `sameSite: 'lax'` in production
   - Use short-lived access tokens + refresh tokens if using JWTs

2. **Password handling:**
   - Hash with bcrypt or Argon2 (never plain text)
   - Minimum length, complexity rules (optional; consider UX)
   - Secure password reset: time-limited token, single use

3. **Route protection:**
   - Middleware for protected routes
   - Redirect unauthenticated users to login
   - Pass user to layout/context

4. **Rate limiting:**
   - Limit login attempts per IP (e.g., 3–5)
   - Lockout after too many failures
   - Prevent enumeration on "email exists" checks

**Tip:** Never store JWTs in localStorage if you can use httpOnly cookies. localStorage is accessible to XSS.

**Warning:** Never trust client-side auth checks alone. Always verify on the server for every protected action.

---

### Step 9: Core API Routes

**What:** Build API endpoints for your main resources.

**Why:** Clean APIs make the frontend simple and enable future integrations (mobile, third-party). Consistent patterns reduce bugs.

**Conventions:**

1. **One route per resource:** `/api/leads`, `/api/users`, `/api/orders`
2. **HTTP methods:** GET (read), POST (create), PUT/PATCH (update), DELETE (delete)
3. **Validate input:** Use Zod or manual validation; return 400 on invalid
4. **Consistent responses:**
   - Success: `{ data: ... }` or `{ success: true }`
   - Error: `{ error: "message" }` with appropriate status

5. **Status codes:**
   - 200 OK, 201 Created
   - 400 Bad Request (invalid input)
   - 401 Unauthorized (not logged in)
   - 403 Forbidden (no permission)
   - 404 Not Found
   - 429 Too Many Requests (rate limited)
   - 500 Internal Server Error

**Example API Route:**
```typescript
// app/api/leads/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;
    
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }
    
    await sql`INSERT INTO leads (name, email, message) VALUES (${name}, ${email}, ${message})`;
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to submit" },
      { status: 500 }
    );
  }
}
```

**Tip:** Use a shared error handler and response format across all routes. Validate at the boundary; trust data inside your handlers.

---

### Step 10: Basic UI Shell

**What:** Create the layout, navigation, and responsive structure that wraps all pages.

**Why:** Establishes the visual and structural foundation. Users expect consistent navigation. Responsive design is non-negotiable for mobile users.

**Checklist:**

1. **Layout components:**
   - Header (logo, nav, user menu)
   - Footer (links, copyright)
   - Main content area

2. **Navigation:**
   - Desktop: horizontal nav
   - Mobile: hamburger menu or bottom nav
   - Active state for current page

3. **Responsive breakpoints:**
   - 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
   - Mobile-first: base styles for mobile, add breakpoints for larger

4. **Theme (optional):**
   - Light/dark mode with `next-themes`
   - Persist preference in localStorage

**Tip:** Build the shell before feature components. Get the layout right first; it's harder to change later.

---

## Phase 2: Design & UX (Steps 11–20)

### Step 11: Information Architecture

**What:** Organize content and flows so users can find what they need and complete tasks efficiently.

**Why:** Poor IA leads to confusion, high bounce rates, and support tickets. Good IA makes the app feel intuitive.

**How:**
1. Map user journeys for key tasks
2. Group related content (card sorting)
3. Design navigation hierarchy (max 2–3 levels deep)
4. Use clear, consistent labels

---

### Step 12: Wireframes

**What:** Low-fidelity layouts showing structure and hierarchy without visual design.

**Why:** Validates structure before investing in pixels. Easy to iterate. Aligns team on layout.

**How:**
- Sketch on paper or use Figma
- Focus on: layout, hierarchy, key elements
- Cover: home, core flow, error states
- Get feedback before moving to design

**Tip:** In Cursor, describe your wireframe and ask for component structure. "Create a dashboard layout with sidebar nav, main content area, and header with user menu."

---

### Step 13: Design System

**What:** Typography, colors, spacing, and reusable components defined consistently.

**Why:** Consistency builds trust. A design system speeds development and ensures accessibility.

**Elements:**
- **Typography:** 1–2 font families, scale (12–48px), weights
- **Colors:** Primary, secondary, neutral, semantic (success, error, warning)
- **Spacing:** 4px base scale (4, 8, 16, 24, 32, 48)
- **Components:** Button (variants), Input, Card, Modal, Badge

**Tip:** Use Tailwind or a design token system. Consider shadcn/ui for pre-built accessible components.

---

### Step 14: Accessibility (a11y)

**What:** Ensure the app is usable by people with disabilities (screen readers, keyboard-only, low vision).

**Why:** Legal requirement in many places. Ethical. Often improves UX for everyone.

**Checklist:**
- Semantic HTML (`<button>`, `<nav>`, `<main>`, `<article>`)
- ARIA labels where needed
- Keyboard navigation (Tab, Enter, Escape)
- Focus indicators (visible outline)
- Color contrast (WCAG AA: 4.5:1 for text)
- Alt text for images

**Tip:** Run axe DevTools or Lighthouse accessibility audit. Fix critical issues first.

---

### Step 15: Responsive Design

**What:** Layouts that adapt to screen size (mobile, tablet, desktop).

**Why:** 50%+ of traffic is mobile. Google uses mobile-first indexing. Responsive is expected.

**Checklist:**
- Mobile-first CSS
- Touch targets ≥ 44px
- Readable text without zoom (16px base)
- Test on real devices or Chrome DevTools

---

### Step 16: Loading States

**What:** Visual feedback while data loads or actions process.

**Why:** Reduces perceived wait time. Prevents duplicate submissions. Shows progress.

**Options:**
- Skeleton loaders (match content shape)
- Spinners for actions
- Progress bars for multi-step flows
- Optimistic UI (show result before server confirms)

---

### Step 17: Error States

**What:** Clear messages and recovery options when something fails.

**Why:** Users need to know what happened and what to do next. Generic errors cause frustration.

**Checklist:**
- User-friendly copy (no stack traces)
- Retry or "Go back" actions
- Error boundaries for React (catch component errors)
- Log errors server-side for debugging

---

### Step 18: Micro-interactions

**What:** Small animations and feedback (hover, focus, transitions).

**Why:** Makes the UI feel responsive and polished. Guides attention.

**Guidelines:**
- Keep animations short (150–300ms)
- Use for state changes, not decoration
- Respect `prefers-reduced-motion` (disable or simplify)

---

### Step 19: Form Design

**What:** Forms that are easy to fill out, validate inline, and submit successfully.

**Why:** Forms are often the conversion point. Poor forms = lost leads.

**Checklist:**
- Clear labels (not just placeholders)
- Inline validation (on blur or submit)
- Disable submit until valid
- Success confirmation after submit
- Honeypot for spam (hidden field bots fill)

---

### Step 20: Content & Copy

**What:** Clear, consistent text throughout the app.

**Why:** Copy shapes understanding and trust. Vague copy causes confusion.

**Guidelines:**
- Short sentences, active voice
- Consistent tone (formal vs casual)
- Help text where needed
- Error messages that explain the problem and solution

---

## Phase 3: Security (Steps 21–30)

### Step 21: Input Validation

**What:** Validate and sanitize all user input before processing or storing.

**Why:** Prevents injection attacks, XSS, and malformed data. Never trust the client.

**How:**
- Validate API bodies with Zod or similar
- Sanitize HTML before rendering (e.g., `sanitize-html`)
- Enforce length limits (prevent DoS)
- Reject invalid types early (return 400)

**Example (Zod):**
```typescript
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  message: z.string().min(1).max(5000),
});
const result = schema.safeParse(body);
if (!result.success) {
  return NextResponse.json({ error: result.error.message }, { status: 400 });
}
```

---

### Step 22: Authentication Security

**What:** Secure login, sessions, and password handling.

**Checklist:**
- httpOnly, secure, sameSite cookies
- Rate limit login attempts (3–5 per IP)
- Secure password reset (time-limited, single-use token)
- Consider MFA for sensitive apps

---

### Step 23: Authorization

**What:** Enforce permissions on every protected action.

**How:**
- Check permissions server-side on every request
- Never rely on client-side checks alone
- Use RBAC (roles + permissions) for complex apps

---

### Step 24: Security Headers

**What:** HTTP headers that mitigate common attacks.

**Recommended:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (restrict camera, mic, etc.)
- `Strict-Transport-Security` in production (HSTS)

---

### Step 25: Content Security Policy (CSP)

**What:** Restrict where scripts, styles, and resources can load from.

**Why:** Mitigates XSS. Even if an attacker injects script, CSP can block it.

**How:**
- Use nonces for inline scripts
- Avoid `unsafe-inline` and `unsafe-eval`
- Whitelist trusted domains only

---

### Step 26: Rate Limiting

**What:** Limit requests per IP/user to prevent abuse.

**Where:** Login, signup, contact forms, public APIs, expensive endpoints.

**Implementation:**
- Use DB or Redis so limits work across serverless instances
- Return 429 with `Retry-After` header when limited
- Consider "fail open" for critical flows (e.g., login) if rate-limit DB is down

---

### Step 27: Secrets Management

**What:** Keep secrets out of code and logs.

**Checklist:**
- Use env vars or secret manager
- Rotate keys periodically
- Never log secrets
- Different secrets per environment

---

### Step 28: SQL Injection Prevention

**What:** Use parameterized queries for all database access.

**How:**
- Use ORM or query builder
- Never concatenate user input into SQL
- Use `$1`, `?` placeholders

---

### Step 29: XSS Prevention

**What:** Prevent execution of malicious script in the browser.

**How:**
- Escape output by default
- Use `sanitize-html` for rich content
- Avoid `dangerouslySetInnerHTML` unless necessary
- CSP as defense in depth

---

### Step 30: Dependency Security

**What:** Keep dependencies updated and vetted.

**Checklist:**
- Run `npm audit` regularly
- Use Dependabot or Renovate
- Prefer well-maintained packages
- Lock versions (package-lock.json)

---

## Phase 4: Performance (Steps 31–40)

### Step 31: Core Web Vitals

**What:** LCP (Largest Contentful Paint), FID/INP (First Input Delay / Interaction to Next Paint), and CLS (Cumulative Layout Shift)—Google's metrics for user experience and SEO.

**Why:** Core Web Vitals affect search ranking. Poor scores mean users perceive the site as slow or janky, leading to higher bounce rates.

**Targets:**
- **LCP** < 2.5s (main content visible)
- **FID/INP** < 100ms (responsive to input)
- **CLS** < 0.1 (no layout jumps)

**How:**
- **LCP:** Optimize images, preload critical resources, reduce server response time, eliminate render-blocking resources
- **FID/INP:** Reduce JavaScript execution time, break up long tasks, defer non-critical JS
- **CLS:** Reserve space for images/fonts (width/height or aspect-ratio), avoid inserting content above existing content

**Tip:** Use Chrome DevTools > Lighthouse to measure. Fix "Poor" and "Needs improvement" first.

---

### Step 32: Image Optimization

**What:** Serve appropriately sized, modern-format images with lazy loading.

**Why:** Images often account for 50%+ of page weight. Unoptimized images kill LCP and waste bandwidth.

**How:**
1. Use Next.js `Image` component (automatic optimization) or similar
2. Prefer WebP/AVIF (smaller than JPEG/PNG)
3. Lazy load images below the fold (`loading="lazy"`)
4. Use responsive `srcset` for different screen sizes
5. Set explicit width/height to prevent CLS

**Example (Next.js):**
```tsx
<Image src="/hero.jpg" alt="Hero" width={1200} height={600} priority />
```

**Tip:** Use `priority` for above-the-fold images; omit for below-fold (lazy by default).

---

### Step 33: Code Splitting

**What:** Load only the JavaScript needed for the current view.

**Why:** Smaller initial bundle = faster First Contentful Paint. Users don't need code for pages they haven't visited.

**How:**
- **Route-based:** Next.js splits by route automatically
- **Dynamic imports:** `const Modal = dynamic(() => import('./Modal'))` for heavy components
- **Lazy load:** Modals, tabs, below-fold content
- **Analyze:** Use `@next/bundle-analyzer` to find large dependencies

**Tip:** If a component is >50KB and not critical for initial render, dynamic import it.

---

### Step 34: Caching Strategy

**What:** Cache static assets and data to reduce load times and server load.

**Why:** Caching reduces latency and bandwidth. Repeat visitors get instant loads.

**How:**
- **Static assets:** Long cache (1 year) with content hashes in filenames
- **Data:** ISR (Incremental Static Regeneration) or SWR (stale-while-revalidate)
- **CDN:** Serve static files from edge locations
- **Cache-Control:** `public, max-age=31536000, immutable` for hashed assets

**Tip:** Use `stale-while-revalidate` for data: show cached immediately, revalidate in background.

---

### Step 35: Database Optimization

**What:** Fast queries and efficient connection usage.

**Why:** Slow queries block requests and scale poorly. N+1 queries can cause hundreds of round-trips.

**How:**
- **Indexes:** Add for columns in WHERE, ORDER BY, JOIN (see Step 7)
- **Avoid N+1:** Use JOINs or batch queries instead of looping
- **Connection pooling:** Reuse connections (Supabase, PgBouncer)
- **Query analysis:** Use `EXPLAIN ANALYZE` to find slow queries

**Warning:** Over-indexing slows writes. Add indexes based on actual query patterns.

---

### Step 36: API Optimization

**What:** Fast, lean API responses.

**Why:** API latency directly affects user-perceived speed. Large payloads waste bandwidth and parse time.

**How:**
- **Pagination:** Limit results (e.g., 20 per page); use cursor-based for large datasets
- **Field selection:** Return only requested fields (`?fields=id,name`)
- **Compression:** Enable gzip/brotli (Vercel does this automatically)
- **Caching:** Cache responses where appropriate (Cache-Control, ETag)

**Tip:** If a list endpoint returns >100KB, add pagination.

---

### Step 37: Bundle Size

**What:** Keep JavaScript bundles small.

**Why:** JS blocks parsing and execution. Large bundles delay interactivity.

**How:**
- **Tree-shaking:** Import only what you need (`import { Button } from 'library'` not `import *`)
- **Replace heavy libs:** e.g., moment.js → date-fns or dayjs
- **Analyze:** `npm run build` with `ANALYZE=true` and `@next/bundle-analyzer`
- **Lazy load:** Heavy components, charts, editors

**Tip:** Aim for <200KB initial JS (gzipped). Audit anything over 100KB.

---

### Step 38: Font Loading

**What:** Load fonts without blocking render or causing layout shift.

**Why:** Flash of invisible text (FOIT) hurts UX. Layout shift when fonts load hurts CLS.

**How:**
- **font-display: swap** — Show fallback immediately, swap when font loads
- **Subset fonts** — Include only needed characters
- **Self-host or reliable CDN** — Avoid third-party font blocking
- **Preload** — `<link rel="preload" href="/font.woff2" as="font">` for critical fonts

**Tip:** Use `next/font` in Next.js for automatic optimization.

---

### Step 39: Third-Party Scripts

**What:** Load analytics, chat widgets, and other third-party code efficiently.

**Why:** Third-party scripts are a major cause of slow sites. They block main thread and add latency.

**How:**
- **Async/defer:** Load non-critical scripts asynchronously
- **Tag manager:** Consolidate scripts; load after page interactive
- **Self-host where possible:** Analytics, etc.
- **Audit:** Remove unused scripts; replace heavy ones with lighter alternatives

**Tip:** Load analytics after `window.onload` or use `requestIdleCallback`.

---

### Step 40: Performance Monitoring

**What:** Track real-user performance in production.

**Why:** Lab metrics (Lighthouse) don't reflect real conditions. You need RUM to find real bottlenecks.

**How:**
- **Lighthouse/PageSpeed:** CI or manual audits
- **RUM:** Vercel Analytics, Web Vitals library, or commercial (Datadog, New Relic)
- **Set budgets:** Fail build if bundle or LCP exceeds threshold
- **Alert:** When p95 LCP or error rate spikes

**Tip:** Track LCP, FID, CLS, and TTFB. Set up alerts for regressions.

---

## Phase 5: AI & ML (Steps 41–50)

### Step 41: Identify Use Cases

**What:** Decide where AI adds meaningful value to your app.

**Why:** AI is expensive and has latency. Use it where it clearly improves the product, not everywhere.

**Common use cases:**
- **Chat/assistants:** Conversational interface, support bots
- **Summarization:** Long articles, meeting notes, emails
- **Generation:** Content, code, images
- **Search:** Semantic search, recommendations
- **Classification:** Sentiment, categories, routing
- **Extraction:** Entities, structured data from text

**How:** Map user pain points. Ask: "Would an LLM significantly improve this?" If yes, prioritize. If marginal, defer.

**Tip:** Start with one high-impact use case. Nail it before expanding.

---

### Step 42: Choose Provider

**What:** Select an LLM/API provider for your use case.

**Options:**

| Provider | Strengths | Best For |
|----------|-----------|----------|
| **OpenAI** | GPT-4, strong reasoning, ecosystem | General purpose, complex tasks |
| **Anthropic** | Claude, long context, safety | Long documents, nuanced output |
| **Google** | Gemini, multimodal, Vertex | Google Cloud users, multimodal |
| **Local (Ollama, etc.)** | Privacy, no API cost | Sensitive data, offline |

**Consider:** Cost per token, latency, context length, rate limits, privacy (data retention policy).

**Tip:** Use environment variables for API keys. Support multiple providers for fallback.

---

### Step 43: Prompt Engineering

**What:** Design prompts that produce reliable, useful output.

**Why:** Prompt quality directly affects output quality. Poor prompts = inconsistent, wrong, or unsafe output.

**How:**
1. **Clear instructions:** Be specific. "Summarize in 3 bullet points" vs "Summarize"
2. **Examples (few-shot):** Show 1–3 examples of input → output
3. **Structured output:** Request JSON with a schema; parse and validate
4. **Iterate:** Test edge cases; refine based on failures
5. **System vs user:** Use system message for role/constraints; user for input

**Example:**
```
System: You are a helpful assistant. Respond only with valid JSON.
User: Summarize: [article]. Output: { "summary": string, "keyPoints": string[] }
```

**Tip:** Use Zod or similar to validate LLM output. Never trust it blindly.

---

### Step 44: API Integration

**What:** Call AI APIs reliably from your backend.

**Checklist:**
- Use official SDKs (OpenAI, Anthropic, etc.)
- Handle rate limits (429) with retry and backoff
- Set timeouts (30–60s typical)
- Stream for long responses (better UX)
- Log errors and latency for debugging

**Example (OpenAI):**
```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: prompt }],
  max_tokens: 1000,
});
```

**Tip:** Wrap API calls in a service layer. Centralize error handling and retries.

---

### Step 45: Cost Control

**What:** Manage AI API costs as usage grows.

**Why:** LLM APIs can get expensive quickly. A few cents per request adds up at scale.

**How:**
- **Usage limits:** Per-user or per-org caps
- **Cache responses:** Same prompt → same response (e.g., FAQ answers)
- **Smaller models:** Use gpt-4o-mini or Claude Haiku for simple tasks
- **Token limits:** Cap `max_tokens`; truncate input if needed
- **Monitor:** Track spend per endpoint, per user

**Tip:** Set up billing alerts. Consider caching for deterministic or repeated queries.

---

### Step 46: Safety & Moderation

**What:** Validate and filter AI output; prevent harmful content.

**Why:** LLMs can produce biased, incorrect, or unsafe content. User input may be malicious.

**How:**
- **Input moderation:** Check user input for prompt injection, harmful content
- **Output validation:** Validate structure (Zod); check for policy violations
- **Moderation APIs:** OpenAI Moderation, etc., for content safety
- **Log edge cases:** Review failures and odd outputs
- **Human review:** For high-stakes decisions (e.g., content moderation)

**Tip:** Never display raw LLM output without validation. Sanitize before rendering.

---

### Step 47: Fallbacks

**What:** Graceful behavior when AI fails (timeout, rate limit, error).

**Why:** AI APIs are not 100% reliable. Users shouldn't see a dead end.

**How:**
- **Retry:** 1–2 retries with exponential backoff for 5xx, 429
- **Fallback model:** If primary fails, try smaller/cheaper model
- **Fallback flow:** If AI unavailable, show non-AI alternative (e.g., manual form)
- **User message:** "We're having trouble. Please try again or contact support."

**Tip:** Design flows so core value works without AI. AI enhances; it shouldn't block.

---

### Step 48: Evaluation

**What:** Measure AI quality and performance systematically.

**Why:** You can't improve what you don't measure. Prompts and models need iteration.

**How:**
- **Test set:** 20–50 representative examples
- **Metrics:** Accuracy, relevance, latency, cost per request
- **A/B test prompts:** Compare variants on same inputs
- **User feedback:** Thumbs up/down, explicit ratings
- **Log samples:** Review real outputs periodically

**Tip:** Start with a small test set. Add cases when you find failures.

---

### Step 49: Fine-Tuning (Optional)

**What:** Train a model on your own data for better performance on your domain.

**When:** When prompt engineering isn't enough—high volume, specific domain, consistent format.

**How:**
- Prepare dataset (input/output pairs)
- Use provider's fine-tuning API (OpenAI, etc.)
- Evaluate on held-out set
- Deploy and monitor

**Warning:** Fine-tuning is expensive and time-consuming. Exhaust prompt engineering first.

---

### Step 50: Embeddings & RAG

**What:** Use embeddings for semantic search; retrieve relevant chunks and pass to LLM (Retrieval-Augmented Generation).

**Why:** LLMs have limited context and can hallucinate. RAG grounds answers in your data.

**How:**
1. **Chunk documents:** Split into 500–1000 token chunks with overlap
2. **Embed:** Use OpenAI embeddings or similar
3. **Store:** Vector DB (Pinecone, Supabase pgvector, Chroma)
4. **Retrieve:** Query by embedding; get top-k similar chunks
5. **Generate:** Pass chunks + user question to LLM

**Tip:** Chunk size and overlap matter. Experiment. Include metadata (source, title) for citation.

---

## Phase 6: Stability & Reliability (Steps 51–60)

### Step 51: Error Boundaries

**What:** React components that catch JavaScript errors in their child tree and display fallback UI.

**Why:** A single component error can crash the whole app. Error boundaries isolate failures and keep the rest of the app usable.

**How:**
- Wrap route segments or key features in error boundaries
- Use `getDerivedStateFromError` and `componentDidCatch` (class component) or `react-error-boundary` library
- Show fallback UI with "Try again" or "Go back"
- Log errors to your tracking service

**Example:**
```tsx
<ErrorBoundary fallback={<ErrorFallback />} onError={logError}>
  <MyFeature />
</ErrorBoundary>
```

**Tip:** Place boundaries at route level and around critical features. Don't wrap every small component.

---

### Step 52: API Error Handling

**What:** Consistent, safe error handling in all API routes.

**Why:** Unhandled errors expose stack traces and confuse users. Inconsistent errors make frontend handling difficult.

**How:**
- Wrap handlers in try/catch
- Return consistent shape: `{ error: string }` with appropriate status
- Log full error server-side; never send stack traces to client in production
- Use specific status codes (400, 401, 403, 404, 429, 500)

**Example:**
```typescript
try {
  const result = await doSomething();
  return NextResponse.json(result);
} catch (error) {
  console.error("API error:", error);
  const message = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json(
    { error: process.env.NODE_ENV === "development" ? message : "Something went wrong" },
    { status: 500 }
  );
}
```

---

### Step 53: Retry Logic

**What:** Automatically retry transient failures (network blips, 5xx, rate limits).

**Why:** Many failures are temporary. Retrying often succeeds without user action.

**How:**
- Retry on 5xx, 429, network errors
- Don't retry on 4xx (except 429)
- Exponential backoff: 1s, 2s, 4s, etc.
- Max 2–3 retries to avoid long waits

**Tip:** Use a library (e.g., `p-retry`) for consistent behavior. Make operations idempotent when possible.

---

### Step 54: Timeouts

**What:** Set maximum wait time for external calls (DB, APIs, fetch).

**Why:** Hanging requests block resources and frustrate users. Fail fast so you can retry or show an error.

**How:**
- Set timeouts on fetch, DB queries, external APIs
- Typical: 5–30s for APIs, 10s for DB
- Use `AbortController` for fetch
- Propagate timeout errors to user with clear message

**Tip:** Different operations need different timeouts. AI APIs may need 60s; simple DB queries 5s.

---

### Step 55: Graceful Degradation

**What:** Core features work when optional services fail.

**Why:** A third-party API or non-critical service shouldn't take down the whole app.

**How:**
- Identify critical vs optional dependencies
- For optional: catch errors, show cached data or simplified UI
- For critical: show error state with retry; consider fail-open vs fail-closed by risk
- Example: Rate limit DB down → allow login (fail open) vs payment gateway down → block checkout (fail closed)

**Tip:** Document which services are critical. Test failure scenarios.

---

### Step 56: Health Checks

**What:** An endpoint that verifies the app and its dependencies are healthy.

**Why:** Load balancers and orchestrators use health checks. You need to know when DB or external APIs are down.

**How:**
- Create `/api/health` or `/api/healthz`
- Check: DB connection, critical external APIs
- Return 200 if healthy, 503 if unhealthy
- Keep it fast (<1s); don't do heavy work

**Example:**
```typescript
export async function GET() {
  try {
    await sql`SELECT 1`;
    return new Response("OK", { status: 200 });
  } catch {
    return new Response("Unhealthy", { status: 503 });
  }
}
```

---

### Step 57: Logging

**What:** Structured logs for debugging and auditing.

**Why:** You need to trace errors and understand behavior in production. Unstructured logs are hard to search.

**How:**
- Use JSON format: `{ level, message, timestamp, ...context }`
- Log levels: error, warn, info, debug
- Include request ID, user ID (if applicable)
- Never log secrets, PII, or full request bodies
- Use a log aggregation service (Vercel, Datadog, etc.)

**Tip:** Log at boundaries (API entry, DB calls). Avoid logging inside tight loops.

---

### Step 58: Idempotency

**What:** Critical operations can be safely retried without duplicate side effects.

**Why:** Networks fail. Users retry. Payments or orders must not be duplicated.

**How:**
- Accept idempotency key in request (client-generated UUID)
- Store key + result; return cached result if key seen before
- Use DB unique constraint or "insert or return existing"
- Apply to: payments, order creation, account changes

**Tip:** Client generates key once per logical operation. Same key = same result.

---

### Step 59: Background Jobs

**What:** Offload long-running tasks to a queue; process asynchronously.

**Why:** API routes should respond quickly. Long tasks (emails, exports, AI generation) block requests and risk timeouts.

**How:**
- Use a queue (BullMQ, Inngest, Trigger.dev, Vercel background functions)
- Enqueue job with payload; return job ID to client
- Worker processes jobs; updates status in DB
- Client polls or uses webhook for completion

**Tip:** Persist job state so retries work across restarts. See `pipeline_jobs` in this project's schema.

---

### Step 60: Backups

**What:** Regular, automated backups of your database and critical data.

**Why:** Hardware fails. Bugs happen. Malicious actors exist. Backups are your last line of defense.

**Checklist:**
- Automated daily (or more frequent) backups
- Test restore process at least quarterly
- Store backups in different region/account
- Document recovery steps (runbook)
- Define RTO (recovery time) and RPO (recovery point) objectives

**Tip:** Supabase, Neon, Vercel Postgres offer automated backups. Verify they're enabled.

---

## Phase 7: Testing (Steps 61–70)

### Step 61: Unit Tests

**What:** Test pure functions and utilities in isolation.

**Why:** Fast feedback. Catch logic bugs early. Refactor with confidence.

**How:**
- Use Vitest or Jest
- Test `lib/` utilities, validation, formatters
- Mock external dependencies
- Keep tests fast (<5s total)

**Example:**
```typescript
import { parseGenerateBody } from "./parse-generate-body";
expect(parseGenerateBody({ keywords: "seo" }).pipelineInput.primaryKeyword).toBe("seo");
```

**Tip:** Test behavior, not implementation. One assertion per test when possible.

---

### Step 62: Integration Tests

**What:** Test API routes with a real (or test) database.

**Why:** Unit tests don't catch DB issues, auth failures, or integration bugs.

**How:**
- Use test DB (separate from dev/prod)
- Reset or truncate between tests for isolation
- Test full request/response cycle
- Use `fetch` or `supertest` to call routes

**Tip:** Run integration tests in CI. Use a separate `DATABASE_URL` for tests.

---

### Step 63: E2E Tests

**What:** Test critical user flows in a real browser.

**Why:** Catches issues unit/integration tests miss: routing, auth, UI interactions, real browser behavior.

**How:**
- Use Playwright or Cypress
- Test: signup, login, core action, checkout
- Run against staging or local
- Keep suite small (5–15 tests) for speed

**Example (Playwright):**
```typescript
test("user can submit contact form", async ({ page }) => {
  await page.goto("/contact");
  await page.fill('[name="name"]', "Test");
  await page.fill('[name="email"]', "test@example.com");
  await page.fill('[name="message"]', "Hello");
  await page.click('button[type="submit"]');
  await expect(page.getByText("Thank you")).toBeVisible();
});
```

**Tip:** Focus on happy paths and critical flows. Don't test every edge case in E2E.

---

### Step 64: Test Data

**What:** Fixtures and factories for consistent, isolated test data.

**Why:** Hardcoded data is brittle. Factories generate valid, varied data. Fixtures ensure reproducibility.

**How:**
- Create `test/fixtures/` or `__tests__/fixtures/`
- Use factories (e.g., `createUser({ email: "test@example.com" })`) for flexibility
- Seed test DB with minimal data for integration tests
- Never use production data

**Tip:** Use a library like `@faker-js/faker` for realistic random data.

---

### Step 65: CI Pipeline

**What:** Run tests automatically on every push and pull request.

**Why:** Catches regressions before merge. Ensures main branch stays green.

**How:**
- Use GitHub Actions, GitLab CI, or similar
- Run: lint, unit tests, integration tests
- Run E2E on PR or nightly
- Block merge if any step fails

**Example (GitHub Actions):**
```yaml
- run: npm ci
- run: npm run lint
- run: npm test
```

**Tip:** Cache `node_modules` to speed up CI. Use matrix for multiple Node versions if needed.

---

### Step 66: Coverage

**What:** Measure which code is exercised by tests.

**Why:** Highlights untested areas. Don't chase 100%—focus on critical paths.

**How:**
- Use `--coverage` with Vitest/Jest
- Aim for 80%+ on `lib/` and critical paths
- Ignore UI components for unit coverage (test via E2E)
- Review coverage reports in CI

**Warning:** High coverage ≠ good tests. Meaningful assertions matter more.

---

### Step 67: Snapshot Tests

**What:** Capture component output and compare on subsequent runs.

**Why:** Catches unintended UI changes. Useful for design system components.

**How:**
- Use `toMatchSnapshot()` sparingly
- Review snapshot diffs carefully—don't blindly update
- Use for: Button, Card, form components
- Avoid for: frequently changing, data-dependent UI

**Tip:** Prefer explicit assertions over snapshots when possible. Snapshots can become large and noisy.

---

### Step 68: Load Testing

**What:** Test app behavior under simulated load.

**Why:** Find bottlenecks before users do. Verify you can handle expected traffic.

**How:**
- Use k6, Artillery, or Locust
- Simulate N concurrent users for M duration
- Measure: RPS, latency (p50, p95, p99), error rate
- Test: homepage, API routes, auth flow

**Tip:** Start with 10–50 virtual users. Ramp up. Find breaking point.

---

### Step 69: Chaos Testing

**What:** Intentionally cause failures to verify system resilience.

**Why:** Proves that retries, fallbacks, and error handling actually work.

**How:**
- Kill DB connection during request
- Return 500 from external API
- Add latency to network
- Use Chaos Monkey or similar (or manual scripts)
- Verify: errors are caught, users see fallback, no data corruption

**Tip:** Run in staging, not production. Start with one failure mode at a time.

---

### Step 70: Regression Suite

**What:** A curated list of flows that must not break before release.

**Why:** Prevents "we fixed X but broke Y." Smoke test before deploy.

**How:**
- Document 5–10 critical flows
- Automate as E2E or manual checklist
- Run before every release
- Add to suite when a bug is found (regression test)

**Tip:** Keep it short. If it takes >30 min, it won't be run regularly.

---

## Phase 8: Deployment & DevOps (Steps 71–80)

### Step 71: Build Process

**What:** Reproducible, automated build that produces deployable artifacts.

**Why:** "Works on my machine" fails in production. Consistent builds reduce deploy failures.

**How:**
- Use `npm run build` or equivalent
- Pin Node version (`.nvmrc` or `engines` in package.json)
- Build in CI; deploy the same artifact to staging and prod
- Avoid build-time env vars for runtime config

**Tip:** Run `npm run build` locally before pushing. Fix build errors early.

---

### Step 72: Environment Parity

**What:** Dev, staging, and prod use the same stack and config structure.

**Why:** Bugs that only appear in prod are costly. Parity reduces "works in dev, fails in prod."

**How:**
- Same Node version, same dependencies
- Same DB (Postgres), same auth provider
- Different env vars (URLs, keys) but same structure
- Staging mirrors prod as closely as possible

**Tip:** Use `.env.example` as the source of truth for required vars. Document differences.

---

### Step 73: CI/CD

**What:** Automated deploy on merge to main (or similar).

**Why:** Manual deploys are error-prone and slow. Automation enables frequent, reliable releases.

**How:**
- Push to main → build → run tests → deploy to staging
- Tag or release → deploy to prod
- Use Vercel, Railway, or GitHub Actions for Next.js
- Require passing tests before deploy

**Tip:** Deploy to staging first. Verify. Then promote to prod. Use preview deploys for PRs.

---

### Step 74: Secrets in Deployment

**What:** Inject secrets at runtime, not at build time.

**Why:** Build artifacts may be cached or shared. Secrets in build = leaked secrets.

**How:**
- Use platform secret managers (Vercel, Railway, AWS Secrets Manager)
- Set env vars in dashboard or CI; never in code
- Rotate secrets periodically
- Different secrets per environment

**Tip:** Vercel injects env vars at runtime. Never `echo $SECRET` in build script.

---

### Step 75: Database Migrations

**What:** Versioned, reversible schema and data changes.

**Why:** Schema evolves. Migrations ensure everyone (and every env) stays in sync. Rollback is critical when things go wrong.

**How:**
- Use migration files: `001_create_users.sql`, `002_add_index.sql`
- Run migrations before deploy (or as part of deploy)
- Make migrations reversible when possible (down migration)
- Test migrations on staging first

**Tip:** Supabase and many ORMs support migrations. Keep them small and focused.

---

### Step 76: Feature Flags

**What:** Ship code behind a flag; enable for subset of users or gradually.

**Why:** Decouple deploy from release. Roll out slowly. Kill switch if something breaks.

**How:**
- Use LaunchDarkly, Unleashed, or simple DB/env flag
- Check flag in code: `if (featureFlags.newCheckout) { ... }`
- Enable for: internal users, 10% of users, everyone
- Remove flag and dead code after full rollout

**Tip:** Default to off. Enable explicitly. Document each flag and its purpose.

---

### Step 77: Zero-Downtime Deploys

**What:** Deploy without dropping requests or showing errors to users.

**Why:** Downtime loses users and revenue. Zero-downtime is expected for modern apps.

**How:**
- **Vercel/Netlify:** Atomic deploys; switch traffic when ready
- **Blue-green:** Deploy to new instance; switch load balancer
- **Canary:** Route small % to new version; increase if healthy
- Ensure old and new versions can run simultaneously (DB migrations backward compatible)

**Tip:** Vercel handles this for Next.js. For custom infra, use blue-green or canary.

---

### Step 78: Infrastructure as Code

**What:** Define servers, DBs, and config in code (Terraform, Pulumi).

**Why:** Reproducible infra. Version controlled. Reviewable changes. No manual clicking.

**How:**
- Use Terraform for cloud resources
- Or Pulumi if you prefer code over HCL
- Store in repo; apply via CI
- Separate state per environment

**Tip:** Start simple. Add IaC when you have multiple environments or complex infra.

---

### Step 79: Documentation

**What:** README, setup guide, API docs, runbooks for operations.

**Why:** Onboarding, debugging, and incident response depend on good docs.

**How:**
- **README:** Project overview, setup, how to run
- **API docs:** OpenAPI/Swagger or generated from code
- **Runbooks:** Step-by-step for common ops (deploy, rollback, restore)
- **Architecture:** High-level diagram, key decisions

**Tip:** Document as you build. Outdated docs are worse than no docs. Use Cursor to generate from code.

---

### Step 80: Disaster Recovery Plan

**What:** Documented steps to recover from major failures (DB loss, region outage, etc.).

**Why:** When disaster strikes, panic is high. A plan saves time and reduces errors.

**How:**
- Document: backup restore, failover, contact list
- Define RTO (how fast to recover) and RPO (how much data loss acceptable)
- Test restore at least quarterly
- Keep runbook in repo or wiki

**Tip:** Run a drill. Restore from backup. Verify app works. Update plan based on what you learn.

---

## Phase 9: Monitoring & Observability (Steps 81–90)

### Step 81: Error Tracking

**What:** Capture, group, and alert on JavaScript and server errors.

**Why:** You need to know when things break. Stack traces and context speed up debugging.

**How:**
- Use Sentry, Bugsnag, or similar
- Install SDK in app; wrap API routes
- Group by error message/stack; set up alerts for new errors or spike
- Include: user ID, request ID, breadcrumbs

**Tip:** Filter out noisy errors (e.g., browser extensions). Set up Slack/email alerts for critical errors.

---

### Step 82: APM (Application Performance Monitoring)

**What:** Trace requests end-to-end; find slow queries and bottlenecks.

**Why:** "The app is slow" isn't actionable. APM shows which route, which DB query, which external call.

**How:**
- Use Vercel Analytics, Datadog APM, or New Relic
- Trace: request → middleware → route handler → DB/API calls
- Measure: duration, DB time, external call time
- Identify: N+1 queries, slow external APIs

**Tip:** Focus on p95 and p99 latency. Median can hide bad tail performance.

---

### Step 83: Metrics

**What:** Request rate, latency, error rate, and custom business metrics.

**Why:** Metrics show trends. You need to know if errors are rising, latency is degrading, or usage is growing.

**How:**
- Use platform metrics (Vercel, Railway) or Prometheus/Datadog
- Track: requests/sec, error rate, latency percentiles
- Add custom: signups/day, orders/hour, AI API calls
- Store in time-series DB; visualize in Grafana or similar

**Tip:** Start with request rate, error rate, latency. Add business metrics as needed.

---

### Step 84: Dashboards

**What:** Single view of key metrics for quick health checks.

**Why:** Scattered metrics are useless during incidents. A dashboard gives at-a-glance status.

**How:**
- Create dashboard: errors, latency, traffic, DB, external APIs
- Put it on a big screen or bookmark
- Update when you add new critical services
- Keep it simple: 5–10 panels max

**Tip:** Design for 3am debugging. What do you need to see first?

---

### Step 85: Alerting

**What:** Notifications when metrics cross thresholds.

**Why:** You can't watch dashboards 24/7. Alerts wake you when things break.

**How:**
- Alert on: error rate spike, latency degradation, health check failure
- Use PagerDuty, Opsgenie, or Slack
- Make alerts actionable: include link to dashboard, suggested fix
- Avoid alert fatigue: tune thresholds, use severity levels

**Tip:** Every alert should have a runbook. "When X, do Y." Test alerts to ensure they fire.

---

### Step 86: Log Aggregation

**What:** Centralized, searchable logs from all services.

**Why:** Logs are scattered across instances. You need to search and correlate.

**How:**
- Use Vercel Logs, Datadog, or ELK stack
- Ship logs from app and infra
- Use structured format (JSON) for filtering
- Set retention (e.g., 30 days); archive older

**Tip:** Include request ID in logs. Correlate across services with same ID.

---

### Step 87: Uptime Monitoring

**What:** External checks that hit your app and alert if it's down.

**Why:** You need to know when users can't reach you. Internal checks may miss DNS, CDN, or regional issues.

**How:**
- Use UptimeRobot, Pingdom, or Better Uptime
- Check: homepage, API health, critical pages
- Frequency: every 1–5 minutes
- Alert: email, Slack, PagerDuty

**Tip:** Check from multiple regions. Your app may work in US but fail in EU.

---

### Step 88: Cost Monitoring

**What:** Track cloud spend and cost per feature/user.

**Why:** Bills can surprise you. AI APIs, DB, and egress add up. Cost per user informs pricing.

**How:**
- Use cloud provider billing (Vercel, AWS)
- Set budget alerts (e.g., 80% of monthly budget)
- Break down by: service, environment, feature
- Review monthly; optimize biggest line items

**Tip:** Tag resources by team/feature. Makes attribution easier.

---

### Step 89: User Analytics

**What:** Events, funnels, retention to understand user behavior.

**Why:** Product decisions need data. "Are users completing signup? Where do they drop off?"

**How:**
- Use PostHog, Mixpanel, or Amplitude
- Track: page views, signup, core action, conversion
- Build funnels: signup → onboarding → first action
- Respect privacy: consent, anonymize, comply with GDPR

**Tip:** Start with 5–10 key events. Add more as questions arise. Don't over-instrument.

---

### Step 90: Incident Response

**What:** Runbooks, on-call rotation, and blameless postmortems.

**Why:** Incidents happen. A clear process reduces chaos and improves future resilience.

**How:**
- **Runbooks:** Step-by-step for common incidents (e.g., "DB slow", "Error spike")
- **On-call:** Rotate responsibility; use PagerDuty
- **Postmortem:** Within 48h of incident; what happened, root cause, action items
- **Blameless:** Focus on systems, not people. Learn and improve.

**Tip:** Template: Impact, Timeline, Root cause, Resolution, Action items. Share with team.

---

## Phase 10: Growth & Scale (Steps 91–100)

### Step 91: Caching

**What:** Store frequently accessed data in fast storage (Redis, in-memory) to reduce DB and API load.

**Why:** DB and external APIs are bottlenecks. Caching reduces latency and load. Essential for scale.

**How:**
- **What to cache:** Session data, API responses, computed results, static config
- **Where:** Redis, Vercel KV, or in-memory (per-instance)
- **TTL:** Set expiry; balance freshness vs load
- **Invalidation:** On write, invalidate related keys; or use short TTL

**Tip:** Cache invalidation is hard. Start with short TTLs (e.g., 60s). Add explicit invalidation when needed.

---

### Step 92: CDN

**What:** Serve static assets and optionally dynamic content from edge locations.

**Why:** Reduces latency for global users. Offloads origin server. Handles traffic spikes.

**How:**
- Use Vercel Edge, Cloudflare, or CloudFront
- Cache: JS, CSS, images, fonts
- Optional: cache HTML for static/ISR pages
- Set Cache-Control headers appropriately

**Tip:** Vercel includes CDN. For custom setup, cache static assets at edge; keep API on origin.

---

### Step 93: DB Scaling

**What:** Handle more read/write load via connection pooling, read replicas, or sharding.

**Why:** Single DB has limits. Connection exhaustion and slow queries block growth.

**How:**
- **Connection pooling:** PgBouncer, Supabase pooler—reuse connections
- **Read replicas:** Route reads to replicas; writes to primary
- **Sharding:** Split data by key (e.g., user_id) across DBs—complex, last resort
- **Optimize first:** Indexes, query tuning, caching before scaling

**Tip:** Start with connection pooling. Add read replicas when read load dominates. Shard only when necessary.

---

### Step 94: Async Processing

**What:** Decouple work via message queues; process in background workers.

**Why:** Keeps API fast. Handles bursts. Enables retries and durability.

**How:**
- Use Inngest, Trigger.dev, BullMQ, or SQS
- Enqueue: emails, exports, AI jobs, notifications
- Workers process; update status in DB
- Retry failed jobs with backoff

**Tip:** See this project's `pipeline_jobs` for a simple job queue pattern. Use hosted queues (Inngest) for less ops.

---

### Step 95: API Versioning

**What:** Support multiple API versions so clients can migrate gradually.

**Why:** Breaking changes break clients. Versioning lets you evolve without forcing immediate upgrades.

**How:**
- **URL versioning:** `/api/v1/leads`, `/api/v2/leads`
- **Header versioning:** `Accept: application/vnd.api+json;version=2`
- **Deprecation:** Announce 6–12 months ahead; sunset old version
- **Document:** Changelog, migration guide

**Tip:** Prefer URL versioning (simpler). Version when you have breaking changes, not for every release.

---

### Step 96: Documentation

**What:** API docs, integration guides, and changelogs for developers and users.

**Why:** Good docs reduce support load. Integrators need clear, accurate docs. Changelogs build trust.

**How:**
- **API docs:** OpenAPI/Swagger, or generated from code
- **Integration guide:** Step-by-step for common use cases
- **Changelog:** What changed, when, migration steps
- **Keep updated:** Docs drift. Review with each release.

**Tip:** Use Cursor to generate API docs from route handlers. Use tools like Redoc or Swagger UI for display.

---

### Step 97: Feedback Loops

**What:** Channels to collect user feedback, support tickets, and feature requests.

**Why:** Users tell you what's broken and what they want. Feedback drives prioritization.

**How:**
- **In-app:** Feedback widget, NPS survey
- **Support:** Email, chat, help center
- **Feature requests:** Canny, Productboard, or GitHub Discussions
- **Review:** Weekly or monthly; prioritize; close loop with users

**Tip:** Categorize feedback. Track themes. "10 users asked for X" beats "I think we need X."

---

### Step 98: A/B Testing

**What:** Run experiments to compare variants (e.g., two checkout flows).

**Why:** Data beats opinions. A/B tests tell you what actually improves metrics.

**How:**
- Use PostHog, Optimizely, or custom (feature flag + analytics)
- Define: hypothesis, metric, sample size, duration
- Randomly assign users to control vs variant
- Analyze: statistical significance, then ship winner

**Tip:** One test at a time per metric. Multiple tests need correction (e.g., Bonferroni). Start simple.

---

### Step 99: Compliance

**What:** GDPR, CCPA, SOC2, HIPAA—depending on your users and data.

**Why:** Non-compliance risks fines and loss of trust. Some customers require SOC2 or similar.

**How:**
- **GDPR/CCPA:** Consent, data export, deletion, privacy policy
- **SOC2:** Security controls, audit trail, access management
- **HIPAA:** If health data, BAA with vendors, encryption, access logs
- **Audit trail:** Log who did what, when; retain for compliance period

**Tip:** Start with privacy policy and consent. Add compliance as you target regulated industries.

---

### Step 100: Tech Debt

**What:** Deliberate refactors and cleanup to keep codebase maintainable.

**Why:** Debt compounds. Unmaintainable code slows every feature. Pay down debt to speed up.

**How:**
- Allocate 10–20% of sprint to debt
- Prioritize: high-traffic code, security-critical, blocking changes
- Document: ADRs for key decisions; known issues in README
- Prevent: code review, linting, testing

**Tip:** "Boy Scout rule": leave code better than you found it. Small improvements add up.

---

## Phase ∞: Ongoing (Steps 101+)

- **101.** Regular dependency updates
- **102.** Security audits
- **103.** Performance reviews
- **104.** Accessibility audits
- **105.** Documentation updates
- **106.** Onboarding improvements
- **107.** Cost optimization
- **108.** Feature prioritization
- **109.** Community & support
- **110.** Long-term roadmap

---

## Cursor-Specific Tips

| Task | How to Use Cursor |
|------|-------------------|
| **New project** | Describe structure; use `@codebase` for context |
| **Components** | Describe component + props; `@` reference design system |
| **API routes** | Reference existing routes with `@` for consistency |
| **Security** | Ask for validation, auth checks, rate limiting |
| **Tests** | Generate tests from code with `@` |
| **Refactors** | Use multi-file edits; `@codebase` for impact |
| **Docs** | Generate README, API docs from code |
| **Debugging** | Paste error + stack trace; ask for root cause |

### Useful Cursor Commands

- `@codebase` — Include project context in chat
- `@docs` — Reference external documentation
- `@file` — Reference specific file
- `Cmd+K` — Inline edit in editor
- `Cmd+L` — Open chat panel

### Prompting Tips

- **Be specific:** "Add Zod validation to the contact form" vs "fix the form"
- **Provide context:** `@` reference relevant files
- **Iterate:** Refine prompts based on output
- **Chunk work:** Break large tasks into smaller requests

---

## Quick Reference

### Priority Order for New Projects

1. Steps 1–10 (Foundation)
2. Steps 21–23 (Security basics)
3. Steps 11–17 (Design & UX)
4. Steps 51–52 (Error handling)
5. Steps 61–65 (Testing)
6. Steps 71–75 (Deployment)
7. Steps 81–85 (Monitoring)

### Checklist by Phase

| Phase | Focus | Time Estimate |
|-------|-------|---------------|
| 1 | Foundation | 1–2 weeks |
| 2 | Design & UX | 1–2 weeks |
| 3 | Security | Ongoing |
| 4 | Performance | 1 week + ongoing |
| 5 | AI/ML | 1–3 weeks |
| 6 | Stability | 1 week |
| 7 | Testing | Ongoing |
| 8 | Deployment | 1 week |
| 9 | Monitoring | 1 week + ongoing |
| 10 | Scale | As needed |

---

## See Also (Kolavi Studio)

This project implements many patterns from this guide. For project-specific details, see:

- **[ARCHITECTURE.md](./architecture/ARCHITECTURE.md)** — System design and structure
- **[SECURITY.md](../SECURITY.md)** — Security practices
- **[README.md](./README.md)** — Docs index
- **`scripts/check-secrets.sh`** — Pre-push hook to prevent committing secrets
- **`src/lib/db/schema.sql`** — Database schema with rate limits, pipeline jobs
- **`src/middleware.ts`** — CSP, security headers, auth, partner cookies

---

*Last updated: February 2025*
