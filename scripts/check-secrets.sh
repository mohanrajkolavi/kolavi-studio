#!/bin/sh
# Pre-push hook: prevent committing sensitive files (public repo safety)
# Run: npm run check:secrets  or  ./scripts/check-secrets.sh

set -e

STAGED=$(git diff --cached --name-only 2>/dev/null || true)
if [ -z "$STAGED" ]; then
  exit 0
fi

SENSITIVE_PATTERN='\.env$|\.env\.local$|\.env\.(development|production|test)(\.local)?$|\.env\.(development|production)$'
if echo "$STAGED" | grep -qE "$SENSITIVE_PATTERN"; then
  echo "❌ ERROR: Attempting to commit .env or sensitive file. ABORT." >&2
  echo "   Never commit .env.local, .env, or env files with real credentials." >&2
  echo "   See SECURITY.md" >&2
  exit 1
fi

echo "✓ No sensitive files staged"
exit 0
