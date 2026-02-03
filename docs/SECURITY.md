# Security – Keeping APIs and Secrets Safe

This project uses environment variables for any sensitive or environment-specific configuration. **Never commit real API keys, tokens, passwords, or production URLs.**

## What is gitignored

- **`.env`** and **`.env.local`** (and all `.env.*.local`) – ignored so they are never committed.
- **`.env.*`** – all other env files are ignored; only **`.env.example`** is tracked (placeholders only).
- **`*.pem`**, **`*.key`**, **`secrets/`** – keys and secret files are ignored.

See [.gitignore](../.gitignore) for the full list.

## What you must not commit

1. **Real API keys or tokens** – e.g. GA4 Measurement IDs, GTM IDs, or any third‑party API keys.
2. **Production URLs** – e.g. your real WordPress GraphQL URL or production domain in env files.
3. **Passwords or auth secrets** – e.g. WordPress application passwords, DB credentials.
4. **Private keys** – e.g. `.pem` or `.key` files for SSL or API auth.

All of these should live only in **`.env.local`** (or your host’s env config) and be kept off the repo.

## Safe defaults

- **Code** reads config from `process.env.NEXT_PUBLIC_*` only; no secrets are hardcoded.
- **`.env.example`** contains only placeholders (e.g. `your-wordpress-site.com`, `G-XXXXXXXXXX`). Copy it to `.env.local` and fill in real values locally; never put real values into `.env.example` or commit them.

## If something was committed by mistake

1. Rotate any exposed keys or passwords immediately (e.g. new GA property, new WP auth, new API key).
2. Remove the secret from history (e.g. `git filter-branch` or BFG Repo-Cleaner) or create a new repo and stop using the old one.
3. Re-check that `.env.local` and any real env files are in `.gitignore` and never committed.

## Deployment

On Vercel, Netlify, or other hosts, set environment variables in the dashboard only. Do not commit production values; the build uses the platform’s env at build time.
