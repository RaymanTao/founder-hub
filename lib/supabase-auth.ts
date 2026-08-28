import { getSupabaseConfig } from "@/lib/supabase";

export function getSupabaseAuthConfig() {
  return {
    ...getSupabaseConfig(),
    anonKey:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.SUPABASE_SECRET_KEY ??
      ""
  };
}

export function isSupabaseAuthConfigured() {
  const config = getSupabaseAuthConfig();
  return Boolean(config.url && config.anonKey);
}

export async function supabaseAuthFetch(path: string, init: RequestInit = {}) {
  const config = getSupabaseAuthConfig();
  return fetch(`${config.url}/auth/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.anonKey,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    },
    cache: "no-store"
  });
}
