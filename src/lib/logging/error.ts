/**
 * Structured error logging for API routes.
 *
 * Wraps console.error so we can scrub secrets that may appear in error messages
 * or stack traces (DB connection strings, anthropic/openai API keys, Supabase
 * service-role tokens). Our server-side errors occasionally include the full
 * DATABASE_URL in postgres driver messages; that is unsafe to ship to logs that
 * may be tailed by third parties.
 */

const SECRET_ENV_VARS = [
  "DATABASE_URL",
  "ADMIN_SECRET",
  "PARTNER_AUTH_SECRET",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "GOOGLE_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "WP_APPLICATION_PASSWORD",
] as const;

const CONNECTION_STRING_PATTERN = /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s'"`]+/gi;
const BEARER_TOKEN_PATTERN = /Bearer\s+[A-Za-z0-9._~+\/-]{20,}=*/gi;

function redact(input: string): string {
  let out = input;
  for (const name of SECRET_ENV_VARS) {
    const value = process.env[name];
    if (!value || value.length < 8) continue;
    out = out.split(value).join(`[redacted:${name}]`);
  }
  out = out.replace(CONNECTION_STRING_PATTERN, "[redacted:connection-string]");
  out = out.replace(BEARER_TOKEN_PATTERN, "Bearer [redacted]");
  return out;
}

function stringify(err: unknown): string {
  if (err instanceof Error) {
    return err.stack ? `${err.name}: ${err.message}\n${err.stack}` : `${err.name}: ${err.message}`;
  }
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export function logError(tag: string, err: unknown, extra?: Record<string, unknown>): void {
  const base = redact(stringify(err));
  if (extra && Object.keys(extra).length > 0) {
    try {
      const extraStr = redact(JSON.stringify(extra));
      console.error(`[${tag}]`, base, extraStr);
      return;
    } catch {
      // fall through
    }
  }
  console.error(`[${tag}]`, base);
}
