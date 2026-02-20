# Kolavi Studio — Design System

Single source of truth for colors, typography, spacing, components, and motion. Implemented via **Tailwind CSS**, **CSS variables** in `src/app/globals.css`, and **Radix-based UI** in `src/components/ui/`.

---

## 1. Colors

All semantic colors use HSL values as CSS variables (no `hsl()` in the variable value). Tailwind wraps them with `hsl(var(--name))`. **Brand accent:** orange `24 95% 53%`.

### 1.1 Light mode (`:root`)

| Token | CSS Variable | HSL | Usage |
|-------|--------------|-----|--------|
| **Background** | `--background` | `0 0% 100%` | Page, panels |
| **Foreground** | `--foreground` | `240 10% 3.9%` | Body text |
| **Card** | `--card` | `0 0% 100%` | Cards, surfaces |
| **Card foreground** | `--card-foreground` | `240 10% 3.9%` | Text on cards |
| **Popover** | `--popover` | `0 0% 100%` | Dropdowns, popovers |
| **Popover foreground** | `--popover-foreground` | `240 10% 3.9%` | Text in popovers |
| **Primary** | `--primary` | `240 5.9% 10%` | Buttons, links, emphasis |
| **Primary foreground** | `--primary-foreground` | `0 0% 98%` | Text on primary |
| **Secondary** | `--secondary` | `240 4.8% 95.9%` | Secondary buttons, subtle bg |
| **Secondary foreground** | `--secondary-foreground` | `240 5.9% 10%` | Text on secondary |
| **Muted** | `--muted` | `240 4.8% 95.9%` | Muted backgrounds |
| **Muted foreground** | `--muted-foreground` | `240 3.8% 46.1%` | Placeholder, captions |
| **Accent** | `--accent` | `240 4.8% 95.9%` | Hover states, highlights |
| **Accent foreground** | `--accent-foreground` | `240 5.9% 10%` | Text on accent |
| **Destructive** | `--destructive` | `0 84.2% 60.2%` | Errors, delete actions |
| **Destructive foreground** | `--destructive-foreground` | `0 0% 98%` | Text on destructive |
| **Border** | `--border` | `240 5.9% 90%` | Borders, dividers |
| **Input** | `--input` | `240 5.9% 90%` | Input borders |
| **Ring** | `--ring` | `240 5.9% 10%` | Focus ring |
| **Chart 1** | `--chart-1` | `12 76% 61%` | Charts |
| **Chart 2** | `--chart-2` | `173 58% 39%` | Charts |
| **Chart 3** | `--chart-3` | `197 37% 24%` | Charts |
| **Chart 4** | `--chart-4` | `43 74% 66%` | Charts |
| **Chart 5** | `--chart-5` | `27 87% 67%` | Charts |

### 1.2 Dark mode (`.dark`)

| Token | CSS Variable | HSL | Notes |
|-------|--------------|-----|--------|
| **Background** | `--background` | `222 14% 11%` | Deep charcoal/slate |
| **Foreground** | `--foreground` | `0 0% 98%` | Off-white text |
| **Primary** | `--primary` | `24 95% 53%` | **Orange** (brand) |
| **Primary foreground** | `--primary-foreground` | `0 0% 100%` | White on primary |
| **Secondary / Muted / Accent** | — | `222 10% 18%` | Dark slate |
| **Muted foreground** | `--muted-foreground` | `220 9% 62%` | Mid gray |
| **Destructive** | `--destructive` | `0 62.8% 30.6%` | Dark red |
| **Border / Input** | `--border` | `222 10% 20%` | Dark borders |
| **Ring** | `--ring` | `24 95% 53%` | Orange focus |
| **Chart 1–5** | `--chart-*` | Orange, green, orange, purple, pink | Data viz |

### 1.3 Hardcoded brand orange (loaders, shimmer)

Used in `globals.css` for loading states (not via CSS variables):

- **Base:** `hsl(24 95% 53%)`
- **Highlight:** `hsl(30 95% 58%)` – `hsl(30 95% 60%)`

Use for: `.loading-bar-shimmer`, `.loader-ring`, `.generation-loading-bar`, `.step-pulse`, focus ring in dark.

---

## 2. Typography

- **Font family:** **Inter** (Google Font), `display: swap`. Set on `body` in `src/app/layout.tsx`.
- **Tailwind typography:** `@tailwindcss/typography` with `maxWidth: 65ch` for prose.
- **Font features:** `font-feature-settings: "rlig" 1, "calt" 1` on `body`.

### 2.1 Component-level

| Element | Classes | Notes |
|---------|--------|--------|
| Body | `bg-background text-foreground` | Base from globals |
| Card title | `font-semibold leading-none tracking-tight` | CardTitle |
| Card description | `text-sm text-muted-foreground` | CardDescription |
| Button | `text-sm font-medium` | Buttons |
| Label | `text-sm font-medium leading-none` | Form labels |
| Badge | `text-xs font-semibold` | Badges |
| Input / Textarea | `text-base md:text-sm` | Touch-friendly base, sm on desktop |
| Prose | Default typography plugin | `max-width: 65ch` |

---

## 3. Border radius

Defined in `:root` and referenced in Tailwind:

| Token | Value | Usage |
|-------|--------|--------|
| `--radius` | `0.5rem` (8px) | Base radius |
| **rounded-lg** | `var(--radius)` | Large radius |
| **rounded-md** | `calc(var(--radius) - 2px)` | Medium (6px) |
| **rounded-sm** | `calc(var(--radius) - 4px)` | Small (4px) |

**Card** uses `rounded-2xl` (1rem). **Theme toggle** uses `rounded-2xl`.

---

## 4. Spacing & layout

- **Tailwind default scale:** 0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96, 128 (× 0.25rem).
- **Card padding:** `p-6`, content/footer `pt-0`.
- **Dashboard grid:** 24×24px grid via `.dashboard-grid`.
- **Safe area:** `.safe-top`, `.safe-bottom`, `.safe-b` use `env(safe-area-inset-*)` for notched devices.

### 4.1 Touch targets

- Buttons: `min-h-[44px]` / `min-h-[48px]` on small screens, overridden to default with `sm:min-h-0` / `sm:min-w-0`.
- Input: `min-h-[48px]` with `md:min-h-0`.
- Icon button: `min-h-[44px] min-w-[44px]` with `sm:min-h-0 sm:min-w-0`.

---

## 5. Shadows

- **Default:** Tailwind `shadow-sm` on inputs, card, textarea.
- **Premium card shadow** (`.shadow-premium`):
  - Light: `0 1px 3px rgb(0 0 0 / 0.03)`, `0 6px 16px rgb(0 0 0 / 0.04)`, `0 12px 28px rgb(0 0 0 / 0.03)`.
  - Dark: `0 1px 3px rgb(0 0 0 / 0.15)`, `0 6px 20px rgb(0 0 0 / 0.25)`, `0 12px 32px rgb(0 0 0 / 0.2)`.
- **Dashboard:** Vercel-style “minimal, thin borders, no shadow” via `.dashboard-card` (`rounded-lg border border-border bg-card`).

---

## 6. Focus & accessibility

- **Focus visible:** `outline-2 outline-offset-2 outline-ring` (globals). Dark uses `outline-color: hsl(var(--ring))`.
- **Skip link:** `.sr-only` until focus; when focused: `focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:block focus:bg-primary focus:text-primary-foreground focus:ring-2 focus:ring-ring`.
- **Buttons/inputs:** `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (and `ring-offset-background` where used). Input/textarea use `focus-visible:ring-1 focus-visible:ring-foreground/20`.
- **Reduced motion:** All non-essential animations disabled inside `@media (prefers-reduced-motion: reduce)`.

---

## 7. Motion & animation

- **Default transition:** `duration-200 ease-out` for colors; `0.25s ease-out` for image zoom.
- **Button active:** `active:scale-[0.98]`.
- **Sheet close:** `CLOSE_ANIMATION_MS = 300`.
- **Keyframes:**
  - `loading-shimmer`: background position 200% → -200%.
  - `spin-slow`: rotate to 360deg.
  - `step-pulse`: ring 0→8px with orange, opacity constant.
  - `generation-loading-fade-in`: opacity 0→1, scale 0.96→1 in 0.35s.

### 7.1 Utility classes (motion)

| Class | Purpose |
|-------|--------|
| `.loading-bar-shimmer` | Orange gradient shimmer (2.5s) |
| `.loader-ring` | 48px ring spinner, orange top |
| `.step-active-ring` | Pulse ring for active step |
| `.generation-loading-card` | Fade-in for loading card |
| `.generation-loading-spinner` | 32px spinner |
| `.generation-loading-spinner-sm` | 16px spinner |
| `.generation-loading-spinner-on-orange` | White spinner on orange bg |
| `.generation-loading-bar` | Orange gradient bar |
| `.img-hover-zoom` | Scale image to 1.05 on hover (no motion if reduced-motion) |
| `.outline-section-row` | Hover/focus bg and border transition |
| `.outline-add-btn` | Hover translateX(2px) |
| `.outline-empty-btn` | Hover scale(1.02), active scale(0.98) |

All of the above respect `prefers-reduced-motion: reduce` (transitions/animations disabled or simplified).

---

## 8. UI components (variants)

### 8.1 Button (`buttonVariants`)

- **Variants:** `default` (primary), `destructive`, `outline`, `secondary`, `ghost`, `link`.
- **Sizes:** `default` (h-9, min-h 44px→0 on sm), `sm` (h-8, min-h 40px), `lg` (h-10, min-h 48px), `icon` (h-9 w-9, min 44×44→0 on sm).
- **Common:** `rounded-md`, `text-sm font-medium`, `transition-colors duration-200`, `active:scale-[0.98]`, focus ring 2, ring-offset 2, disabled opacity 50, SVG 4×4.

### 8.2 Badge (`badgeVariants`)

- **Variants:** `default` (primary), `secondary`, `destructive`, `outline`.
- **Base:** `rounded-full border px-2.5 py-0.5 text-xs font-semibold`, focus ring 2.

### 8.3 Input

- **Base:** `h-9 min-h-[48px] md:min-h-0`, `rounded-md border border-input bg-transparent px-3 py-2`, `text-base md:text-sm`, `shadow-sm`, `placeholder:text-muted-foreground`, `focus-visible:ring-1 focus-visible:ring-foreground/20`, disabled cursor and opacity.

### 8.4 Textarea

- **Base:** `min-h-[120px]`, same border/input/ring/placeholder/disabled as Input, `rounded-md`.

### 8.5 Label

- **Base:** `text-sm font-medium leading-none`, `peer-disabled:cursor-not-allowed peer-disabled:opacity-70`.

### 8.6 Card

- **Card:** `rounded-2xl border border-border bg-card text-card-foreground shadow-sm`.
- **CardHeader:** `flex flex-col space-y-1.5 p-6`.
- **CardTitle:** `font-semibold leading-none tracking-tight`.
- **CardDescription:** `text-sm text-muted-foreground`.
- **CardContent:** `p-6 pt-0`.
- **CardFooter:** `flex items-center p-6 pt-0`.

### 8.7 Select (trigger)

- **Base:** `h-10`, `rounded-md border border-input bg-background`, `px-3 py-2 text-sm`, `ring-offset-background`, `focus:ring-2 focus:ring-ring focus:ring-offset-2`, placeholder uses `text-muted-foreground`.

### 8.8 Sheet (overlay)

- **Backdrop:** `fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm`.

---

## 9. Utility classes (layout & visuals)

| Class | Purpose |
|-------|--------|
| `.scrollbar-hide` | Hide scrollbar (Chrome, Safari, Opera, IE, Edge, Firefox) |
| `.scrollbar-thin` | 6px scrollbar, `muted-foreground` thumb |
| `.dashboard-grid` | 24px theme-aware grid lines |
| `.page-gradient` | Top gradient from muted to background (light/dark) |
| `.dashboard-card` | `rounded-lg border border-border bg-card` (no shadow) |

---

## 10. Theme & dark mode

- **Strategy:** `class`-based (`darkMode: ["class"]` in Tailwind). Toggle adds/removes `.dark` on a parent (e.g. `html`).
- **Provider:** `ThemeProvider` from `@/components/ThemeProvider` (likely `next-themes`).
- **Toggle:** `ThemeToggle` — `h-9 w-9 rounded-2xl`, `text-muted-foreground`, `hover:bg-muted hover:text-foreground`, focus ring.

---

## 11. File reference

| What | Where |
|------|--------|
| CSS variables & utilities | `src/app/globals.css` |
| Tailwind theme (colors, radius, typography) | `tailwind.config.ts` |
| Root layout & font | `src/app/layout.tsx` |
| UI primitives | `src/components/ui/*` |
| Theme toggle | `src/components/ThemeToggle.tsx` |
| `cn()` helper | `src/lib/utils.ts` (clsx + twMerge) |

---

*Last consolidated from codebase: Feb 2025.*
