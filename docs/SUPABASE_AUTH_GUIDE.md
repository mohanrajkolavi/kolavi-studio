# Supabase Auth Implementation Guide

This guide documents how Supabase Auth is used for the Partner Program login and invite flow.

---

## Table of Contents

1. [Overview](#overview)
2. [Supabase Project Setup](#supabase-project-setup)
3. [Environment Variables](#environment-variables)
4. [Database Schema](#database-schema)
5. [Architecture](#architecture)
6. [Flow Walkthrough](#flow-walkthrough)
7. [File Reference](#file-reference)
8. [Email Templates](#email-templates)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Partner Program uses **Supabase Auth** for:

- **Invite**: Admin sends invitation email to approved partners (no public signup page)
- **Set password**: Partner clicks invite link → sets password → account linked
- **Login**: Partners sign in with email + password
- **Session**: JWT stored in HTTP-only cookies, refreshed via middleware

**Flow**: Apply → Admin approves → Admin sends invite → Partner clicks link → Sets password → Dashboard

---

## Supabase Project Setup

### 1. Use Your Existing Project

If you already have a Supabase project (e.g. for your database), use that same project. Auth and database share the same project. No need to create a new one.

If you don't have a project yet: go to [supabase.com](https://supabase.com) → **New Project** → create one.

### 2. Get API Credentials

1. In the Supabase dashboard, go to **Project Settings** (gear icon)
2. Open **API** under Project Settings
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key (under Project API keys) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (for admin-only operations, e.g. Blog Maker)

### 3. Configure Authentication

1. Go to **Authentication** → **Providers**
2. **Email** provider should be enabled by default
3. (Optional) **Email confirmations**:
   - If **ON**: Users must confirm email before signing in; signup shows "check your email"
   - If **OFF**: Users can sign in immediately after signup
   - Path: Authentication → Providers → Email → "Confirm email"

4. **Auth settings** (Authentication → URL Configuration):
   - **Site URL**: `http://localhost:3000` (dev) or `https://kolavistudio.com` (prod)
   - **Redirect URLs**: Add these exactly:
     - `https://kolavistudio.com/**`
     - `https://kolavistudio.com/partner/set-password`
     - `http://localhost:3000/**`
     - `http://localhost:3000/partner/set-password`
   - If the set-password URL is missing, Supabase returns `access_denied` when users click invite links.

---

## Environment Variables

Add to `.env.local`:

```env
# Supabase Auth (required for partner login)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: for admin features (e.g. Blog Maker)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (for auth) | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (for auth) | Public anon key for client + server auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (for invite) | Admin key for `inviteUserByEmail`; use only server-side |

**Note:** `NEXT_PUBLIC_` vars are exposed to the browser. The anon key is safe to expose; it's restricted by Row Level Security (RLS). Never expose the service role key.

---

## Database Schema

The `partners` table must have a `supabase_user_id` column to link Supabase users to partner records.

From `src/lib/db/migrations/001_partner_program.sql`:

```sql
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id UUID UNIQUE,  -- Links to auth.users.id
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  commission_one_time_pct DECIMAL(5,2) DEFAULT 15.00,
  commission_recurring_pct DECIMAL(5,2) DEFAULT 10.00,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

If `partners` already exists but lacks `supabase_user_id`:

```sql
ALTER TABLE partners ADD COLUMN IF NOT EXISTS supabase_user_id UUID UNIQUE;
```

**Flow:**

- Admin approves application → partner row created with `supabase_user_id = NULL`
- Admin sends invite → `POST /api/partner/invite` calls `inviteUserByEmail` → partner receives email
- Partner clicks link → lands on `/partner/set-password` with session → sets password → `POST /api/partner/link-account` links account
- Partner logs in → session has `user.id` → we look up partner by `supabase_user_id`

---

## Architecture

### Clients

| File | Use Case |
|------|----------|
| `src/lib/supabase/client.ts` | **Browser** – Client Components (`createClient()`) |
| `src/lib/supabase/server-auth.ts` | **Server** – Server Components, Route Handlers, Server Actions (`createAuthClient()`) |
| `src/lib/supabase/middleware.ts` | **Middleware** – Refreshes session cookies on each request |

### Auth Flow

```
Request → Middleware (updateSupabaseSession) → Refreshes JWT in cookies
         → Route Handler / Server Component → createAuthClient() → getUser()
         → Partner lookup by supabase_user_id
```

### Supabase Required

Partner login uses **email + password** via Supabase Auth only. When Supabase env vars are not set, the login form shows a message that configuration is required.

---

## Flow Walkthrough

### 1. Partner Applies

- Route: `/partner/apply`
- Submits application (Full Name, email, phone, etc.) → stored in `partner_applications`

### 2. Admin Approves

- Admin creates partner in `partners` with `status='active'`, `supabase_user_id = NULL`
- Option: **Approve & send invite** sends invitation email immediately

### 3. Admin Sends Invite (if not sent on approval)

- Dashboard: Partners tab → **Send invite** button (for active, unlinked partners)
- `POST /api/partner/invite` with `{ partnerId }` → Supabase `inviteUserByEmail`
- Partner receives email with link to set password

### 4. Partner Sets Password

- Route: `/partner/set-password` (from invite link)
- Partner lands with session from invite token → sets password → `updateUser({ password })`
- `POST /api/partner/link-account` → updates `partners.supabase_user_id`
- Redirect to `/partner/dashboard`

### 5. Partner Logs In

- Route: `/partner/login`
- Form: email, password
- `supabase.auth.signInWithPassword({ email, password })`
- Redirect to `/partner/dashboard`

### 6. Protected Routes

- `getPartnerIdFromCookies()` in layout → redirects to `/partner/login` if no session
- `getPartnerFromRequest()` in API routes → returns 401 if no valid partner

### 7. Logout

- `POST /api/partner/logout` → `supabase.auth.signOut()` + clears legacy cookie

---

## File Reference

| File | Purpose |
|-----|---------|
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/supabase/server-auth.ts` | Server Supabase client (cookies) |
| `src/lib/supabase/server.ts` | Admin client (`getSupabaseAdmin`) for invite |
| `src/lib/supabase/middleware.ts` | Session refresh in middleware |
| `src/lib/partner-auth.ts` | `getPartnerFromRequest`, `getPartnerIdFromCookies` (Supabase + legacy) |
| `src/app/partner/set-password/page.tsx` | Set password form (from invite link) |
| `src/app/partner/login/page.tsx` | Login form (Supabase or legacy) |
| `src/app/partner/dashboard/layout.tsx` | Protected layout |
| `src/app/api/partner/invite/route.ts` | Admin: send invite email |
| `src/app/api/partner/link-account/route.ts` | Link Supabase user to partner |
| `src/app/api/partner/me/route.ts` | Partner data (uses `getPartnerFromRequest`) |
| `src/app/api/partner/logout/route.ts` | Sign out |
| `src/middleware.ts` | Calls `updateSupabaseSession` |

---

## Email Templates

**Supabase Dashboard** → Authentication → Email Templates

Customize the **Invite user** template for the partner invitation email. The default includes a link; ensure the redirect URL matches your Site URL and allowed Redirect URLs.

---

## Testing

### 1. Create a Test Partner

```sql
INSERT INTO partners (code, name, email, status)
VALUES ('TEST01', 'Test Partner', 'partner@example.com', 'active');
```

### 2. Send Invite

1. Log in to dashboard as admin
2. Go to Partners → find the test partner
3. Click **Send invite** (or use **Approve & send invite** when approving an application)
4. Partner receives email with link

### 3. Set Password (as partner)

1. Click the link in the invite email
2. Lands on `/partner/set-password`
3. Enter password and confirm
4. Should redirect to `/partner/dashboard`

### 4. Log In

1. Go to `/partner/login`
2. Enter email and password
3. Should redirect to `/partner/dashboard`

### 5. Verify Link

```sql
SELECT id, code, email, supabase_user_id FROM partners WHERE email = 'partner@example.com';
```

`supabase_user_id` should be a UUID after setting password.

---

## Troubleshooting

### "Missing NEXT_PUBLIC_SUPABASE_URL or anon key"

- Ensure both vars are in `.env.local`
- Restart dev server after changing env vars

### "Partner already has an account linked" on invite

- Partner must have `supabase_user_id IS NULL` to receive an invite
- Check: `SELECT id, email, supabase_user_id FROM partners WHERE email = '...'`

### "Invalid login credentials"

- Wrong password, or email not confirmed (if confirmation is ON)
- Check Supabase Dashboard → Authentication → Users for the user

### Session not persisting / 401 on refresh

- Middleware must run: `updateSupabaseSession` refreshes tokens
- CSP must allow Supabase: `connect-src` includes `https://*.supabase.co` and `wss://*.supabase.co`
- Check browser cookies: `sb-*-auth-token` should be present

### "Failed to link account"

- User must be signed in (session exists) when calling `/api/partner/link-account`
- Email in session must match an approved, unlinked partner

### CORS / CSP errors

- Add your domain to Supabase **Authentication** → **URL Configuration** → **Redirect URLs**
- Ensure `connect-src` in middleware includes Supabase domains

### "Something went wrong" when clicking set password link

1. **Check browser console** (F12 → Console) for the actual error message
2. **Supabase env vars**: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local` (or Vercel env vars for production)
3. **Redirect URLs**: In Supabase Dashboard → Authentication → URL Configuration, add:
   - `https://kolavistudio.com/partner/set-password` (production)
   - `http://localhost:3000/partner/set-password` (local dev)
4. **Invite link expired**: Supabase invite links are single-use and expire. Request a new invite from the admin
