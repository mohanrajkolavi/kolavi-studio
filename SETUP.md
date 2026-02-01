# Kolavi Studio - Setup Guide

## Project Overview

This is a production-ready Next.js website for Kolavi Studio, featuring:

- **Mobile-first design** with responsive layouts
- **SEO-first architecture** with metadata, JSON-LD schemas, and sitemap
- **Headless WordPress** integration via WPGraphQL
- **ISR (Incremental Static Regeneration)** for blog content
- **High performance** optimized for Core Web Vitals

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- WPGraphQL for WordPress content
- graphql-request for API calls

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Update `.env.local` with your settings:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_WP_GRAPHQL_URL=https://your-wordpress-site.com/graphql
```

**Important:** Replace the WordPress GraphQL URL with your actual WordPress installation that has WPGraphQL plugin installed.

### 3. WordPress Setup

On your WordPress site, install and activate:

1. **WPGraphQL** plugin (required)
2. Configure WPGraphQL settings to allow public access to posts, categories, and tags

### 4. Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### 5. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with header/footer
│   ├── page.tsx                 # Home page
│   ├── medical-spas/            # Medical spa vertical landing
│   ├── services/                # Services page
│   ├── portfolio/               # Portfolio page
│   ├── about/                   # About page
│   ├── contact/                 # Contact page
│   ├── blog/                    # Blog pages
│   │   ├── page.tsx            # Blog index
│   │   ├── [slug]/             # Individual blog posts
│   │   ├── category/[slug]/    # Category pages
│   │   └── tag/[slug]/         # Tag pages
│   ├── sitemap.ts              # Dynamic sitemap
│   └── robots.ts               # Robots.txt
├── components/
│   ├── layout/                  # Layout components
│   │   ├── Header.tsx          # Mobile-first header
│   │   ├── MobileNav.tsx       # Mobile navigation
│   │   ├── Footer.tsx          # Footer
│   │   └── CTAStrip.tsx        # CTA banner
│   ├── sections/                # Reusable page sections
│   │   ├── Hero.tsx
│   │   ├── Benefits.tsx
│   │   ├── Process.tsx
│   │   ├── Testimonials.tsx
│   │   ├── FAQ.tsx
│   │   └── CTA.tsx
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── graphql/                 # WordPress GraphQL integration
│   │   ├── client.ts           # GraphQL client
│   │   ├── queries.ts          # All GraphQL queries
│   │   └── types.ts            # TypeScript types
│   ├── seo/                     # SEO utilities
│   │   ├── metadata.ts         # Metadata helpers
│   │   ├── canonical.ts        # Canonical URL helper
│   │   └── jsonld/             # JSON-LD schemas
│   │       ├── organization.ts
│   │       ├── breadcrumb.ts
│   │       ├── article.ts
│   │       └── faq.ts
│   ├── constants.ts             # Site constants
│   └── utils.ts                 # Utility functions
└── types/
    └── global.d.ts              # Global TypeScript types
```

## Key Features

### Mobile-First Design

- All layouts start at 360-430px width
- Single-column layout by default
- Multi-column at `md:` breakpoint and above
- Hamburger menu with big tap targets (44px minimum)
- No horizontal scrolling at any breakpoint

### SEO Implementation

✅ **Metadata**
- Unique title and description per page
- Open Graph and Twitter Card meta tags
- Canonical URLs on all pages

✅ **JSON-LD Schemas**
- Organization schema (site-wide)
- Breadcrumb schema (blog pages)
- Article schema (blog posts)
- FAQ schema (pages with FAQs)

✅ **Sitemap & Robots**
- Dynamic sitemap including all static and blog routes
- Robots.txt with sitemap reference

✅ **Semantic HTML**
- One H1 per page
- Logical heading hierarchy (H2-H4)
- Proper semantic elements

### Blog with ISR

- **Revalidation:** 60 seconds (configurable)
- **Static Generation:** Top posts pre-rendered at build time
- **On-Demand:** Other posts generated on first request
- **Error Handling:** 404 for missing slugs

### Performance Optimizations

- Server components by default
- `next/image` for all images with lazy loading
- Minimal JavaScript bundle
- No unnecessary client-side state
- ISR for blog content

## Customization

### Adding New Pages

1. Create a new file in `src/app/[page-name]/page.tsx`
2. Export metadata using `getPageMetadata()`
3. Add the route to `NAV_LINKS` in `src/lib/constants.ts`
4. Update sitemap in `src/app/sitemap.ts` if needed

### Styling

- Modify `src/app/globals.css` for global styles
- Update `tailwind.config.ts` for theme customization
- Use shadcn/ui components from `src/components/ui/`

### Content

- Update copy in page components
- Replace placeholder images in `public/` folder:
  - `logo.png` - Your logo
  - `og-image.jpg` - Open Graph image (1200x630)
  - `favicon.ico` - Favicon

### Adding Future Verticals

When ready to add dental or law firm verticals:

1. Create new route: `src/app/dental/page.tsx` or `src/app/law-firms/page.tsx`
2. Follow the same pattern as `medical-spas/page.tsx`
3. Add to navigation in `src/lib/constants.ts`
4. Create corresponding blog categories in WordPress

## WordPress Content Requirements

### Required Fields

Your WordPress posts should include:
- Title
- Content
- Excerpt
- Featured Image
- Categories
- Tags (optional)
- Published Date
- Modified Date

### Recommended Categories

For medical spas vertical:
- Medical Spa Marketing
- SEO for Spas
- Web Design
- Social Media Marketing

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Compatible with any platform supporting Next.js:
- Netlify
- AWS Amplify
- Digital Ocean App Platform
- Self-hosted with Node.js

## Troubleshooting

### Blog Pages Not Loading

- Verify `NEXT_PUBLIC_WP_GRAPHQL_URL` is correct
- Check WPGraphQL plugin is active
- Ensure WordPress posts are published (not draft)
- Check browser console for GraphQL errors

### Images Not Displaying

- Verify WordPress media URLs are accessible
- Check `next.config.ts` has correct image domains
- Ensure images exist in WordPress media library

### Build Errors

- Run `npm install` to ensure all dependencies are installed
- Check for TypeScript errors: `npm run build`
- Verify environment variables are set

## Next Steps

1. **Replace Placeholder Content**
   - Update copy on all pages
   - Add real images and logos
   - Customize testimonials and portfolio items

2. **Configure WordPress**
   - Set up WPGraphQL
   - Create initial blog posts
   - Set up categories and tags

3. **SEO Optimization**
   - Add Google Analytics
   - Submit sitemap to Google Search Console
   - Configure meta descriptions for all pages

4. **Performance Testing**
   - Run Lighthouse audit
   - Test Core Web Vitals
   - Optimize images if needed

5. **Launch Checklist**
   - Update environment variables for production
   - Test all forms and links
   - Verify mobile responsiveness
   - Check all pages load correctly
   - Test blog functionality with real WordPress data

## Support

For questions or issues, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [WPGraphQL Documentation](https://www.wpgraphql.com/docs/introduction)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
