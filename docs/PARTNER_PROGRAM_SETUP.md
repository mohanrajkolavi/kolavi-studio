# Partner Program Setup

## Overview

The Partner Program allows partners to earn commission when referred leads become paying clients:
- **15%** of one-time fees
- **10%** of monthly recurring revenue

## Database Migration

**Required:** Run the partner program migrations before using the program.

1. Open your database (Vercel Postgres SQL editor or psql)
2. Run the migrations in order:

```bash
# Via psql
psql $DATABASE_URL < src/lib/db/migrations/001_partner_program.sql
psql $DATABASE_URL < src/lib/db/migrations/002_application_status.sql
psql $DATABASE_URL < src/lib/db/migrations/003_partner_soft_delete.sql
psql $DATABASE_URL < src/lib/db/migrations/005_check_signup_rate_limit.sql
psql $DATABASE_URL -f src/lib/db/migrations/006_partner_phone.sql
```

- Migration 002 adds a `status` column to `partner_applications` so approved applications are hidden from the list (kept for audit).
- Migration 003 adds `deleted_at` to partners for soft delete. Deleted partners are kept for at least 3 months for financial records.
- Migration 006 adds `phone` to partners and partner_applications (required for the Add partner form).

## Link Format

Partners share: `https://yoursite.com/partner?ref=CODE`

When a visitor lands with `?ref=CODE`, a 30-day ref cookie may be set. **Cookie consent and security:** Tracking cookies (the 30-day ref cookie) must only be set after user consent to comply with GDPR, CCPA, and other privacy laws. Recommended cookie attributes: Secure, SameSite=Lax (or Strict). Keep cookies HttpOnly by default; for form fields, read values server-side and inject as hidden fields, or use a separate non-sensitive cookie for client-side access. Use HTTPS and a consent flow that records user opt-in before creating the ref cookie. This keeps the 30-day attribution mechanism compliant and protected against XSS/CSRF.

## Creating Partners

1. Partners apply at `/partner/apply`
2. Applications are stored in `partner_applications`
3. Admin approves and creates a partner in `partners` with a unique `code` and `status='active'`
4. Partner shares their link: `yoursite.com/partner?ref=CODE`

## Lead Attribution

- Contact form reads `partner_ref` cookie
- API validates code against active partners
- Lead is stored with `partner_id`, `referral_code`, `source='partner'`

## Commission

- Mark lead as `converted` when client pays
- Set `paid_at`, `one_time_amount`, `recurring_amount` on the lead
- **Currency:** All monetary fields (`one_time_amount`, `recurring_amount`, `paid_at` values) use USD unless otherwise configured
- **Rounding:** Round commission to 2 decimal places; fractional cents are rounded to nearest cent using round half away from zero (round half up). Examples: 1.005 → 1.01, 1.015 → 1.02, 1.004 → 1.00.
- **Recurring amount:** Refers to the monthly billing amount (or specify conversion if using a different billing period)
- **Commission formula:** 15% × one_time_amount + 10% × recurring_amount (per month)
- **Payout schedule:** Partners are paid after `paid_at` is set; define hold/verification period (e.g. 30 days) and cadence (e.g. monthly) in your payout policy

## Admin Dashboard (Phase 4)

Partner management UI at `/dashboard/partners` will be added in a future phase. For now, use a minimal guarded interface (e.g. CLI command `partners:manage` or REST endpoints POST /api/partners, PUT /api/partners/:id, DELETE /api/partners/:id) that enforces existing business validation, writes immutable audit records (who, when, action, diff), and validates referential integrity before applying changes. Do not instruct direct database manipulation; require audit log entries for all partner changes. Schema migrations and approved migration scripts (schema changes via psql/migrations) are allowed; ad-hoc data changes (manual INSERT/UPDATE/DELETE for partner records) are prohibited. All partner data changes must go through the guarded interfaces with immutable audit logs and referential integrity checks.

## Routes

| Route | Purpose |
|-------|---------|
| `/partner` | Landing page, sets cookie when `?ref=` is present |
| `/partner/apply` | Application form |
| `/partner/login` | Partner login (email + auth_code or password; do NOT use the public referral code from ?ref=CODE for authentication; use passwords or email one-time login links/codes; enforce rate limiting and brute-force protections; recommend MFA for partner accounts) |
| `/partner/dashboard` | Partner dashboard (stats, leads, payouts) |
| `/partner/terms` | Program terms |

## Partner Dashboard

Partners sign in at `/partner/login` with their email and password (or one-time auth code). The public referral code from their link is for attribution only, not authentication. They can view:
- Referral link (copy)
- Stats: referred leads, commission earned, pending, paid out
- Referred leads list
- Payment history
