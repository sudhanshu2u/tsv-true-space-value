import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? "";
const key = process.env.SUPABASE_SERVICE_KEY ?? "";

// Returns null when env vars are absent so callers can degrade gracefully.
export function getSupabase() {
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
