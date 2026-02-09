import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;

/** Server-only Supabase client with service role. Use in API routes only. Returns null if env is not set. */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _admin = createClient(url, key, { auth: { persistSession: false } });
  return _admin;
}

export type BlogHistoryRow = {
  id: string;
  created_at: string;
  focus_keyword: string | null;
  title: string;
  meta_description: string;
  outline: string[];
  content: string;
  suggested_slug: string | null;
  suggested_categories: string[] | null;
  suggested_tags: string[] | null;
  /** Total pipeline execution time in milliseconds (null/undefined for entries saved before this column existed). */
  generation_time_ms?: number | null;
};
