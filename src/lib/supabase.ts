/**
 * Supabase client — lazy initialization
 * Only creates the client when first called at runtime (not at module load / build time).
 * This prevents Vercel build failures when env vars aren't available during static generation.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

/** Public client — uses anon key, respects RLS (read-only for public) */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set at runtime");
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

/** Admin client — uses service_role, bypasses RLS (for writes from API routes) */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE;
    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE must be set at runtime");
    }
    _supabaseAdmin = createClient(url, key);
  }
  return _supabaseAdmin;
}

// Legacy export for backward compat — lazy getter proxy
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
