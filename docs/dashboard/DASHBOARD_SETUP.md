# Dashboard Setup Guide

This guide will help you set up the owner dashboard system with leads tracking, blog maker, and content maintenance.

## Prerequisites

1. **Vercel Postgres Database** (or Supabase/other Postgres)
   - If using Vercel: Go to your Vercel project → Storage → Create Postgres database
   - Copy the connection string

2. **Claude API Key**
   - Sign up at https://console.anthropic.com/
   - Create an API key
   - Copy the key (starts with `sk-ant-`)

3. **WordPress Site** (for blog publishing)
   - WordPress site with REST API enabled
   - Create an Application Password:
     - Go to Users → Profile → Application Passwords
     - Create a new password (e.g., "Next.js Blog Maker")
     - Copy the generated password (format: `xxxx xxxx xxxx xxxx xxxx xxxx`)

## Environment Variables

Copy `.env.example` to `.env.local` and fill in these values:

```bash
# Database (required)
DATABASE_URL=postgresql://user:password@host:port/database

# Admin Dashboard (required)
ADMIN_SECRET=your-long-random-secret-here
# Generate with: openssl rand -hex 32

# Claude API (required for blog maker)
ANTHROPIC_API_KEY=sk-ant-api03-...

# WordPress REST API (required for blog publishing)
WP_SITE_URL=https://your-wordpress-site.com
WP_USERNAME=your-wordpress-username
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx

# Existing variables (keep these)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
REVALIDATE_SECRET=your-secret-here
```

## Database Setup

1. **Run the schema SQL** in your database:
   - Option 1: Via Vercel Dashboard
     - Go to Storage → Your Postgres → SQL Editor
     - Copy and paste contents of `src/lib/db/schema.sql`
     - Run the query
   
   - Option 2: Via psql command line
     ```bash
     psql $DATABASE_URL < src/lib/db/schema.sql
     ```

2. **Verify tables created**:
   - `leads` table (for contact form submissions)
   - `content_maintenance` table (for blog post tracking)
   - `login_rate_limit` table (for login brute-force protection)

## Running Locally

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Access the dashboard**:
   - Visit http://localhost:3000/dashboard/login
   - Enter your `ADMIN_SECRET` as the password

## Features

### 1. Leads Dashboard (`/dashboard`)
- View all contact form submissions
- Filter by status, source, search by name/email
- Update lead status (new → contacted → proposal_sent → won/lost)
- Add internal notes
- Click a lead to see full details

### 2. Blog Maker (`/dashboard/blog`)
- Enter topic, audience, tone, keywords, length
- Generate blog post with Claude AI
- Edit generated content (title, meta description, outline, HTML content)
- Publish directly to WordPress (as draft or published)
- Automatically triggers cache revalidation

### 3. Content Maintenance (`/dashboard/content-maintenance`)
- View all blog posts from WordPress
- See age of each post (months since last modified)
- Track maintenance status:
  - Unreviewed (default)
  - Up to Date
  - Needs Review
  - Planned Refresh
- Add notes for each post
- Filter by status, age, category
- Mark posts as reviewed

## Contact Form Integration

The contact form at `/contact` now:
- Submits to `/api/contact` (when no third-party form is configured)
- Stores leads in the database
- Includes spam protection (honeypot field + rate limiting)
- Shows success/error messages

If you're using Typeform/Tally/Google Forms, you can still use those. To sync their submissions to your database, set up webhooks pointing to `/api/contact`.

## Security Notes

- **Admin Secret**: Use a strong random string (32+ characters)
- **Database URL**: Never commit to git (already in `.gitignore`)
- **API Keys**: Keep all secrets in `.env.local` (never commit)
- **Dashboard Routes**: Protected by middleware - requires `ADMIN_SECRET`
- **API Routes**: Protected by middleware - requires authentication
- **Login rate limit**: 3 failed attempts per IP → permanent lockout (until unlock code entered)
- **Login error message**: Generic "Invalid credentials" (no password hints)
- **Lockout unlock**: Set `RATE_LIMIT_UNLOCK_CODE` in env – enter in password field when locked to clear lockout (no default in source)

## Troubleshooting

### Database Connection Errors
- Verify `DATABASE_URL` is correct
- Check database is accessible from your network
- Ensure tables are created (run schema.sql)

### Claude API Errors
- Verify `ANTHROPIC_API_KEY` is correct
- Check API key has sufficient credits/quota
- Review error logs in browser console or server logs

### WordPress Publishing Errors
- Verify `WP_SITE_URL` is correct (no trailing slash)
- Check Application Password is correct (include spaces)
- Ensure WordPress REST API is enabled
- Check user has permission to create posts

### Authentication Issues
- Verify `ADMIN_SECRET` matches in `.env.local`
- Clear browser cookies and try logging in again
- Check middleware is protecting routes correctly

## Next Steps

1. **Set up production environment variables** in Vercel dashboard
2. **Test contact form** submission flow
3. **Generate your first blog post** with Claude
4. **Review content maintenance** and mark posts as reviewed
5. **Customize dashboard** styling/features as needed

## Support

For issues or questions:
- Check error logs in browser console (F12)
- Check server logs in terminal
- Review API responses in Network tab
- Verify all environment variables are set correctly
