export function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
  };
}

function isHttpUrl(value: string) {
  return value.startsWith("https://") || value.startsWith("http://");
}

export function isSupabaseConfigured() {
  const config = getSupabaseConfig();
  return Boolean(config.url && isHttpUrl(config.url) && config.serviceRoleKey);
}

export async function supabaseFetch(path: string, init: RequestInit = {}) {
  const config = getSupabaseConfig();

  if (!isHttpUrl(config.url)) {
    throw new Error(
      "INVALID_SUPABASE_URL: NEXT_PUBLIC_SUPABASE_URL must be the Supabase Project URL, not a postgresql connection string."
    );
  }

  return fetch(`${config.url}/rest/v1/${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });
}
