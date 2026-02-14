# Responsive Optimization Plan

**Project:** Kolavi Studio  
**Goal:** Optimize all pages for mobile, tablet, and desktop across all screen sizes  
**Last updated:** February 13, 2025

---

## 1. Executive Summary

This plan covers responsive design optimization for 31+ pages across the public site, dashboard, and partner portal. The site uses Tailwind CSS with standard breakpoints (`sm`, `md`, `lg`, `xl`, `2xl`). Many pages already have responsive patterns; this plan identifies gaps and standardizes behavior across all device types.

---

## 2. Breakpoint Strategy

| Breakpoint | Min Width | Target Devices |
|------------|-----------|----------------|
| Default | 0px | Small phones (320px–479px) |
| `sm` | 640px | Large phones, small tablets |
| `md` | 768px | Tablets, small laptops |
| `lg` | 1024px | Laptops, small desktops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large desktops, ultrawide |

**Tailwind config:** No custom breakpoints; use defaults. Consider adding `xs` (480px) or `3xl` (1920px) only if needed.

---

## 3. Global Layout & Components

### 3.1 Root Layout (`src/app/layout.tsx`)

| Item | Status | Action |
|------|--------|--------|
| Viewport meta | ⚠️ Implicit | Add explicit `viewport` in metadata for mobile scaling |
| `overflow-x-clip` on main | ✅ | Keeps horizontal scroll contained |
| Skip link | ✅ | Accessible; ensure visible on focus |

**Action:** Add `viewport` to `getBaseMetadata()` in `src/lib/seo/metadata.ts`:
```ts
viewport: { width: "device-width", initialScale: 1, maximumScale: 5, viewportFit: "cover" }
```

---

### 3.2 Header (`src/components/layout/Header.tsx`)

| Item | Status | Action |
|------|--------|--------|
| Sticky header | ✅ | `sticky top-0 z-40` |
| Mobile menu | ✅ | Hamburger below `md` |
| Touch targets | ✅ | `min-h-[44px] min-w-[44px]` on menu button |
| Logo scaling | ✅ | `text-xl sm:text-2xl` |
| Padding | ✅ | `px-4 sm:px-6` |

**Gaps:**
- Very small screens (< 360px): Header pill may feel cramped. Consider `px-3 sm:px-4` for very small.
- Safe area: Add `padding-top: env(safe-area-inset-top)` for notched devices.

---

### 3.3 Mobile Nav (`src/components/layout/MobileNav.tsx`)

| Item | Status | Action |
|------|--------|--------|
| Full-screen overlay | ✅ | Good for mobile |
| Touch targets | ✅ | `min-h-[48px]` on links |
| Body scroll lock | ✅ | Prevents background scroll |
| Safe area | ⚠️ | Add `env(safe-area-inset-bottom)` for home-indicator devices |

---

### 3.4 Footer (`src/components/layout/Footer.tsx`)

| Item | Status | Action |
|------|--------|--------|
| Grid layout | ✅ | `grid-cols-1 sm:grid-cols-3 lg:grid-cols-12` |
| Bottom bar | ✅ | `flex-col sm:flex-row` |
| Link spacing | ✅ | Adequate |

**Gap:** On very small screens, footer links may wrap awkwardly. Ensure `gap-x-3 gap-y-1` and `flex-wrap` work well.

---

## 4. Public Site Pages

### 4.1 Home (`/`)

| Section | Status | Action |
|---------|--------|--------|
| Hero | ✅ | `text-4xl sm:text-5xl lg:text-6xl`, `py-12 sm:py-16 lg:py-20` |
| CTA buttons | ✅ | `flex-col sm:flex-row` |
| Industries strip | ✅ | `flex-col sm:flex-row` |
| Benefits | ✅ | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| Process | ✅ | Check section component |
| Testimonials | ✅ | Check section component |
| Bottom CTA | ✅ | Responsive |

**Action:** Audit Benefits, Process, Testimonials for small-phone (320px) edge cases.

---

### 4.2 About (`/about`)

| Item | Status | Action |
|------|--------|--------|
| Layout | ✅ | Uses shared patterns |
| Images | ⚠️ | Ensure `object-fit` and aspect ratios on all viewports |

---

### 4.3 Services (`/services`)

| Item | Status | Action |
|------|--------|--------|
| Grid | ✅ | Standard responsive grid |
| Cards | ⚠️ | Ensure no overflow on narrow screens |

---

### 4.4 Industries (`/industries`)

| Item | Status | Action |
|------|--------|--------|
| Layout | ✅ | Similar to Services |

---

### 4.5 Medical Spas (`/medical-spas`)

| Item | Status | Action |
|------|--------|--------|
| Layout | ✅ | Industry-specific page |

---

### 4.6 Portfolio (`/portfolio`)

| Item | Status | Action |
|------|--------|--------|
| Grid | ✅ | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` |
| Cards | ✅ | Card component handles overflow |

---

### 4.7 Contact (`/contact`)

| Item | Status | Action |
|------|--------|--------|
| Form | ✅ | `w-full sm:w-auto` on submit button |
| Third-party embeds | ⚠️ | Typeform/Tally/Google Form: ensure `data-tf-inline-on-mobile` and `min-height` scale |
| FAQ | ✅ | Uses FAQ component |

**Action:** Test iframe height on small phones (e.g. 320px); consider `min-h-[400px] sm:min-h-[500px]`.

---

### 4.8 Blog (`/blog`, `/blog/[slug]`, `/blog/category/*`, `/blog/tag/*`)

| Item | Status | Action |
|------|--------|--------|
| Hero | ✅ | Responsive typography |
| Stats/social strip | ✅ | `flex-col sm:flex-row` |
| Featured post | ✅ | `grid-cols-1 md:grid-cols-[1fr_1fr]` |
| Post grid | ⚠️ | Audit `BlogContent` grid breakpoints |
| Newsletter CTA | ✅ | Responsive |
| TOC (BlogPostTOC) | ⚠️ | Ensure sticky TOC doesn’t overlap on small screens; consider hide on mobile |

---

### 4.9 Legal Pages (`/terms`, `/privacy`, `/cookies`, `/disclaimer`)

| Item | Status | Action |
|------|--------|--------|
| Layout | ✅ | `LegalPageLayout` with `max-w-3xl` |
| Typography | ✅ | Prose; ensure readable line length |

---

### 4.10 Partner Portal (`/partner`, `/partner/apply`, `/partner/login`, `/partner/signup`, `/partner/terms`, `/partner/dashboard`)

| Item | Status | Action |
|------|--------|--------|
| Hero | ✅ | Matches home page pattern |
| Steps grid | ✅ | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| Forms | ⚠️ | Audit apply/login/signup forms on small screens |
| Dashboard | ⚠️ | Partner dashboard: ensure tables/cards are responsive |

---

## 5. Dashboard Pages

### 5.1 Layout (`src/app/dashboard/(main)/layout.tsx`)

| Item | Status | Action |
|------|--------|--------|
| Container | ✅ | `max-w-[1400px] px-6 sm:px-10 lg:px-12` |
| Nav strip | ⚠️ | Horizontal scroll on mobile; ensure `scrollbar-hide` and adequate padding |

**Action:** Add `px-4` for very small screens; ensure nav items don’t collapse.

---

### 5.2 Overview (`/dashboard`)

| Item | Status | Action |
|------|--------|--------|
| Stats grid | ✅ | `sm:grid-cols-2 lg:grid-cols-4` |
| Quick actions | ✅ | `sm:grid-cols-2 lg:grid-cols-3` |

---

### 5.3 Leads (`/dashboard/leads`)

| Item | Status | Action |
|------|--------|--------|
| Filters | ✅ | `flex-col sm:flex-row`, horizontal scroll for status pills |
| Table | ⚠️ | `overflow-x-auto`; Source column `hidden md:table-cell` |
| Lead detail modal | ✅ | `max-w-xl max-h-[90vh]`, `p-4` |

**Action:** Consider card-based layout for leads on mobile instead of table (optional enhancement).

---

### 5.4 Partners (`/dashboard/partners`, `/dashboard/partners/[id]`)

| Item | Status | Action |
|------|--------|--------|
| Tables/lists | ⚠️ | Audit for horizontal scroll and readability on small screens |

---

### 5.5 Content Writer (`/dashboard/blog`)

| Item | Status | Action |
|------|--------|--------|
| Layout | ⚠️ | Large page (~3300+ lines); likely multi-column on desktop |
| Mobile | ⚠️ | Ensure single-column, collapsible panels, readable inputs |

**Action:** Full audit of BlogMakerPage; prioritize mobile usability.

---

### 5.6 Content Maintenance (`/dashboard/content-maintenance`)

| Item | Status | Action |
|------|--------|--------|
| Layout | ⚠️ | Audit table/list responsiveness |

---

### 5.7 Recent (`/dashboard/recent`)

| Item | Status | Action |
|------|--------|--------|
| Layout | ⚠️ | Audit list/card layout |

---

### 5.8 Dashboard Login (`/dashboard/login`)

| Item | Status | Action |
|------|--------|--------|
| Form | ✅ | Centered, max-width |
| Touch targets | ⚠️ | Ensure inputs and buttons meet 44px minimum |

---

## 6. Shared Section Components

### 6.1 Benefits (`src/components/sections/Benefits.tsx`)

- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` ✅
- Icons: Fixed size; ensure no overflow on tiny screens

### 6.2 Process (`src/components/sections/Process.tsx`)

- Audit step layout on mobile (vertical vs horizontal)

### 6.3 Testimonials (`src/components/sections/Testimonials.tsx`)

- Carousel or grid: ensure swipe/touch works on mobile

### 6.4 CTA (`src/components/sections/CTA.tsx`)

- Standard responsive pattern

### 6.5 FAQ (`src/components/sections/FAQ.tsx`)

- Collapsible; ensure touch targets and spacing

---

## 7. Technical Checklist

### 7.1 Viewport & Meta

- [ ] Add explicit `viewport` in metadata
- [ ] Ensure no `user-scalable=no` (accessibility)

### 7.2 Touch Targets

- [ ] All interactive elements ≥ 44×44px on mobile
- [ ] Adequate spacing between tap targets (≥ 8px)

### 7.3 Typography

- [ ] Base font size ≥ 16px to avoid iOS zoom on focus
- [ ] Line length 45–75 characters for readability
- [ ] Headings scale: `text-2xl sm:text-3xl lg:text-4xl` pattern

### 7.4 Images

- [ ] `next/image` with `sizes` for responsive images
- [ ] `object-fit: cover` where appropriate
- [ ] Lazy loading for below-fold images

### 7.5 Forms

- [ ] Inputs full-width on mobile where appropriate
- [ ] Labels visible and associated
- [ ] Error states readable on small screens

### 7.6 Tables

- [ ] Horizontal scroll with `overflow-x-auto` and visual cue
- [ ] Consider card layout for mobile (optional)
- [ ] Sticky first column for wide tables (optional)

### 7.7 Modals & Overlays

- [ ] `max-h-[90vh]` or similar to avoid overflow
- [ ] Scrollable content area
- [ ] Close button always visible (sticky header)

### 7.8 Safe Areas

- [ ] `env(safe-area-inset-top)` for header on notched devices
- [ ] `env(safe-area-inset-bottom)` for mobile nav / fixed CTAs

---

## 8. Implementation Phases

### Phase 1: Foundation (1–2 days)

1. ✅ Add viewport metadata (`layout.tsx`: `viewport` export)
2. ✅ Add safe-area CSS variables and utilities; apply to Header, MobileNav, Footer
3. ✅ Audit and fix `overflow-x`: dashboard layout `overflow-x-clip`, `px-4` on small screens

### Phase 2: Public Site (2–3 days) ✅ DONE

1. ✅ Contact: responsive iframe heights (450px mobile, 600px desktop), form select touch targets (min-h-[44px])
2. ✅ Partner apply: select touch targets
3. ✅ Legal pages: min-w-0 on prose for overflow safety
4. ✅ Section components: min-w-0 on Benefits, Process, Testimonials grid items

### Phase 3: Dashboard (2–3 days) ✅ DONE

1. ✅ Dashboard layout: overflow-x-clip, px-4 on small screens (Phase 1)
2. ✅ DashboardNavStrip: min-h-[44px] touch targets on nav links
3. ✅ Leads: modal overflow-x-clip to prevent horizontal scroll
4. ✅ LoginForm: min-h-[44px] on password input
5. ✅ Content Writer: min-w-0 overflow-x-clip on main wrapper

### Phase 4: Partner Dashboard (1 day) ✅ DONE

1. ✅ Partner dashboard: min-w-0 overflow-x-clip on main
2. ✅ Partner apply: select touch targets (Phase 2)

### Phase 5: Polish & QA (1–2 days)

1. Test on real devices: iPhone SE, iPhone 14, iPad, Android phone, various desktops
2. Chrome DevTools device emulation
3. Fix any remaining overflow, touch target, or readability issues

---

## 9. Testing Matrix

| Device Type | Width | Priority |
|-------------|-------|----------|
| iPhone 5/SE (old) | 320px | High |
| iPhone SE | 375px | High |
| iPhone 14 | 390px | High |
| iPhone 14 Pro Max | 430px | Medium |
| Android (small) | 360px | High |
| iPad Mini | 768px | High |
| iPad Pro | 1024px | Medium |
| Laptop | 1366px | High |
| Desktop | 1920px | Medium |
| Ultrawide | 2560px | Low |

---

## 10. File Reference

| Area | Key Files |
|------|-----------|
| Layout | `src/app/layout.tsx`, `LayoutShell.tsx`, `Header.tsx`, `Footer.tsx`, `MobileNav.tsx` |
| Metadata | `src/lib/seo/metadata.ts` |
| Global CSS | `src/app/globals.css` |
| Dashboard | `src/app/dashboard/(main)/layout.tsx`, `DashboardNavStrip.tsx` |
| Sections | `src/components/sections/*.tsx` |
| Blog | `src/components/blog/BlogContent.tsx`, `BlogPostTOC.tsx` |

---

## 11. Success Criteria

- [ ] No horizontal scroll on any page at 320px–2560px
- [ ] All interactive elements meet 44×44px touch target on mobile
- [ ] Forms usable on 320px width
- [ ] Tables readable (scroll or card fallback) on mobile
- [ ] Modals fit viewport with scrollable content
- [ ] Typography readable without zooming
- [ ] Safe areas respected on notched devices
