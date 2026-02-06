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
