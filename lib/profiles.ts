import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase";

export type ReaderProfile = {
  email: string;
  display_name: string;
  avatar_url: string | null;
  provider: string;
  created_at?: string;
  updated_at?: string;
};

function defaultName(email: string) {
  return email.split("@")[0] || "Founder";
}

export function profileDefaults(input: {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  provider?: string | null;
}) {
  return {
    email: input.email.toLowerCase(),
    display_name: input.name?.trim() || defaultName(input.email),
    avatar_url: input.avatarUrl || null,
    provider: input.provider || "email"
  };
}

export async function getReaderProfile(email: string) {
  if (!isSupabaseConfigured()) {
    return profileDefaults({ email });
  }

  const response = await supabaseFetch(
    `profiles?email=eq.${encodeURIComponent(email.toLowerCase())}&select=email,display_name,avatar_url,provider,created_at,updated_at&limit=1`
  );
  if (!response.ok) return profileDefaults({ email });
  const profiles = (await response.json()) as ReaderProfile[];
  return profiles[0] ?? profileDefaults({ email });
}

export async function upsertReaderProfile(input: {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  provider?: string | null;
}) {
  if (!isSupabaseConfigured()) return profileDefaults(input);
  const profile = profileDefaults(input);
  const response = await supabaseFetch("profiles?on_conflict=email", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(profile)
  });
  if (!response.ok) return profile;
  const profiles = (await response.json()) as ReaderProfile[];
  return profiles[0] ?? profile;
}

export async function syncReaderProfileFromAuthUser(user: {
  email?: string;
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: { provider?: string } | null;
}) {
  if (!user.email) return null;
  const metadata = user.user_metadata ?? {};
  const name = typeof metadata.full_name === "string" ? metadata.full_name : typeof metadata.name === "string" ? metadata.name : null;
  const avatarUrl = typeof metadata.avatar_url === "string" ? metadata.avatar_url : typeof metadata.picture === "string" ? metadata.picture : null;
  return upsertReaderProfile({
    email: user.email,
    name,
    avatarUrl,
    provider: user.app_metadata?.provider || "email"
  });
}

export async function updateReaderProfile(email: string, input: {
  displayName: string;
  avatarUrl: string;
}) {
  if (!isSupabaseConfigured()) return;
  await supabaseFetch(`profiles?email=eq.${encodeURIComponent(email.toLowerCase())}`, {
    method: "PATCH",
    body: JSON.stringify({ display_name: input.displayName, avatar_url: input.avatarUrl || null })
  });
}
