/**
 * Supabase client — server-side (service_role for writes, anon for reads)
 * NEVER import this in client components — use server actions or API routes.
 * Gracefully handles missing env vars at build time.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE ?? "";

/** Public client — uses anon key, respects RLS (read-only for public) */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/** Admin client — uses service_role, bypasses RLS (for writes from API routes) */
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceRole);
