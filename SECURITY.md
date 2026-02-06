# Security Guide

This project uses Claude API, WordPress, and a database. Follow these practices to keep your deployment secure.

## Environment Variables (Never Commit)

**All secrets must be in `.env.local` (or your hosting provider's env settings). Never commit real values to git.**

| Variable | Purpose | Security |
|----------|---------|----------|
| `ADMIN_SECRET` | Dashboard login password | Use `openssl rand -hex 32` to generate. 32+ chars. |
| `RATE_LIMIT_UNLOCK_CODE` | Clears login lockout when entered | Set a unique code. Required for unlock; no default in source. |
| `DATABASE_URL` | Postgres connection | Never expose. Use connection pooling. |
| `ANTHROPIC_API_KEY` | Claude API | Protects AI usage. Rotate if exposed. |
| `WP_SITE_URL`, `WP_USERNAME`, `WP_APP_PASSWORD` | WordPress REST API | Application password, not main WP password. |
| `REVALIDATE_SECRET` | Cache revalidation webhook | Required for `POST /api/revalidate`. |
| `JINA_API_KEY` | Optional, Jina Reader | Only if you use it. |

## Public Repository

This repo may be public. **Never commit:**

- `.env` or `.env.local` (already in `.gitignore`)
- API keys, tokens, passwords
- Database URLs or credentials

**Check git history** if you ever accidentally committed secrets:

```bash
git log -p --all -- .env.local
```

If found, **rotate all secrets** and consider using [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) to remove from history.

## Login Security

- **3 failed attempts** → permanent lockout (no auto-expiry)
- **Unlock**: Enter `RATE_LIMIT_UNLOCK_CODE` in the password field when locked
- **No unlock code in source** – must be set via `RATE_LIMIT_UNLOCK_CODE` env var
- **Generic error**: "Invalid credentials" (no password hints)
- **IP-based rate limiting** stored in DB, hashed with `ADMIN_SECRET`

## Claude API Protection

- Dashboard requires `ADMIN_SECRET` – only you can access Blog Maker
- API routes are protected by middleware
- Set `ANTHROPIC_API_KEY` only in env (never in source)
- **Rotate immediately** if key is exposed – revoke in Anthropic console and create new

## Hosting (Vercel / Production)

1. Set all env vars in **Vercel Dashboard → Settings → Environment Variables**
2. Enable **HTTPS only**
3. Use **Vercel Postgres** or a managed DB – avoid exposing DB publicly
4. Restrict database access (IP allowlist if available)

## When to Rotate Secrets

- After any suspected breach
- If `.env.local` was ever committed
- When team members leave
- Periodically (e.g. every 90 days) as good practice

## Reporting Vulnerabilities

If you discover a security issue, do not open a public issue. Contact the repository owner privately.

## Files Safe to Commit

| File | Safe? |
|------|-------|
| `.env.example` | ✅ Placeholders only |
| `README.md`, `SETUP.md`, `SECURITY.md` | ✅ No secrets |
| `src/**`, `public/**` | ✅ No hardcoded secrets |
| `.env.local`, `.env`, `.env.*` | ❌ Never commit |
| `output/`, `*.pem`, `*.key`, `secrets/` | ❌ Ignored |

## Before Pushing to Public Repo

**Run before every push:**

```bash
npm run check:secrets
```

This blocks commits that include `.env`, `.env.local`, or other env files with real credentials.

**Manual checklist:**
1. `git status` – confirm `.env.local` is **not** listed
2. Never use `git add -f .env.local` – forces adding ignored files
3. Docs – use placeholders only (`your-domain.com`, `G-XXXXXXXXXX`, `sk-ant-api03-...`)
4. If you ever committed secrets: rotate all keys immediately and use [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) to purge from history
