export function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "",
    serviceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? ""
  };
}

function isHttpUrl(value: string) {
  return value.startsWith("https://") || value.startsWith("http://");
}

export function isSupabaseConfigured() {
  const config = getSupabaseConfig();
  return Boolean(config.url && isHttpUrl(config.url) && config.serviceRoleKey);
}

function isJwt(value: string) {
  return value.split(".").length === 3;
}

export async function supabaseFetch(path: string, init: RequestInit = {}) {
  const config = getSupabaseConfig();

  if (!isHttpUrl(config.url)) {
    throw new Error(
      "INVALID_SUPABASE_URL: NEXT_PUBLIC_SUPABASE_URL must be the Supabase Project URL, not a postgresql connection string."
    );
  }

  const headers: HeadersInit = {
    apikey: config.serviceRoleKey,
    "Content-Type": "application/json",
    ...(isJwt(config.serviceRoleKey) ? { Authorization: `Bearer ${config.serviceRoleKey}` } : {}),
    ...(init.headers ?? {})
  };

  const timeoutSignal = AbortSignal.timeout(5000);
  const signal = init.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal;

  return fetch(`${config.url}/rest/v1/${path}`, {
    cache: "no-store",
    ...init,
    signal,
    headers
  });
}
