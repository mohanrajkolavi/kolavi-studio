# Partner Detail View – Plan

## Industry Standards (Affiliate/Partner Admin Dashboards)

Based on Partnerize, Affise, GoAffPro, and similar platforms:

1. **Partner profile** – Name, email, code, status, commission rates, join date, notes
2. **Performance metrics** – Referred leads count, total commission earned, pending, paid
3. **Referred leads** – Leads attributed to this partner (name, email, status, revenue, commission)
4. **Payment history** – Payouts with amount, status, date, notes
5. **Activity** – Clicks, conversions, status changes (optional)

## Our Implementation

### 1. API: GET /api/partners/[id]

Returns full partner detail:

- **Partner** – id, code, name, email, status, commissionOneTimePct, commissionRecurringPct, notes, createdAt, updatedAt
- **Stats** – referredLeadsCount, totalCommissionEarned, pendingCommission, totalPaidOut. These aggregates must not be computed in real time on every request (scalability risk). Store them in a fast cache (e.g., Redis) or a persisted aggregate table (e.g., materialized view or `partner_stats` table). Invalidation/update strategies: incremental updates on lead/payout create/update/delete via DB triggers or application events, or an async background job that recomputes aggregates. Refresh policies: on-change invalidation + TTL, or event-driven updates. Update referredLeadsCount and commission totals atomically to avoid drift.
- **Referred leads** – leads where partner_id = id (id, name, email, status, paidAt, oneTimeAmount, recurringAmount, commission). Paginated via `?page` and `?limit` query params. Paged response shape: `{ referredLeads: [...], pagination: { page, limit, total, totalPages } }`
- **Payouts** – partner_payouts for this partner (id, amount, status, paidAt, notes, leadIds). Paginated via `?page` and `?limit` query params. Paged response shape: `{ payouts: [...], pagination: { page, limit, total, totalPages } }`
- **Commission formula** – For each referred lead, `commission` = (partner.commissionOneTimePct / 100) × lead.oneTimeAmount + (partner.commissionRecurringPct / 100) × lead.recurringAmount (recurring_amount is monthly billing amount)
- **Error responses**: 404 partner not found, 401 Unauthorized, 403 Forbidden, 500 Server error

### 2. Partner Detail Page: /dashboard/partners/[id]

- **Header** – Partner name, code badge, status, copy link, back to list
- **Profile card** – Email, commission rates (15% one-time, 10% recurring), join date, notes (editable)
- **Stats row** – 4 cards: Referred leads, Commission earned, Pending, Paid out
- **Referred leads table** – Name, email, status, revenue, commission, date
- **Payouts table** – Amount, status, date, notes
- **Actions** – Update status, update notes, record payout (deferred to future phase; show disabled "Record payout" button with tooltip "Coming Soon"). When implemented: required fields payout_date (ISO), amount (number), currency (default USD), recipient_id, method (e.g. bank_transfer), reference (optional); validation: amount > 0, payout_date valid; side effects: create Payout record, decrement partner balance, emit PayoutCreated event, audit log entry; success UX: confirmation modal; error UX: inline error messages; RBAC: admin or partner-admin role required

### 3. Navigation

- Partner rows in the partners table are clickable → navigate to /dashboard/partners/[id]
- Breadcrumb: Partners > [Partner Name]

### 4. Re-enable Partner Attribution

**Cookie spec:**
- Cookie name: `partner_ref`
- Payload: JSON `{ partner_id, referral_code, ts }` (ts = timestamp for tie resolution). Keep total size well under ~4KB per cookie (target ≤3.5KB). Use short key names, enforce max lengths for partner_id and referral_code, prefer URL-safe encoding (e.g., base64url or encodeURIComponent) when storing in cookies. Validate/truncate values; fall back to server-side storage if the encoded payload would exceed the limit.
- Expiration: 30 days
- Attributes: Secure, SameSite=Lax. Cookies should remain HttpOnly by default to protect against XSS. If client-side access is needed for form fields, use one of these safe alternatives: (1) read values server-side and inject into forms as hidden fields, (2) use a separate non-sensitive cookie explicitly marked for client-side access (e.g., a minimal flag or code-only cookie), or (3) rely on CSP and other XSS mitigations to safely read server-injected values.
- Set only after user consent (GDPR/CCPA). **Record opt-in before creating ref cookie:** Consent must be collected in a cookie banner, modal, or opt-in form. The exact event that must occur before creating the ref cookie is the explicit accept button handler (user clicks "Accept" or equivalent). Store consent in a consent record with fields: user_id or anonymous_id, timestamp, IP, consent_version; storage location: DB table `consents` or encrypted cookie. Withdrawal flow: provide an API/method to revoke consent (e.g., `revokeConsent(userId)`), which deletes the ref cookie, purges/flags associated personal data, and follows retention rules. For existing cookies belonging to non-consented users: scan and delete or refuse to read the ref cookie until opt-in; run a migration/cleanup job (e.g., `consent-cookie-cleanup` cron) to remove stale ref cookies.

**Attribution logic:**
- Three modes: (1) **pure_first_touch** — once partner_ref cookie is set it is never overwritten; (2) **last_touch** — each referral always overwrites partner_ref and timestamp; (3) **configurable** (default) — first-touch unless `allow_ref_override=true`, in which case treat as last-touch (overwrite partner_ref and timestamp on any new `?ref`). Cookie must store partner_ref and timestamp to break ties. When `allow_ref_override=true`, update timestamp on overwrite; when false, preserve timestamp.
- On first partner landing (`?ref=CODE`), set `partner_ref` according to the chosen mode.
- Expired or missing cookie → treat as direct traffic.
- Direct traffic after referral: (1) if partner cookie is still valid (within the 30-day window), direct returns should be attributed to the partner; (2) if the partner cookie has expired or been cleared, direct returns must not be attributed. Only unexpired partner cookies are honored for attribution.

**Contact form changes:**
- Add hidden fields `partner_id` and `referral_code` populated from `partner_ref` cookie.
- Persist to Lead with `source="partner"`.

**Edge cases:**
- Server-side fallback: if cookie missing, check referrer header. The fallback follows the same primary attribution model (first-touch as defined above). Do not use last-touch rules unless the system is explicitly configured for last-touch mode.
- Do not attribute when cookie expired or missing.
