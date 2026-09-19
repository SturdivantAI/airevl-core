"use client";

/**
 * The Academy's browser Supabase client — one lazy singleton, shared by the
 * provider and the auth callback route.
 *
 * Returns null when NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
 * are absent, which is what puts the Academy into demo mode. Never throws at
 * module load (house degradation rule).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
let _clientChecked = false;

export function getBrowserSupabase(): SupabaseClient | null {
  if (_clientChecked) return _client;
  _clientChecked = true;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  _client = createClient(url, key, {
    auth: {
      // Implicit flow, deliberately — not an oversight, and not to be "upgraded"
      // to PKCE without reading this first.
      //
      // Learners open the sign-in link from a mail app on a phone, which very
      // often hands it to a different browser (or an in-app webview) from the
      // one that asked for it. PKCE keeps its code verifier in the *requesting*
      // browser's storage, so a cross-browser open has nothing to exchange the
      // code with and the sign-in dies. Implicit carries the session in the URL
      // fragment, so it completes wherever the link lands.
      flowType: "implicit",
      // Consume the fragment wherever the link lands, including /auth/callback.
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return _client;
}

/** Test seam — drops the memoised client so a new env can be picked up. */
export function __resetBrowserSupabase(): void {
  _client = null;
  _clientChecked = false;
}
