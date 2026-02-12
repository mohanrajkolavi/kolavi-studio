/**
 * Safe parameter helpers for Postgres.js to avoid "could not determine data type of parameter" errors.
 *
 * PostgreSQL cannot infer parameter types in some contexts. Use these helpers:
 *
 * 1. ARRAY PARAMETERS: Always use sql.array(arr, oid) for text[] (e.g. jsonb_set path).
 *    - OID 1009 = text[] in PostgreSQL
 *
 * 2. JSON/JSONB: Use (${value})::jsonb not (${value}::text)::jsonb.
 *    - The ::jsonb cast lets PostgreSQL infer the parameter type.
 *
 * 3. NULL VALUES: Use sql`NULL` for conditional nulls instead of passing ${null}.
 *    - When the value is null, use: value !== null ? sql`${value}` : sql`NULL`
 *
 * 4. BOOLEAN in CASE: Generally fine; PostgreSQL infers from context.
 */

import sql from "./client";

/** PostgreSQL OID for text[] array type. Required for jsonb_set path parameter. */
export const TEXT_ARRAY_OID = 1009;

/**
 * Safe text[] parameter for jsonb_set and similar functions.
 * Use instead of passing a raw array to avoid "could not determine data type" error.
 */
export function textArray(value: string[]): ReturnType<typeof sql.array> {
  return sql.array(value, TEXT_ARRAY_OID);
}

/**
 * Safe fragment for nullable text. Use for TEXT columns that may be null.
 * Prevents "could not determine data type of parameter" when passing null.
 */
export function optionalText(value: string | null | undefined) {
  return value != null ? sql`${value}` : sql`NULL`;
}

/**
 * Safe fragment for nullable integer. Use for INTEGER columns that may be null.
 * Prevents "could not determine data type of parameter" when passing null.
 */
export function optionalInt(value: number | null | undefined) {
  return value != null ? sql`${value}` : sql`NULL`;
}
