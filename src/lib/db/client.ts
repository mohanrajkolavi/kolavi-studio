import postgres, { type Sql } from "postgres";

let _sql: Sql | null = null;

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return url;
}

function getSql(): Sql {
  if (!_sql) {
    _sql = postgres(getDatabaseUrl(), {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      // Required for Supabase connection pooler (transaction mode / port 6543)
      prepare: false,
    });
  }
  return _sql;
}

// Lazy proxy: sql`...` and sql.end() etc. only init DB when used
const sql = new Proxy(((strings: TemplateStringsArray, ...values: unknown[]) =>
  (getSql() as (s: TemplateStringsArray, ...v: unknown[]) => unknown)(strings, ...values)) as Sql, {
  apply(_, __, args: unknown[]) {
    return (getSql() as (...a: unknown[]) => unknown)(...args);
  },
  get(_, prop) {
    return (getSql() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export default sql;

export async function query<T = unknown>(
  queryFn: (sql: Sql) => Promise<T>
): Promise<T> {
  try {
    return await queryFn(getSql());
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

const RETRYABLE_ERRORS = [
  "CONNECT_TIMEOUT",
  "Connection terminated",
  "connection refused",
];

function isRetryableError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : String(error);
  return RETRYABLE_ERRORS.some((pattern) => message.includes(pattern));
}

/**
 * Retry wrapper for database operations that may fail due to transient
 * connection issues (CONNECT_TIMEOUT, Connection terminated, connection refused).
 * Uses exponential backoff: 1s, 2s, etc.
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries && isRetryableError(error)) {
        const delayMs = 1000 * Math.pow(2, attempt); // 1s, 2s
        console.warn(
          `[withDbRetry] Retryable DB error (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms:`,
          error instanceof Error ? error.message : error
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw error;
    }
  }
  // Should not reach here, but satisfy TypeScript
  throw lastError;
}
