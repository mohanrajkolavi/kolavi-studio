# Kolavi Studio - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies (if not already done)

```bash
npm install
```

### 2. Configure WordPress GraphQL URL

Edit `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WP_GRAPHQL_URL=https://your-wordpress-site.com/graphql
```

**Important:** You need a WordPress site with the WPGraphQL plugin installed.

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📄 Available Pages

- **Home:** [http://localhost:3000](http://localhost:3000)
- **Medical Spas:** [http://localhost:3000/medical-spas](http://localhost:3000/medical-spas)
- **Services:** [http://localhost:3000/services](http://localhost:3000/services)
- **Portfolio:** [http://localhost:3000/portfolio](http://localhost:3000/portfolio)
- **About:** [http://localhost:3000/about](http://localhost:3000/about)
- **Contact:** [http://localhost:3000/contact](http://localhost:3000/contact)
- **Blog:** [http://localhost:3000/blog](http://localhost:3000/blog)

## 🎨 Customization Quick Tips

### Update Site Name and Description

Edit `src/lib/constants.ts`:

```typescript
export const SITE_NAME = "Your Company Name";
export const SITE_DESCRIPTION = "Your description here";
```

### Change Colors

Edit `src/app/globals.css` - modify the CSS variables under `:root`.

### Add/Remove Navigation Links

Edit `src/lib/constants.ts`:

```typescript
export const NAV_LINKS = [
  { name: "Home", href: "/" },
  // Add or remove links here
];
```

### Replace Placeholder Images

Replace these files in `public/`:
- `logo.png` - Your logo
- `og-image.jpg` - Social media preview (1200x630px)
- `favicon.ico` - Browser icon

## 🔧 WordPress Setup (Required for Blog)

### Install WPGraphQL Plugin

1. Log into your WordPress admin
2. Go to Plugins → Add New
3. Search for "WPGraphQL"
4. Install and activate

### Configure WPGraphQL

1. Go to GraphQL → Settings
2. Enable public access to posts, categories, and tags
3. Copy your GraphQL endpoint URL (usually `/graphql`)
4. Update `.env.local` with this URL

### Create Content

1. Create some blog posts in WordPress
2. Add categories (e.g., "Medical Spa Marketing")
3. Add tags (optional)
4. Publish posts

### Test Blog

Visit [http://localhost:3000/blog](http://localhost:3000/blog) to see your posts.

## 🏗️ Build for Production

```bash
npm run build
npm start
```

The site will be available at [http://localhost:3000](http://localhost:3000).

## 📱 Test Mobile View

In your browser:
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M or Cmd+Shift+M)
3. Select a mobile device (iPhone, Pixel, etc.)
4. Test navigation and layout

## ✅ Pre-Launch Checklist

- [ ] Update `.env.local` with production URL
- [ ] Replace placeholder images
- [ ] Test all pages load correctly
- [ ] Verify blog works with WordPress
- [ ] Test mobile responsiveness
- [ ] Run Lighthouse audit
- [ ] Check SEO meta tags
- [ ] Test contact form (if backend added)

## 📚 Need More Help?

- **Detailed Setup:** See `SETUP.md`
- **Implementation Details:** See `IMPLEMENTATION_SUMMARY.md`
- **Project Overview:** See `README.md`

## 🐛 Common Issues

### Blog Pages Show Errors

**Problem:** Blog pages show GraphQL errors or no content.

**Solution:** 
1. Verify WordPress URL in `.env.local` is correct
2. Check WPGraphQL plugin is active
3. Ensure posts are published (not draft)
4. Test GraphQL endpoint directly in browser

### Images Not Loading

**Problem:** Images from WordPress don't display.

**Solution:**
1. Check image URLs are accessible
2. Verify `next.config.ts` allows WordPress domain
3. Check WordPress media library has images

### Port Already in Use

**Problem:** "Port 3000 is already in use"

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

## 🎉 You're Ready!

Your Kolavi Studio site is now running. Start customizing and adding content!
