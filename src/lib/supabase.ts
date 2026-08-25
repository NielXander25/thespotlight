import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

/**
 * Browser/public client — respects Row Level Security.
 * Safe to use from client components (public submission form).
 */
export function getPublicClient(): SupabaseClient {
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

/**
 * Server-only client using the service role key — bypasses RLS.
 * NEVER import this into a client component or expose the key to the browser.
 * Used exclusively inside admin API routes, after the session cookie is verified.
 */
export function getAdminClient(): SupabaseClient {
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to your environment (server-side only)."
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
