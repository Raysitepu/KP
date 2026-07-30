import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

export function getSupabaseAdmin() {
  if (client !== undefined) return client;
  const url = process.env.SUPABASE_URL?.trim();
  const secret =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !secret) {
    client = null;
    return client;
  }
  client = createClient(url, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return client;
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseAdmin());
}
